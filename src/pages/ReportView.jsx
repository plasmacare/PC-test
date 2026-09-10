import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './PaymentStatus.css'

export default function ReportView() {
  const { bookingId } = useParams()
  const [reportUrl, setReportUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .rpc('rpc_get_booking', { p_id: bookingId })
      .then(({ data, error: err }) => {
        if (err) throw err
        if (!data) throw new Error('not found')
        setReportUrl(data.report_url)
      })
      .catch(() => setError('Could not find this report. Please check the link, or contact us at 8112060205.'))
      .finally(() => setLoading(false))
  }, [bookingId])

  return (
    <div className="page payment-status">
      <div className="payment-status__card">
        <h1>Lab Report</h1>
        {loading && <p className="payment-status__hint">Loading…</p>}
        {error && <p className="payment-status__error">{error}</p>}
        {!loading && !error && (
          reportUrl ? (
            <a className="btn btn--primary btn--block" href={reportUrl} target="_blank" rel="noreferrer">
              Download report
            </a>
          ) : (
            <p className="payment-status__hint">
              Your report isn't ready yet. We'll WhatsApp you as soon as it's available — for questions, call/WhatsApp
              8112060205.
            </p>
          )
        )}
        <Link to="/" className="payment-status__home">Back to home</Link>
      </div>
    </div>
  )
}
