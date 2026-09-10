import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../lib/i18n.jsx'
import { fetchBookingsByPhone } from '../lib/booking'
import { sendOtp, verifyOtp } from '../lib/otp'
import { getSession, setSession, clearSession } from '../lib/session'
import './Account.css'

const STATUS_LABEL = {
  pending: 'statusPending',
  confirmed: 'statusConfirmed',
  sample_collected: 'statusSampleCollected',
  report_ready: 'statusReportReady',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
}

export default function Account() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [session, setLocalSession] = useState(() => getSession())

  if (!session) {
    return <LoginForm t={t} navigate={navigate} onLoggedIn={(phone) => setLocalSession(getSession())} />
  }

  return <BookingHistory t={t} navigate={navigate} session={session} onLogout={() => { clearSession(); setLocalSession(null) }} />
}

function LoginForm({ t, navigate, onLoggedIn }) {
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [channel, setChannel] = useState('whatsapp')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSendOtp() {
    setError('')
    if (phone.trim().length < 10) {
      setError('10-digit phone number bharein.')
      return
    }
    setBusy(true)
    try {
      await sendOtp(phone, channel)
      setOtpSent(true)
    } catch (e) {
      setError(`OTP bhejne mein dikkat: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify() {
    setError('')
    if (otpCode.trim().length !== 6) {
      setError('6-digit OTP daalein.')
      return
    }
    setBusy(true)
    try {
      await verifyOtp(phone, otpCode)
      setSession(phone)
      onLoggedIn(phone)
    } catch {
      setError('OTP galat hai ya expire ho gaya.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="page-header__back" onClick={() => navigate('/')}>
          <BackIcon />
        </button>
        <h1>{t('myAccount')}</h1>
        <div className="page-header__spacer" />
        <LanguageSwitcher />
      </div>

      <div className="account-login">
        <p className="account-login__intro">{t('accountLoginIntro')}</p>

        <div className="field">
          <label>{t('phoneNumber')}</label>
          <input
            type="tel"
            value={phone}
            disabled={otpSent}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={t('phonePlaceholder')}
          />
        </div>

        {otpSent && (
          <div className="field">
            <label>{t('otpSentTo')} +91 {phone}</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              className="otp-input"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
            />
          </div>
        )}

        {error && <p className="field-error">{error}</p>}

        {!otpSent ? (
          <button className="btn btn--primary btn--block" disabled={busy} onClick={handleSendOtp}>
            {busy ? t('sending') : t('sendOtp')}
          </button>
        ) : (
          <button className="btn btn--primary btn--block" disabled={busy} onClick={handleVerify}>
            {busy ? t('verifying') : t('verifyConfirm')}
          </button>
        )}
      </div>
    </div>
  )
}

function BookingHistory({ t, navigate, session, onLogout }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookingsByPhone(session.phone)
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [session.phone])

  return (
    <div className="page">
      <div className="page-header">
        <button className="page-header__back" onClick={() => navigate('/')}>
          <BackIcon />
        </button>
        <h1>{t('myAccount')}</h1>
        <div className="page-header__spacer" />
        <LanguageSwitcher />
      </div>

      <div className="account-history">
        <p className="account-history__phone">+91 {session.phone}</p>

        {loading && <p className="empty-note">{t('loading')}</p>}
        {!loading && bookings.length === 0 && <p className="empty-note">{t('noBookingsYet')}</p>}

        <div className="booking-history-list">
          {bookings.map((b) => (
            <BookingHistoryCard key={b.id} booking={b} t={t} />
          ))}
        </div>

        <button className="btn btn--ghost btn--block" onClick={onLogout}>{t('logout')}</button>
      </div>
    </div>
  )
}

function BookingHistoryCard({ booking, t }) {
  const statusKey = STATUS_LABEL[booking.status] || 'statusPending'
  return (
    <div className="booking-history-card">
      <div className="booking-history-card__top">
        <span className="booking-history-card__date">{booking.scheduled_date}</span>
        <span className={`badge badge--${booking.status}`}>{t(statusKey)}</span>
      </div>
      <p className="booking-history-card__type">
        {booking.booking_type === 'home_collection' ? t('homeCollection') : t('labVisit')} · ₹{booking.total_amount}
      </p>
      {booking.patient_name && (
        <p className="booking-history-card__patient">{t('patient')}: {booking.patient_name}</p>
      )}
      <ReportRow booking={booking} t={t} />
    </div>
  )
}

function ReportRow({ booking, t }) {
  if (booking.report_status === 'uploaded' && booking.report_url) {
    return (
      <a className="btn btn--secondary btn--block report-link" href={booking.report_url} target="_blank" rel="noreferrer">
        {t('viewReport')}
      </a>
    )
  }
  if (booking.report_status === 'skipped') return null
  return <p className="booking-history-card__report-pending">{t('reportPending')}</p>
}

function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
}
