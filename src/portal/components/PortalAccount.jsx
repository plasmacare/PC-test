import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { usePortalAuth } from '../lib/portalAuth.jsx'

export default function PortalAccount() {
  const { role, staffProfile, b2bAccount } = usePortalAuth()
  const account = b2bAccount || staffProfile
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function changePassword(e) {
    e.preventDefault()
    setError(''); setMessage('')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setPassword(''); setConfirm('')
      setMessage('Password changed successfully.')
    } catch (err) {
      setError(err.message || 'Could not change password.')
    } finally { setBusy(false) }
  }

  return (
    <div className="tab-panel" style={{ maxWidth: 720 }}>
      <h2 style={{ marginBottom: 6 }}>Account</h2>
      <p className="portal-form__hint" style={{ marginBottom: 20 }}>
        Your submitted account details are shown below. For any detail other than your password, please contact the admin.
      </p>

      <div className="admin-account-card">
        <div><strong>Account type</strong><span>{role === 'admin' ? 'Admin' : role === 'b2b' ? 'B2B Client' : 'Staff'}</span></div>
        <div><strong>Name / Contact</strong><span>{account?.contact_name || account?.full_name || '—'}</span></div>
        <div><strong>Organisation</strong><span>{account?.company_name || '—'}</span></div>
        <div><strong>Email</strong><span>{account?.email || '—'}</span></div>
        <div><strong>Phone</strong><span>{account?.phone || '—'}</span></div>
        {account?.username && <div><strong>Username</strong><span>{account.username}</span></div>}
        <div><strong>MoU</strong><span>{account?.mou_url ? <a href={account.mou_url} target="_blank" rel="noreferrer">View MoU</a> : 'Not uploaded / contact admin'}</span></div>
      </div>

      <form onSubmit={changePassword} className="portal-form" style={{ marginTop: 20 }}>
        <h3>Change password</h3>
        <label>New password</label>
        <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <label>Confirm new password</label>
        <input type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        {error && <p className="login-error">{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
        <button className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
      </form>
    </div>
  )
}
