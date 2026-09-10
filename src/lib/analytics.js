import { supabase } from './supabase'

const SESSION_KEY = 'pc_session_id'
const GEO_CACHE_KEY = 'pc_session_geo'

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

/**
 * City-level geolocation from the visitor's IP — free, no API key,
 * client-side only. Cached per browser session so we only look it up
 * once no matter how many pages they view. IP-based geolocation is
 * city-level at best (not neighborhood-accurate), which is a real
 * limitation worth knowing about when reading the admin map.
 */
async function getSessionGeo() {
  const cached = sessionStorage.getItem(GEO_CACHE_KEY)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      // fall through and re-fetch
    }
  }
  let geo = { city: null, region: null, country: null, lat: null, lng: null }
  try {
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    geo = {
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      lat: typeof data.latitude === 'number' ? data.latitude : null,
      lng: typeof data.longitude === 'number' ? data.longitude : null,
    }
  } catch {
    // Not fatal — the view still gets logged, just without a location.
  }
  sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geo))
  return geo
}

/** Logs one page view. Call on every route change. Never throws — analytics failing shouldn't affect the visitor's experience. */
export async function logPageView(path) {
  try {
    const geo = await getSessionGeo()
    await supabase.from('page_views').insert({
      session_id: getSessionId(),
      path,
      ...geo,
    })
  } catch {
    // Silently ignore — see comment above.
  }
}

/**
 * Joins a Supabase Realtime Presence channel for as long as the tab is
 * open, so the admin panel can show a live "currently on site" count.
 * Call once near the app root; returns an unsubscribe function.
 */
export function joinLiveViewerPresence() {
  const channel = supabase.channel('site-viewers', {
    config: { presence: { key: getSessionId() } },
  })
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.track({ online_at: new Date().toISOString() })
    }
  })
  return () => {
    supabase.removeChannel(channel)
  }
}

export async function fetchSiteSettings() {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

/** Subscribes to live changes to site_settings (e.g. admin toggles the animation quality) — no redeploy/reload needed. Returns an unsubscribe function. */
export function subscribeSiteSettings(onChange) {
  const channel = supabase
    .channel('site-settings-changes')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, (payload) => {
      onChange(payload.new)
    })
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
