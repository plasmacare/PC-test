import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { reverseGeocode, autosuggest } from '../lib/geocode'
import { useLanguage } from '../lib/i18n.jsx'
import './LocationPicker.css'

// Leaflet's default marker icons reference image files that don't bundle
// correctly with Vite by default — rebuild the icon URLs explicitly.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = { lat: 20.2961, lng: 85.8245 } // Bhubaneswar fallback

export default function LocationPicker({ onConfirm }) {
  const { t } = useLanguage()
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerInstance = useRef(null)

  const [ready, setReady] = useState(false)
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [coords, setCoords] = useState(null)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  const placePin = useCallback((lat, lng) => {
    setCoords({ lat, lng })
    if (markerInstance.current) markerInstance.current.setLatLng([lat, lng])
    if (mapInstance.current) {
      // Guards against Leaflet caching a stale container size (leaves the
      // map mostly grey after a big jump, e.g. from geolocation) — force it
      // to re-measure right before moving the view.
      mapInstance.current.invalidateSize()
      mapInstance.current.setView([lat, lng], 16)
      // Some mobile browsers report the correct size a frame late; re-check
      // once more after the view settles so no tiles are left unrendered.
      setTimeout(() => mapInstance.current && mapInstance.current.invalidateSize(), 250)
    }

    reverseGeocode(lat, lng)
      .then((result) => {
        if (result) setAddress(result.formatted_address)
      })
      .catch(() => {
        // reverse geocode failing shouldn't block the user — they can type manually
      })
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 15)
    mapInstance.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], { draggable: true }).addTo(map)
    markerInstance.current = marker

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      placePin(pos.lat, pos.lng)
    })

    map.on('click', (e) => {
      placePin(e.latlng.lat, e.latlng.lng)
    })

    setReady(true)
    placePin(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)

    // Force a re-measure once the browser has actually painted the map
    // container — fixes a common Leaflet issue where it initializes with
    // the wrong size and leaves most tiles blank/grey.
    requestAnimationFrame(() => map.invalidateSize())
    const resizeHandler = () => map.invalidateSize()
    window.addEventListener('resize', resizeHandler)

    return () => {
      window.removeEventListener('resize', resizeHandler)
      map.remove()
      mapInstance.current = null
    }
  }, [placePin])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Location services are not available in this browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placePin(pos.coords.latitude, pos.coords.longitude)
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access is blocked. Tap the 🔒 icon near the browser address bar, set Location to "Allow", then try again.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Your phone's Location/GPS is turned off. Turn it on in Settings, then try again.")
        } else {
          setError('Finding your location took too long. Please try again.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  let searchDebounce
  function handleSearchChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(searchDebounce)
    if (val.length < 3) {
      setSuggestions([])
      return
    }
    searchDebounce = setTimeout(async () => {
      const results = await autosuggest(val)
      setSuggestions(results)
    }, 400)
  }

  function selectSuggestion(s) {
    setQuery(s.placeName)
    setSuggestions([])
    placePin(s.latitude, s.longitude)
  }

  function confirm() {
    if (!coords || !address) {
      setError('Please select a location on the map first.')
      return
    }
    onConfirm({ fullAddress: address, landmark, latitude: coords.lat, longitude: coords.lng })
  }

  return (
    <div className="location-picker">
      <div className="location-picker__search">
        <SearchIcon />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={handleSearchChange}
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="location-picker__suggestions">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => selectSuggestion(s)}>
              <span className="lp-suggestion__name">{s.placeName}</span>
              <span className="lp-suggestion__addr">{s.placeAddress}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="location-picker__map-wrap">
        <div ref={mapRef} className="location-picker__map" />
        {!ready && <div className="location-picker__loading">Map load ho raha hai…</div>}
        {locating && (
          <div className="location-picker__loading location-picker__loading--overlay">
            <span className="location-picker__spinner" />
            {t('locating')}
          </div>
        )}
      </div>

      <button className="location-picker__locate-btn" onClick={useMyLocation} disabled={locating} type="button">
        <PinIcon />
        {locating ? t('locating') : t('useMyLocation')}
      </button>

      <div className="location-picker__form">
        <label>
          {t('deliveryAddress')}
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('addressPlaceholder')}
          />
        </label>
        <label>
          {t('landmark')}
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder={t('landmarkPlaceholder')}
          />
        </label>
      </div>

      {error && <p className="location-picker__error">{error}</p>}

      <button className="btn btn--primary btn--block" onClick={confirm} type="button">
        {t('confirmLocation')}
      </button>
    </div>
  )
}

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--slate)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
}
function PinIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red-600)" strokeWidth="2"><path d="M12 21s-7-6.5-7-11a7 7 0 0114 0c0 4.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
}
