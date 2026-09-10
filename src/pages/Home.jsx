import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PulseDivider from '../components/PulseDivider'
import HeroBackground from '../components/HeroBackground'
import BloodDropWall from '../components/BloodDropWall'
import LanguageSwitcher from '../components/LanguageSwitcher'
import PortalMenu from '../components/PortalMenu'
import AnnouncementPopup from '../components/AnnouncementPopup'
import { useLanguage } from '../lib/i18n.jsx'
import { fetchAvailableLegalPages } from '../lib/content'
import logoFull from '../assets/logo-full.png'
import './Home.css'

const PHONE = '8112060205'
const WHATSAPP_LINK = `https://wa.me/91${PHONE}`
const EMAIL = 'official.plasmacare@gmail.com'
const INSTAGRAM_HANDLE = 'official.plasmacare'
const INSTAGRAM_LINK = 'https://instagram.com/official.plasmacare'

export default function Home() {
  const { t } = useLanguage()
  const [showContactSheet, setShowContactSheet] = useState(false)
  const [legalPages, setLegalPages] = useState([])

  useEffect(() => {
    fetchAvailableLegalPages().then(setLegalPages).catch(() => {})
  }, [])

  const OTHER_SERVICES = [
    { key: 'radiology', name: t('svc_radiology_name'), icon: ScanIcon },
    { key: 'consultation', name: t('svc_consultation_name'), icon: DoctorIcon },
    { key: 'daycare', name: t('svc_daycare_name'), icon: BedIcon },
    { key: 'pharmacy', name: t('svc_pharmacy_name'), icon: PillIcon },
    { key: 'insurance', name: t('svc_insurance_name'), icon: ShieldIcon },
  ]

  const WHY_CHOOSE = [
    { key: 'reports', title: t('why_reports_title'), desc: t('why_reports_desc'), icon: ReportIcon },
    { key: 'experts', title: t('why_experts_title'), desc: t('why_experts_desc'), icon: DoctorIcon },
    { key: 'home', title: t('why_home_title'), desc: t('why_home_desc'), icon: HomeCollectIcon },
    { key: 'affordable', title: t('why_affordable_title'), desc: t('why_affordable_desc'), icon: RupeeIcon },
    { key: 'fast', title: t('why_fast_title'), desc: t('why_fast_desc'), icon: ClockIcon },
    { key: 'personal', title: t('why_personal_title'), desc: t('why_personal_desc'), icon: HeartHandIcon },
    { key: 'preventive', title: t('why_preventive_title'), desc: t('why_preventive_desc'), icon: ShieldIcon },
    { key: 'quality', title: t('why_quality_title'), desc: t('why_quality_desc'), icon: CheckHeartIcon },
  ]

  return (
    <div className="home">
      <BloodDropWall />
      <AnnouncementPopup />
      <div className="home__top-bar">
        <PortalMenu />
        <LanguageSwitcher />
      </div>

      <header className="home__hero">
        <HeroBackground />
        <img src={logoFull} alt="Plasma Care — A Unit of Trivana Ventures LLP" className="home__logo-full" />
        <p className="home__tagline">{t('tagline')}</p>
        <p className="home__sub">G13 K8 BDA Market Complex, Kalinga Nagar</p>
        <PulseDivider />
      </header>

      <section className="home__services">
        <h2 className="home__section-title">{t('ourServices')}</h2>
        <Link to="/book/pathology" className="service-card service-card--live">
          <div className="service-card__icon">
            <TubeIcon />
          </div>
          <h3 className="service-card__name">{t('svc_pathology_name')}</h3>
          <p className="service-card__desc">{t('svc_pathology_desc')}</p>
          <span className="service-card__cta">{t('bookNow')}</span>
        </Link>

        <p className="home__also-label">{t('alsoAvailable')}</p>
        <div className="home__chip-row">
          {OTHER_SERVICES.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.key} className="service-chip" aria-disabled="true">
                <Icon />
                <span>{s.name}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="home__why">
        <h2 className="home__section-title">{t('whyChooseTitle')}</h2>
        <div className="home__why-grid">
          {WHY_CHOOSE.map((w) => {
            const Icon = w.icon
            return (
              <div key={w.key} className="why-card">
                <div className="why-card__icon">
                  <Icon />
                </div>
                <h3 className="why-card__title">{w.title}</h3>
                <p className="why-card__desc">{w.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="home__footer">
        <h2 className="home__section-title">{t('contactUs')}</h2>
        <div className="contact-list">
          <button type="button" className="contact-row" onClick={() => setShowContactSheet(true)}>
            <PhoneIcon />
            <span>{PHONE}</span>
          </button>
          <a className="contact-row" href={`mailto:${EMAIL}`}>
            <MailIcon />
            <span>{EMAIL}</span>
          </a>
          <a className="contact-row" href={INSTAGRAM_LINK} target="_blank" rel="noreferrer">
            <InstagramIcon />
            <span>{INSTAGRAM_HANDLE}</span>
          </a>
          <div className="contact-row contact-row--static">
            <PinIcon />
            <a href="https://maps.app.goo.gl/UefDcbg6jgk9bjr5A" target="_blank" rel="noopener noreferrer" aria-label="Open lab location in Google Maps">
              <span>G13 K8 BDA Market Complex, Kalinga Nagar, Bhubaneswar – 751003</span>
            </a>
          </div>
        </div>
        {legalPages.length > 0 && (
          <div className="home__legal-links">
            {legalPages.map((p) => (
              <Link key={p.slug} to={`/pages/${p.slug}`}>{p.title}</Link>
            ))}
          </div>
        )}
        <p className="home__copyright">
          © {new Date().getFullYear()} Plasma Care, a unit of Trivana Ventures LLP. All rights reserved.
        </p>
      </footer>

      {showContactSheet && (
        <div className="contact-sheet__overlay" onClick={() => setShowContactSheet(false)}>
          <div className="contact-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="contact-sheet__title">{t('callOrWhatsapp')}</p>
            <a className="contact-sheet__btn contact-sheet__btn--call" href={`tel:${PHONE}`}>
              <PhoneIcon /> {t('callOption')}
            </a>
            <a
              className="contact-sheet__btn contact-sheet__btn--whatsapp"
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsappIcon /> {t('whatsappOption')}
            </a>
            <button type="button" className="contact-sheet__cancel" onClick={() => setShowContactSheet(false)}>
              {t('cancelOption')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Service / feature icons ---------- */
function TubeIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M9 2h6M10 3v12a2 2 0 004 0V3" /><path d="M9 12h6" /></svg>
}
function ScanIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
}
function DoctorIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><circle cx="12" cy="8" r="3" /><path d="M5 21c0-4 3-7 7-7s7 3 7 7" /></svg>
}
function BedIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18h18M3 18v2M21 18v2" /><path d="M7 10V7a1 1 0 011-1h3" /></svg>
}
function PillIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)" /><path d="M9 9l6 6" /></svg>
}
function ShieldIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /></svg>
}
function ReportIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /><path d="M8 3l1-1h6l1 1" /></svg>
}
function HomeCollectIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" /></svg>
}
function RupeeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M6 4h12M6 8h12M6 4c4 0 7 1.8 7 4s-3 4-7 4h9M6 12l8 8" /></svg>
}
function ClockIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
}
function HeartHandIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M12 20s-6.5-4.2-9-8.2C1.3 8.6 3 5 6.5 5c1.9 0 3.3 1 4 2.3.7-1.3 2.1-2.3 4-2.3C18 5 19.7 8.6 18 11.8 15.5 15.8 12 20 12 20z" /></svg>
}
function CheckHeartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M12 20s-6.5-4.2-9-8.2C1.3 8.6 3 5 6.5 5c1.9 0 3.3 1 4 2.3.7-1.3 2.1-2.3 4-2.3C18 5 19.7 8.6 18 11.8 15.5 15.8 12 20 12 20z" /><path d="M9 12l2 2 4-4" stroke="var(--surface)" strokeWidth="1.6" /></svg>
}

/* ---------- Contact icons ---------- */
function PhoneIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2C9.5 21 3 14.5 3 6a2 2 0 012-2z" /></svg>
}
function MailIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
}
function InstagramIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
}
function PinIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s7-6.5 7-11.5A7 7 0 105 9.5C5 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.3" /></svg>
}
function WhatsappIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.6 14.3c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-2.9-1.3-4.8-4.2-5-4.4-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.2.1.3 0 .5-.1.2-.1.3-.3.5-.1.2-.3.4-.4.5-.1.2-.3.3-.1.6.2.3.9 1.5 1.9 2.4 1.3 1.2 2.4 1.5 2.7 1.7.3.2.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.2.7-.1.3.1 1.7.8 2 .9.3.2.5.2.6.3.1.2.1.9-.1 1.6z" />
    </svg>
  )
}
