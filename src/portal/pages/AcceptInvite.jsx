import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import logoIcon from '../assets/logo-icon.png'
import './portal.css'

export default function AcceptInvite() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('This invite link has expired. Please ask an admin to resend it.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr
      navigate('/portal/login', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not set password. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="portal-screen">
      <div className="portal-card">
        <img src={logoIcon} alt="" className="portal-card__logo" />
        <h1 className="portal-card__title">Set your password</h1>
        <p className="portal-card__subtitle">One-time setup — this becomes your login password.</p>

        <form onSubmit={handleSubmit} className="portal-form">
          <label>Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label>Confirm password</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
