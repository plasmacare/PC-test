import { useEffect, useRef, useState } from 'react'
import { usePortalAuth } from '../lib/portalAuth.jsx'
import { supabase } from '../../lib/supabase'
import { notify, getPermission } from '../lib/notifications'
import Tabs from './Tabs'
import NotificationBanner from './NotificationBanner'
import logoIcon from '../assets/logo-icon.png'
import Dashboard from '../pages/staff/Dashboard'
import CatalogTab from '../pages/staff/CatalogTab'
import PagesTab from '../pages/staff/PagesTab'
import AnnouncementsTab from '../pages/staff/AnnouncementsTab'
import PaymentsTab from '../pages/staff/PaymentsTab'
import ViewsTab from '../pages/staff/ViewsTab'
import StaffAccessTab from '../pages/staff/StaffAccessTab'
import B2BRequestsTab from '../pages/staff/B2BRequestsTab'
import CollectionsTab from '../pages/staff/CollectionsTab'
import AdminNotifications from './AdminNotifications'
import PortalAccount from './PortalAccount'
import '../styles/admin.css'

const ALL_TAB_DEFS = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'catalog', label: 'Catalog' },
  { key: 'pages', label: 'Pages' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'payments', label: 'Payments' },
  { key: 'views', label: 'Views' },
  { key: 'b2b-requests', label: 'B2B Requests' },
  { key: 'collections', label: 'Collections' },
  { key: 'account', label: 'Account' },
]

export default function AdminShell() {
  const { logout, role, visibleTabs, staffProfile } = usePortalAuth()

  // Same login, same panel — the tab list is just filtered by role.
  // Admin always gets everything plus the Access tab to manage others.
  const tabs = role === 'admin'
    ? [...ALL_TAB_DEFS, { key: 'access', label: 'Access' }]
    : ALL_TAB_DEFS.filter((t) => visibleTabs.includes(t.key))

  const [tab, setTab] = useState(tabs[0]?.key || 'bookings')
  const seenIds = useRef(new Set())
  const sinceRef = useRef(new Date().toISOString())

  function announceNewBooking(b) {
    if (seenIds.current.has(b.id)) return
    seenIds.current.add(b.id)
    if (getPermission() === 'granted') {
      notify('New booking — Plasma Care', {
        body: `${b.customer_name || 'Someone'} · ₹${b.total_amount} · ${b.scheduled_date}`,
        tag: b.id,
      })
    }
  }

  // Primary path: instant alert via Supabase Realtime. Needs `bookings`
  // added to the realtime publication (supabase/enable_realtime.sql) —
  // without that this channel silently never fires.
  useEffect(() => {
    const channel = supabase
      .channel('admin-new-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
        announceNewBooking(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Backup path: poll for anything created since we opened the app, in
  // case realtime isn't set up yet or a socket briefly drops. Slower
  // (up to 30s) but doesn't depend on any extra configuration.
  useEffect(() => {
    const id = setInterval(async () => {
      const { data } = await supabase
        .from('bookings')
        .select('id, customer_name, total_amount, scheduled_date')
        .gt('created_at', sinceRef.current)
        .order('created_at', { ascending: true })
      if (data?.length) {
        data.forEach(announceNewBooking)
      }
    }, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header__brand">
          <img src={logoIcon} alt="" />
          <span>Plasma Care {role === 'admin' ? 'Admin' : (staffProfile?.role || 'Staff')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn--ghost" onClick={() => setTab('account')}>Account</button>
          <AdminNotifications />
          <button className="btn btn--ghost" onClick={logout}>Logout</button>
        </div>
      </header>

      <NotificationBanner />

      {tabs.length === 0 ? (
        <p style={{ padding: 24, color: '#666' }}>
          No tabs assigned to your account yet. Ask an admin to grant access.
        </p>
      ) : (
        <>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />

          {tab === 'bookings' && <Dashboard />}
          {tab === 'catalog' && <CatalogTab />}
          {tab === 'pages' && <PagesTab />}
          {tab === 'announcements' && <AnnouncementsTab />}
          {tab === 'payments' && <PaymentsTab />}
          {tab === 'views' && <ViewsTab />}
          {tab === 'access' && role === 'admin' && <StaffAccessTab />}
          {tab === 'b2b-requests' && role === 'admin' && <B2BRequestsTab />}
          {tab === 'collections' && <CollectionsTab />}
          {tab === 'account' && <PortalAccount />}
        </>
      )}
    </div>
  )
}
