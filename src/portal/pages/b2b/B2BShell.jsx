import { NavLink, Outlet } from 'react-router-dom'
import { usePortalAuth } from '../../lib/portalAuth.jsx'
import logoIcon from '../../assets/logo-icon.png'
import '../portal.css'
import PortalAccount from '../../components/PortalAccount'

export default function B2BShell() {
  const { b2bAccount, logout } = usePortalAuth()

  return (
    <div className="b2b">
      <div className="b2b-header">
        <div className="b2b-header__brand">
          <img src={logoIcon} alt="" />
          <span>{b2bAccount?.company_name || 'B2B Partner'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <NavLink to="/portal/b2b/account" className={({ isActive }) => (isActive ? 'btn btn--primary' : 'btn btn--ghost')}>Account</NavLink>
          <button className="btn btn--ghost" onClick={logout}>Logout</button>
        </div>
      </div>

      <nav className="b2b-nav">
        <NavLink to="/portal/b2b" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/portal/b2b/registration" className={({ isActive }) => (isActive ? 'active' : '')}>
          Registration
        </NavLink>
        <NavLink to="/portal/b2b/history" className={({ isActive }) => (isActive ? 'active' : '')}>
          History
        </NavLink>
      </nav>

      <div className="b2b-content">
        <Outlet />
      </div>
    </div>
  )
}
