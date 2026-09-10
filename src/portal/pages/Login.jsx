import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { usePortalAuth } from '../lib/portalAuth.jsx'
import logoIcon from '../assets/logo-icon.png'
import './portal.css'

export default function Login() {
  const { session, accountType, role, mfaState, loading, login } = usePortalAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session && !loading) {
    if ((role === 'admin' || role === 'developer') && mfaState === 'needs_enroll') return <Navigate to="/portal/mfa/enroll" replace />
    if ((role === 'admin' || role === 'developer') && mfaState === 'needs_challenge') return <Navigate to="/portal/mfa/verify" replace />
    if (role === 'developer') return <Navigate to="/portal/dev" replace />
    if (accountType === 'staff') return <Navigate to="/portal/staff" replace />
    if (accountType === 'b2b') return <Navigate to="/portal/b2b" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || 'Incorrect email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="portal-screen">
      <div className="portal-card">
        <img src={logoIcon} alt="" className="portal-card__logo" />
        <h1 className="portal-card__title">Portal Login</h1>
        <p className="portal-card__subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="portal-form">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="portal-card__footer">
          New B2B partner? <Link to="/portal/request-access">Request access</Link>
        </p>
      </div>
    </div>
  )
}
