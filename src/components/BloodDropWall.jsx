import { useEffect, useState, lazy, Suspense } from 'react'
import { fetchSiteSettings, subscribeSiteSettings } from '../lib/analytics'
import BloodDropWallLow from './BloodDropWallLow'

const BloodDropWallHigh = lazy(() => import('./BloodDropWallHigh'))

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export default function BloodDropWall() {
  const [quality, setQuality] = useState(null) // null = not loaded yet
  const [reducedMotion] = useState(prefersReducedMotion)
  const [webglOk] = useState(supportsWebGL)

  useEffect(() => {
    fetchSiteSettings()
      .then((s) => setQuality(s.blood_drop_animation_quality || 'low'))
      .catch(() => setQuality('off')) // table missing / not migrated yet — fail closed, not broken

    // Admin toggling this in the Payments... err, Views tab reflects here
    // live, no reload needed.
    const unsubscribe = subscribeSiteSettings((settings) => {
      setQuality(settings.blood_drop_animation_quality || 'low')
    })
    return unsubscribe
  }, [])

  if (reducedMotion) return null
  if (!quality || quality === 'off') return null

  // Admin asked for 'high' but this device can't do WebGL at all —
  // degrade to the CSS tier rather than showing nothing.
  const effectiveQuality = quality === 'high' && !webglOk ? 'low' : quality

  if (effectiveQuality === 'high') {
    return (
      <Suspense fallback={<BloodDropWallLow />}>
        <BloodDropWallHigh />
      </Suspense>
    )
  }

  return <BloodDropWallLow />
}
