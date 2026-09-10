import ReactDOM from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

// Checked here, BEFORE importing anything else, and deliberately using
// a dynamic import() below rather than a static one — a static
// `import App from './App'` gets evaluated before this file's own code
// runs, so by the time we could check anything, App's whole dependency
// chain (which includes the Supabase client) would already have thrown
// and left the page completely blank with nothing on screen, only a
// console error invisible on a phone with no devtools. Deferring the
// import lets us show a real, visible message instead.
const missingEnv = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

if (missingEnv) {
  root.render(
    <div style={{ maxWidth: 480, margin: '48px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif', color: '#5C6B7A' }}>
      <h1 style={{ color: '#0B2545', fontSize: 20 }}>Site configuration missing</h1>
      <p style={{ lineHeight: 1.5 }}>
        This deployment is missing its Supabase configuration
        (<code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code>).
      </p>
      <p style={{ lineHeight: 1.5 }}>
        If you're the site owner: this build wasn't given those environment
        variables. Check your hosting/CI setup — see <code>.env.example</code> and
        the README for what's needed, then rebuild and redeploy.
      </p>
    </div>,
  )
} else {
  // Supabase invite/recovery links land here as either:
  //   "#access_token=...&refresh_token=...&type=invite"   (success)
  //   "#error=access_denied&error_code=otp_expired&..."     (expired/already-used link)
  // Both look nothing like our own routes (which always start "#/"). If
  // we let HashRouter see either one first, it tries to route to a page
  // called "access_token=..." or "error=...", finds nothing, and every
  // route in this app renders blank on a miss — so the person just sees
  // a blank white screen with no idea why. Catch both cases here,
  // before the router ever mounts.
  async function consumeAuthHash() {
    const hash = window.location.hash

    if (hash.startsWith('#error=')) {
      const params = new URLSearchParams(hash.slice(1))
      return { status: 'link_error', description: params.get('error_description')?.replace(/\+/g, ' ') }
    }

    if (!hash.startsWith('#access_token=')) return { status: 'none' }

    const params = new URLSearchParams(hash.slice(1))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    const type = params.get('type')
    if (access_token && refresh_token) {
      const { supabase } = await import('./lib/supabase')
      await supabase.auth.setSession({ access_token, refresh_token })
      const dest = type === 'invite' || type === 'recovery' ? '#/portal/accept-invite' : '#/'
      window.history.replaceState(null, '', window.location.pathname + window.location.search + dest)
    }
    return { status: 'ok' }
  }

  consumeAuthHash().then((result) => {
    if (result.status === 'link_error') {
      root.render(
        <div style={{ maxWidth: 480, margin: '48px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif', color: '#5C6B7A', textAlign: 'center' }}>
          <h1 style={{ color: '#0B2545', fontSize: 20 }}>This link has expired</h1>
          <p style={{ lineHeight: 1.5 }}>
            {result.description || 'This invite or reset link is no longer valid.'} Links like this are
            single-use and time-limited — ask an admin to resend it, then open the new one directly
            (not through an email app's "safe link" preview, which can use up the link before you click it).
          </p>
          <a href={window.location.pathname} style={{ color: '#B31F1F', fontWeight: 600 }}>Go to homepage</a>
        </div>,
      )
      return
    }
    import('./AppRoot').then(({ default: AppRoot }) => {
      root.render(<AppRoot />)
    })
  })
}
