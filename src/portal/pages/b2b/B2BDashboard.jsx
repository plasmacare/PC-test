import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMyBulkRequests } from '../../lib/b2bData'

export default function B2BDashboard() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyBulkRequests().then(setRequests).catch((err) => setError(err.message))
  }, [])

  const total = requests?.length || 0
  const submitted = requests?.filter((r) => r.status === 'submitted').length || 0
  const completed = requests?.filter((r) => r.status === 'completed').length || 0
  const patientsCount = requests?.reduce((sum, r) => sum + (r.patients?.length || 0), 0) || 0

  return (
    <div>
      {error && <p className="login-error">{error}</p>}

      <div className="b2b-stats">
        <div className="b2b-stat"><div className="b2b-stat__value">{total}</div><div className="b2b-stat__label">Total Registrations</div></div>
        <div className="b2b-stat"><div className="b2b-stat__value">{submitted}</div><div className="b2b-stat__label">Awaiting Processing</div></div>
        <div className="b2b-stat"><div className="b2b-stat__value">{completed}</div><div className="b2b-stat__label">Completed</div></div>
        <div className="b2b-stat"><div className="b2b-stat__value">{patientsCount}</div><div className="b2b-stat__label">Total Patients</div></div>
      </div>

      <Link to="/portal/b2b/registration" className="btn btn--primary" style={{ display: 'inline-block', marginBottom: 20 }}>
        + New Registration
      </Link>

      <h3 style={{ marginBottom: 10 }}>Recent</h3>
      {requests === null ? (
        <p>Loading…</p>
      ) : requests.length === 0 ? (
        <p style={{ color: 'var(--slate)' }}>No registrations yet.</p>
      ) : (
        <div className="b2b-table-wrap">
          <table className="b2b-table">
            <thead>
              <tr><th>Date</th><th>Patients</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {requests.slice(0, 5).map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                  <td>{r.patients?.length || 0}</td>
                  <td>{r.preferred_date || '—'}</td>
                  <td><span className={`badge badge--${r.status}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
