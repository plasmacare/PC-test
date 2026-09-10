import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import PathologyBooking from './pages/PathologyBooking'
import LegalPage from './pages/LegalPage'
import PaymentStatus from './pages/PaymentStatus'
import ReportView from './pages/ReportView'
import SiteBackground from './components/SiteBackground'
import Analytics from './components/Analytics'
import MaintenanceScreen from './components/MaintenanceScreen'
import LowInternetNotice from './components/LowInternetNotice'
import { fetchMaintenanceSettings, subscribeMaintenanceSettings } from './lib/maintenance'

// Staff/Admin/B2B portal — lazy-loaded so a first-time customer visiting
// the booking site never downloads any of this code.
const PortalRoutes = lazy(() => import('./portal/PortalRoutes'))

export default function App() {
  const location = useLocation()
  const isPortalRoute = location.pathname.startsWith('/portal')
  const [maintenance, setMaintenance] = useState(null)

  useEffect(() => {
    fetchMaintenanceSettings().then(setMaintenance)
    return subscribeMaintenanceSettings(setMaintenance)
  }, [])

  // /portal/* is never blocked by customer maintenance — staff, admin,
  // developer, and B2B logins are unaffected by this toggle.
  if (!isPortalRoute && maintenance?.maintenance_customer) {
    return <MaintenanceScreen message={maintenance.maintenance_message} />
  }

  return (
    <>
      <SiteBackground />
      {!isPortalRoute && <LowInternetNotice />}
      {/* Customer-only: page-view logging + the "site-viewers" Presence
          channel. Must NOT mount on /portal/* — staff/admin/B2B sessions
          aren't customer traffic, and joining the same Presence channel
          twice in one tab (once here, once from the Views tab) throws
          "cannot add presence callbacks after subscribe()". */}
      {!isPortalRoute && <Analytics />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/pathology" element={<PathologyBooking />} />
        <Route path="/pages/:slug" element={<LegalPage />} />
        <Route path="/pay/:bookingId" element={<PaymentStatus />} />
        <Route path="/report/:bookingId" element={<ReportView />} />
        <Route
          path="/portal/*"
          element={
            <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
              <PortalRoutes />
            </Suspense>
          }
        />
        {/* Safety net: any unmatched route (a stale link, a typo, a
            leftover hash fragment main.jsx didn't recognize) redirects
            home instead of silently rendering a blank page. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
