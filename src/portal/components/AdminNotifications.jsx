import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { usePortalAuth } from '../lib/portalAuth.jsx'
import './adminNotifications.css'

export default function AdminNotifications() {
  const { role } = usePortalAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)

  async function load() {
    const results = []

    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, customer_name, booking_type, b2b_account_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(15)
    for (const b of bookings || []) {
      results.push({
        id: `booking:${b.id}`,
        time: b.created_at,
        text: b.b2b_account_id
          ? `New B2B booking — ${b.customer_name}`
          : `New booking — ${b.customer_name} (${b.booking_type === 'home_collection' ? 'home collection' : 'lab visit'})`,
      })
    }

    // Only admin can read b2b_requests (RLS) — skip quietly for other roles.
    if (role === 'admin') {
      const { data: requests } = await supabase
        .from('b2b_requests')
        .select('id, company_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      for (const r of requests || []) {
        results.push({
          id: `b2b-request:${r.id}`,
          time: r.created_at,
          text: `B2B access request — ${r.company_name} (${r.status})`,
        })
      }
    }

    results.sort((a, b) => new Date(b.time) - new Date(a.time))
    setItems(results.slice(0, 20))
    setLoaded(true)
  }

  useEffect(() => {
    load()
    // Live updates: new bookings and B2B requests push straight into the feed.
    const channel = supabase
      .channel('admin-notifications-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b2b_requests' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  return (
    <div className="admin-notifications">
      <button type="button" className="admin-notifications__trigger" onClick={() => setOpen((o) => !o)}>
        🔔 Notifications {loaded && items.length > 0 ? `(${items.length})` : ''}
      </button>
      {open && (
        <div className="admin-notifications__panel">
          {items.length === 0 ? (
            <p className="admin-notifications__empty">Nothing yet.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="admin-notifications__item">
                <span>{item.text}</span>
                <span className="admin-notifications__time">
                  {new Date(item.time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
