import { useEffect, useState } from 'react'
import { fetchMyBulkRequests, fetchBookingsForBulkRequest } from '../../lib/b2bData'

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  sample_collected: 'Sample Collected',
  report_ready: 'Report Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function B2BHistory() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [bookingsByRequest, setBookingsByRequest] = useState({})

  useEffect(() => {
    fetchMyBulkRequests().then(setRequests).catch((err) => setError(err.message))
  }, [])

  async function toggle(id) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!bookingsByRequest[id]) {
      try {
        const bookings = await fetchBookingsForBulkRequest(id)
        setBookingsByRequest((prev) => ({ ...prev, [id]: bookings }))
      } catch (err) {
        setError(err.message)
      }
    }
  }

  if (requests === null) return <p>Loading…</p>

  return (
    <div>
      <h2 style={{ color: 'var(--navy-950)', marginBottom: 16 }}>Registration History</h2>
      {error && <p className="login-error">{error}</p>}
      {requests.length === 0 ? (
        <p style={{ color: 'var(--slate)' }}>No registrations yet.</p>
      ) : (
        <div className="b2b-history-list">
          {requests.map((r) => {
            const isOpen = expandedId === r.id
            const bookings = bookingsByRequest[r.id]
            return (
              <div key={r.id} className="b2b-history-card">
                <button
                  type="button"
                  className="b2b-history-card__summary"
                  onClick={() => toggle(r.id)}
                >
                  <span>{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  <span>{r.patients?.length || 0} patient(s)</span>
                  <span>Registered {r.preferred_date || '—'}{r.sample_collection_time ? ` · Sample ${r.sample_collection_time}` : ''}</span>
                  <span className="b2b-history-card__chevron">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="b2b-history-card__details">
                    {r.notes && <p><strong>Notes:</strong> {r.notes}</p>}
                    <div className="b2b-table-wrap">
                      <table className="b2b-table">
                        <thead>
                          <tr><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Test / Package</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {(r.patients || []).map((p, i) => {
                            const booking = bookings?.find((b) => b.patient_name === p.name)
                            return (
                              <tr key={i}>
                                <td>{p.name}</td>
                                <td>{p.age}</td>
                                <td>{p.gender}</td>
                                <td>{p.phone}</td>
                                <td>{p.test_label || '—'}</td>
                                <td>
                                  {booking ? (
                                    <span className={`badge badge--${booking.status}`}>
                                      {STATUS_LABEL[booking.status] || booking.status}
                                    </span>
                                  ) : bookings ? '—' : 'Loading…'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
