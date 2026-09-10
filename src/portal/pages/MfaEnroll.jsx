import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { usePortalAuth } from '../lib/portalAuth.jsx'
import './portal.css'

export default function MfaEnroll() {
  const { role, mfaState, refreshMfa, loading, logout } = usePortalAuth()
  const [enrollment, setEnrollment] = useState(null) // { factorId, qrCode, secret }
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const startEnroll = useCallback(async () => {
    setStarting(true)
    setError('')
    setEnrollment(null)
    try {
      // A leftover unverified factor from a previous abandoned attempt
      // blocks a fresh enroll — clean it up first so this never gets
      // permanently stuck on a second/retry attempt.
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const stale = factors?.totp?.find((f) => f.status === 'unverified')
      if (stale) {
        await supabase.auth.mfa.unenroll({ factorId: stale.id })
      }

      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (enrollErr) throw enrollErr
      setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret })
    } catch (err) {
      setError(err.message || 'Could not start 2FA setup.')
    } finally {
      setStarting(false)
    }
  }, [])

  useEffect(() => {
    if (mfaState !== 'needs_enroll') return
    startEnroll()
  }, [mfaState, startEnroll])

  if (!loading && role !== 'admin' && role !== 'developer') return <Navigate to="/portal/login" replace />
  if (!loading && mfaState === 'satisfied') return <Navigate to={role === 'developer' ? '/portal/dev' : '/portal/staff'} replace />

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: enrollment.factorId,
      })
      if (chErr) throw chErr
      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: challenge.id,
        code,
      })
      if (verErr) throw verErr
      await refreshMfa()
    } catch (err) {
      setError(err.message || 'Invalid code. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="portal-screen">
      <div className="portal-card">
        <h1 className="portal-card__title">Set up 2FA</h1>
        <p className="portal-card__subtitle">
          A one-time Authenticator app setup (Google Authenticator, Authy, etc.) is required for this account.
        </p>

        {error && (
          <p className="login-error">
            {error}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); startEnroll() }}>Retry</a>
          </p>
        )}

        {starting && !error ? (
          <p>Loading QR code…</p>
        ) : enrollment ? (
          <>
            <div className="portal-mfa-qr" dangerouslySetInnerHTML={{ __html: enrollment.qrCode }} />
            <p className="portal-form__hint">Can't scan the QR? Enter this code manually:</p>
            <div className="portal-mfa-secret">{enrollment.secret}</div>

            <form onSubmit={handleVerify} className="portal-form">
              <label>6-digit code from your app</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                className="portal-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="btn btn--primary" disabled={submitting || code.length !== 6}>
                {submitting ? 'Verifying…' : 'Verify & Enable 2FA'}
              </button>
            </form>
          </>
        ) : null}

        <p className="portal-card__footer">
          Wrong account? <a href="#" onClick={(e) => { e.preventDefault(); logout() }}>Sign out</a>
        </p>
      </div>
    </div>
  )
}
