import { supabase } from './supabase'

/** Global payment rule set by admin — same for every customer, read once at the start of booking. */
export async function fetchPaymentSettings() {
  const { data, error } = await supabase.from('payment_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

/** Full amount, or the admin-configured percentage of it for partial payments. */
export function computeRequiredAmount(totalAmount, settings) {
  const full = Number(totalAmount) || 0
  if (settings?.payment_type === 'partial') {
    return Math.round((full * (Number(settings.partial_percentage) || 50)) / 100)
  }
  return full
}

/**
 * Creates the payment request for a just-created booking, right inline
 * in the booking flow — no separate admin step needed. For UPI, builds
 * the deep-link client-side. For Razorpay, calls the create-payment-link
 * Edge Function (same one the admin panel uses).
 */
export async function createPaymentRequest(booking, settings) {
  const amount = computeRequiredAmount(booking.total_amount ?? booking.totalAmount, settings)
  let link
  let razorpayPaymentLinkId = null

  if (settings.mode === 'razorpay') {
    const { data, error } = await supabase.functions.invoke('create-payment-link', {
      body: {
        amount,
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        description: `Plasma Care booking ${booking.id.slice(0, 8).toUpperCase()}`,
      },
    })
    if (error) {
      // supabase-js shows this exact generic message when the fetch to
      // the function's URL never got a response at all — almost always
      // because the `create-payment-link` Edge Function hasn't been
      // deployed yet, not a problem with this booking or this code.
      if (String(error.message || '').includes('Failed to send a request')) {
        throw new Error(
          'Payment setup isn\u2019t reachable — the create-payment-link Edge Function likely hasn\u2019t been deployed yet. See the admin README\u2019s Razorpay setup section.',
        )
      }
      // The function itself is reachable but responded with an error
      // status (400/500/502) — our function always returns a JSON body
      // like {error, details} even on failure, so read the *real*
      // reason out of the response instead of showing the SDK's
      // generic "non-2xx status code" wrapper text.
      if (error.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.clone().json()
          const detail = body?.details?.error?.description || body?.details?.error?.reason
          throw new Error([body?.error, detail].filter(Boolean).join(' — ') || error.message)
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr
        }
      }
      throw error
    }
    link = data.link
    razorpayPaymentLinkId = data.id
  } else {
    link =
      `upi://pay?pa=${encodeURIComponent(settings.upi_id)}&pn=${encodeURIComponent(settings.upi_payee_name || 'Plasma Care')}` +
      `&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(`Plasma Care ${booking.id.slice(0, 8).toUpperCase()}`)}`
  }

  const { error: saveError } = await supabase.rpc('rpc_patch_booking', {
    p_id: booking.id,
    p_patch: {
      payment_requested_amount: amount,
      payment_method: settings.mode,
      payment_link: link,
      payment_status: 'requested',
      razorpay_payment_link_id: razorpayPaymentLinkId,
    },
  })
  if (saveError) throw saveError

  return { amount, method: settings.mode, link }
}

/** Turns a saved UPI deep-link (upi://...) into a scannable QR image — same public QR renderer the admin panel uses, no API key needed. */
export function upiLinkToQrImageUrl(upiLink) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`
}

export async function fetchBookingPayment(bookingId) {
  const { data, error } = await supabase.rpc('rpc_get_booking', { p_id: bookingId })
  if (error) throw error
  if (!data) throw new Error('Booking not found')
  return data
}

/** Uploads proof-of-payment screenshot and marks the booking as awaiting confirmation. */
export async function uploadPaymentScreenshot(bookingId, file) {
  const path = `${bookingId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(path, file, { upsert: true })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('payment-proofs').getPublicUrl(path)
  const { error } = await supabase.rpc('rpc_patch_booking', {
    p_id: bookingId,
    p_patch: { payment_screenshot_url: data.publicUrl, payment_status: 'screenshot_uploaded' },
  })
  if (error) throw error
  return data.publicUrl
}
