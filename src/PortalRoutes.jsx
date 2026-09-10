import { Routes, Route } from 'react-router-dom'
import { PortalAuthProvider } from './lib/portalAuth.jsx'
import PortalGate from './components/PortalGate'
import Login from './pages/Login'
import RequestAccess from './pages/RequestAccess'
import AcceptInvite from './pages/AcceptInvite'
import MfaEnroll from './pages/MfaEnroll'
import MfaVerify from './pages/MfaVerify'
import AdminShell from './components/AdminShell'
import B2BShell from './pages/b2b/B2BShell'
import B2BDashboard from './pages/b2b/B2BDashboard'
import B2BBulkAdd from './pages/b2b/B2BBulkAdd'
import B2BHistory from './pages/b2b/B2BHistory'
import PortalAccount from './components/PortalAccount'
import DevPulse from './pages/dev/DevPulse'
import './pages/portal.css'

// Mounted at /portal/* from the main App.jsx, behind React.lazy — none
// of this (Supabase MFA, admin tabs, B2B forms) is in the public bundle
// a first-time customer downloads.
export default function PortalRoutes() {
  return (
    <PortalAuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="request-access" element={<RequestAccess />} />
        <Route path="accept-invite" element={<AcceptInvite />} />
        <Route path="mfa/enroll" element={<MfaEnroll />} />
        <Route path="mfa/verify" element={<MfaVerify />} />

        {/* Staff, Admin, and anyone granted the "Collections" tab all
            share this one panel — collection work is just a tab an
            admin turns on for someone via Access, not a separate role
            or a separate portal. */}
        <Route
          path="staff/*"
          element={
            <PortalGate allow="staff">
              <AdminShell />
            </PortalGate>
          }
        />

        <Route
          path="b2b/*"
          element={
            <PortalGate allow="b2b">
              <B2BShell />
            </PortalGate>
          }
        >
          <Route index element={<B2BDashboard />} />
          <Route path="registration" element={<B2BBulkAdd />} />
          <Route path="history" element={<B2BHistory />} />
          <Route path="account" element={<PortalAccount />} />
        </Route>

        {/* Developer-only — separate from the staff panel entirely, not
            just a hidden tab. requireRole="developer" means even Admin
            cannot open this by guessing the URL. */}
        <Route
          path="dev"
          element={
            <PortalGate allow="staff" requireRole="developer">
              <DevPulse />
            </PortalGate>
          }
        />
      </Routes>
    </PortalAuthProvider>
  )
}
