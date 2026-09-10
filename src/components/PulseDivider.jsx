// The signature visual motif: a hand-drawn-feeling ECG line that animates
// once on mount. Used between sections and inside the booking step tracker.
export default function PulseDivider({ className = '' }) {
  return (
    <svg
      className={`pulse-divider ${className}`}
      viewBox="0 0 400 28"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 14 L120 14 L135 4 L150 24 L165 14 L400 14" />
    </svg>
  )
}
