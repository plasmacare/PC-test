// Decorative, continuously-animated hero backdrop: a slow-scrolling ECG
// line plus a few soft drifting blobs. Everything here uses only
// transform/opacity CSS keyframes (no JS animation loop, nothing that
// forces layout) so it stays light even on low-end phones, and it all
// respects the site-wide prefers-reduced-motion override in tokens.css.

// A single 400-wide "heartbeat" pattern (two beats). Rendered twice back
// to back below so the scrolling track can loop seamlessly at -50%.
const ECG_PATH = 'M0 30 L70 30 L85 30 L100 10 L115 50 L130 30 L200 30 ' +
  'L270 30 L285 30 L300 10 L315 50 L330 30 L400 30'

function EcgTrack() {
  return (
    <svg className="hero-bg__ecg-track" viewBox="0 0 400 60" preserveAspectRatio="none">
      <path className="hero-bg__ecg-path" d={ECG_PATH} />
    </svg>
  )
}

export default function HeroBackground() {
  return (
    <div className="hero-bg" aria-hidden="true">
      <div className="hero-bg__glow" />
      <div className="hero-bg__blob hero-bg__blob--a" />
      <div className="hero-bg__blob hero-bg__blob--b" />
      <div className="hero-bg__blob hero-bg__blob--c" />
      <div className="hero-bg__ecg-scroll">
        <EcgTrack />
        <EcgTrack />
      </div>
    </div>
  )
}
