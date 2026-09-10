import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { usePortalAuth } from '../lib/portalAuth.jsx'
import './portal.css'

export default function MfaVerify() {
  const { role, mfaState, refreshMfa, loading, logout } = usePortalAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && role !== 'admin' && role !== 'developer') return <Navigate to="/portal/login" replace />
  if (!loading && mfaState === 'satisfied') return <Navigate to={role === 'developer' ? '/portal/dev' : '/portal/staff'} replace />

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors()
      if (listErr) throw listErr
      const factor = factors.totp.find((f) => f.status === 'verified')
      if (!factor) throw new Error('No 2FA factor found — contact admin.')

      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      })
      if (chErr) throw chErr

      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId: factor.id,
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
        <h1 className="portal-card__title">Enter 2FA code</h1>
        <p className="portal-card__subtitle">Enter the 6-digit code from your Authenticator app.</p>

        <form onSubmit={handleVerify} className="portal-form">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            autoFocus
            className="portal-code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn--primary" disabled={submitting || code.length !== 6}>
            {submitting ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <p className="portal-card__footer">
          <a href="#" onClick={(e) => { e.preventDefault(); logout() }}>Sign out</a>
        </p>
      </div>
    </div>
  )
}
