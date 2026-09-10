import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './PortalMenu.css'

// Public-facing menu — B2B options only. Staff/Admin sign in at the same
// /portal/login URL, but that isn't advertised here on purpose.
export default function PortalMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('touchstart', onClickOutside)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('touchstart', onClickOutside)
    }
  }, [])

  return (
    <div className="portal-menu" ref={ref}>
      <button className="portal-menu__trigger" onClick={() => setOpen((o) => !o)} type="button">
        <BriefcaseIcon small />
        <span>B2B Login</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="portal-menu__drawer">
          <Link to="/portal/login" className="portal-menu__item" onClick={() => setOpen(false)}>
            <BriefcaseIcon />
            <div>
              <strong>B2B Partner Login</strong>
              <span>Corporate bulk bookings &amp; reports</span>
            </div>
          </Link>

          <Link to="/portal/request-access" className="portal-menu__item" onClick={() => setOpen(false)}>
            <PlusIcon />
            <div>
              <strong>New B2B partner?</strong>
              <span>Request access</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
function BriefcaseIcon({ small }) {
  const s = small ? 15 : 18
  const stroke = small ? 'currentColor' : 'var(--navy-950)'
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
}
function PlusIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
}
