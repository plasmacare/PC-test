import { supabase } from './supabase'

const SESSION_KEY = 'pc_session_id'

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}

/**
 * The one function every part of the site calls to write to the
 * activity log. Never throws — logging must never break the feature
 * that's using it.
 *
 * @param {Object} event
 * @param {string} event.type - e.g. 'login', 'booking_created', 'admin_action', 'js_error'
 * @param {'customer'|'staff'|'admin'|'b2b'|'system'} event.source
 * @param {string} event.message - short human-readable summary
 * @param {'info'|'warning'|'error'} [event.severity]
 * @param {Object} [event.metadata] - any extra structured detail
 */
export async function logEvent({ type, source, message, severity = 'info', metadata = null }) {
  try {
    const { data: { user } = {} } = await supabase.auth.getUser()
    await supabase.from('activity_logs').insert({
      event_type: type,
      source,
      severity,
      actor_id: user?.id || null,
      actor_label: user?.email || null,
      message,
      metadata,
      path: typeof window !== 'undefined' ? window.location.pathname + window.location.hash : null,
      session_id: getSessionId(),
    })
  } catch {
    // Logging must never break the app it's watching.
  }
}

/**
 * Wires up window.onerror + unhandledrejection so every uncaught error
 * anywhere on the site reaches the log automatically, with no per-page
 * instrumentation needed. Call once near the app root (source is worked
 * out per-error from the current URL, since a single tab can move
 * between customer and portal routes over its lifetime).
 */
export function installGlobalErrorLogging() {
  function currentSource() {
    const hash = window.location.hash
    if (hash.includes('/portal/b2b')) return 'b2b'
    if (hash.includes('/portal')) return 'staff'
    return 'customer'
  }

  window.addEventListener('error', (e) => {
    logEvent({
      type: 'js_error',
      source: currentSource(),
      severity: 'error',
      message: e.message || 'Uncaught error',
      metadata: { stack: e.error?.stack, filename: e.filename, lineno: e.lineno },
    })
  })

  window.addEventListener('unhandledrejection', (e) => {
    logEvent({
      type: 'js_error',
      source: currentSource(),
      severity: 'error',
      message: e.reason?.message || String(e.reason) || 'Unhandled promise rejection',
      metadata: { stack: e.reason?.stack },
    })
  })
}
