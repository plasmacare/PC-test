import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchBookingPayment, upiLinkToQrImageUrl, uploadPaymentScreenshot } from '../lib/payment'
import './PaymentStatus.css'

export default function PaymentStatus() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchBookingPayment(bookingId)
      setBooking(data)
    } catch {
      setError('Could not find this booking. Please check the link, or contact us at 8112060205.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  async function handleScreenshot(file) {
    setUploadError('')
    setUploading(true)
    try {
      const url = await uploadPaymentScreenshot(bookingId, file)
      setBooking((b) => ({ ...b, payment_screenshot_url: url, payment_status: 'screenshot_uploaded' }))
    } catch (err) {
      setUploadError(err.message || 'Could not upload the screenshot. Please try again or WhatsApp it to us directly.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page payment-status">
      <div className="payment-status__card">
        <h1>Payment</h1>

        {loading && <p className="payment-status__hint">Loading…</p>}
        {error && <p className="payment-status__error">{error}</p>}

        {!loading && !error && booking && (
          <>
            {(!booking.payment_status || booking.payment_status === 'none') && (
              <p className="payment-status__hint">
                No payment has been requested for this booking yet. Our team will send you a payment link here once
                it's ready.
              </p>
            )}

            {booking.payment_status === 'requested' && booking.payment_method === 'upi' && (
              <>
                <p className="payment-status__amount">₹{booking.payment_requested_amount}</p>
                <p className="payment-status__hint">Scan with any UPI app to pay.</p>
                <img
                  src={upiLinkToQrImageUrl(booking.payment_link)}
                  alt="UPI QR code"
                  className="payment-status__qr"
                />
                <a className="btn btn--secondary payment-status__pay-btn" href={booking.payment_link}>
                  Open in UPI app
                </a>
                <div className="payment-status__proof">
                  <p className="payment-status__hint">Already paid? Upload a screenshot as proof — our team will confirm it shortly.</p>
                  <label className="btn btn--primary btn--block">
                    {uploading ? 'Uploading…' : 'Upload payment screenshot'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploading}
                      onChange={(e) => e.target.files[0] && handleScreenshot(e.target.files[0])}
                    />
                  </label>
                  {uploadError && <p className="payment-status__error">{uploadError}</p>}
                </div>
              </>
            )}

            {booking.payment_status === 'requested' && booking.payment_method === 'razorpay' && (
              <>
                <p className="payment-status__amount">₹{booking.payment_requested_amount}</p>
                <a className="btn btn--primary btn--block" href={booking.payment_link} target="_blank" rel="noreferrer">
                  Pay Now
                </a>
                <p className="payment-status__hint payment-status__hint--small">
                  This page will update automatically once your payment is confirmed — no need to send a screenshot.
                </p>
              </>
            )}

            {booking.payment_status === 'screenshot_uploaded' && (
              <>
                <div className="payment-status__icon payment-status__icon--pending">⏳</div>
                <p className="payment-status__hint">
                  Screenshot received — our team will confirm your payment shortly.
                </p>
                {booking.payment_screenshot_url && (
                  <img src={booking.payment_screenshot_url} alt="Your uploaded screenshot" className="payment-status__proof-preview" />
                )}
              </>
            )}

            {booking.payment_status === 'paid' && (
              <>
                <div className="payment-status__icon payment-status__icon--paid">✓</div>
                <p className="payment-status__hint">Payment received — ₹{booking.payment_requested_amount}. Thank you!</p>
              </>
            )}
          </>
        )}

        <Link to="/" className="payment-status__home">Back to home</Link>
      </div>
    </div>
  )
}
