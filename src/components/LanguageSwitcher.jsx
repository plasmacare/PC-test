import { useState, useRef, useEffect } from 'react'
import { LANGUAGES, useLanguage } from '../lib/i18n.jsx'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
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

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  return (
    <div className="lang-switcher" ref={ref}>
      <button className="lang-switcher__trigger" onClick={() => setOpen((o) => !o)} type="button">
        <GlobeIcon />
        <span>{current.label}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <ul className="lang-switcher__menu">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                className={`lang-switcher__option ${l.code === lang ? 'is-active' : ''}`}
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                type="button"
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function GlobeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18 15 15 0 010-18z" /></svg>
}
function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
