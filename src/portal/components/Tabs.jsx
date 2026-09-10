import { useState, useRef, useEffect } from 'react'

export default function Tabs({ tabs, active, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const activeTab = tabs.find((t) => t.key === active) || tabs[0]

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
    <div className="admin-tabs-menu" ref={ref}>
      <button
        type="button"
        className="admin-tabs-menu__trigger"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{activeTab?.label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="admin-tabs-menu__drawer">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`admin-tabs-menu__item${active === tab.key ? ' admin-tabs-menu__item--active' : ''}`}
              onClick={() => {
                onChange(tab.key)
                setOpen(false)
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
