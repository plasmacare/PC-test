import { supabase } from './supabase'
import { compressImage } from './imageCompress'
import { logEvent } from './telemetry'

export async function fetchPackages() {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchTests() {
  const { data, error } = await supabase
    .from('individual_tests')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
  if (error) throw error
  return data
}

async function fetchClientIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    return data.ip || null
  } catch {
    // Not fatal — spam detection just has one less signal for this booking.
    return null
  }
}

export async function createBooking({
  customerName,
  customerPhone,
  bookingType,
  selectedPackages,
  selectedTests,
  totalAmount,
  scheduledDate,
  address, // { fullAddress, landmark, latitude, longitude } | null
}) {
  const customerIp = await fetchClientIp()
  // Generated here (not read back from the DB) because the anon role no
  // longer has SELECT on bookings — see secure_public_booking_access.sql.
  // We already know every field we're inserting, so there's nothing to
  // read back; this also means insert() no longer needs .select().
  const id = crypto.randomUUID()

  const { error: bookingError } = await supabase.from('bookings').insert({
    id,
    customer_name: customerName,
    customer_phone: customerPhone,
    booking_type: bookingType,
    selected_packages: selectedPackages,
    selected_tests: selectedTests,
    total_amount: totalAmount,
    scheduled_date: scheduledDate,
    customer_ip: customerIp,
    status: 'pending',
  })

  if (bookingError) throw bookingError

  if (bookingType === 'home_collection' && address) {
    const { error: addressError } = await supabase.from('addresses').insert({
      booking_id: id,
      full_address: address.fullAddress,
      landmark: address.landmark || null,
      latitude: address.latitude,
      longitude: address.longitude,
    })
    if (addressError) throw addressError
  }

  logEvent({
    type: 'booking_created',
    source: 'customer',
    message: `New booking: ${bookingType}`,
    metadata: { booking_id: id, total_amount: totalAmount },
  })

  return {
    id,
    customer_name: customerName,
    customer_phone: customerPhone,
    booking_type: bookingType,
    selected_packages: selectedPackages,
    selected_tests: selectedTests,
    total_amount: totalAmount,
    scheduled_date: scheduledDate,
    status: 'pending',
  }
}

/** Uploads a (compressed) prescription photo and links it to the booking. */
export async function uploadPrescription(bookingId, file) {
  const compressed = await compressImage(file)
  const path = `${bookingId}/${Date.now()}-${compressed.name}`
  const { error: uploadError } = await supabase.storage.from('prescriptions').upload(path, compressed)
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('prescriptions').getPublicUrl(path)
  const { error } = await supabase.rpc('rpc_patch_booking', {
    p_id: bookingId,
    p_patch: { prescription_url: data.publicUrl },
  })
  if (error) throw error
  return data.publicUrl
}

/** Records why a prescription upload failed so admin can see it and follow up, instead of the booking just quietly missing a photo. */
export async function savePrescriptionUploadError(bookingId, message) {
  const { error } = await supabase.rpc('rpc_patch_booking', {
    p_id: bookingId,
    p_patch: { prescription_upload_error: message || null },
  })
  if (error) throw error
}

export async function savePatientDetails(bookingId, { name, age, gender, bloodGroup }) {
  const { error } = await supabase.rpc('rpc_patch_booking', {
    p_id: bookingId,
    p_patch: {
      patient_name: name || null,
      patient_age: age ? Number(age) : null,
      patient_gender: gender || null,
      patient_blood_group: bloodGroup || null,
    },
  })
  if (error) throw error
}

/**
 * Sends a (compressed) prescription photo to the analyze-prescription
 * edge function along with the current catalog, and gets back a read of
 * what's written plus suggested related tests. Callers should only act
 * on the result (pre-selecting tests) when confidence >= 99 — anything
 * lower and the customer should just pick tests manually.
 */
export async function analyzePrescription(file) {
  const compressed = await compressImage(file)
  const base64 = await fileToBase64(compressed)
  const [{ data: tests }, { data: packages }] = await Promise.all([
    supabase.from('individual_tests').select('id, name').eq('is_active', true),
    supabase.from('packages').select('id, name').eq('is_active', true),
  ])

  const { data, error } = await supabase.functions.invoke('analyze-prescription', {
    body: { imageBase64: base64, mediaType: compressed.type, tests, packages },
  })
  if (error) throw error
  return data
}

export async function savePrescriptionAiResult(bookingId, { confidence, summary }) {
  const { error } = await supabase.rpc('rpc_patch_booking', {
    p_id: bookingId,
    p_patch: { prescription_ai_confidence: confidence ?? null, prescription_ai_summary: summary || null },
  })
  if (error) throw error
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
