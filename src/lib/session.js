const KEY = 'pc_customer_session'

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.phone) return null
    return parsed
  } catch {
    return null
  }
}

export function setSession(phone, name) {
  localStorage.setItem(KEY, JSON.stringify({ phone, name: name || null, verifiedAt: new Date().toISOString() }))
}

export function clearSession() {
  localStorage.removeItem(KEY)
}
