// Site-wide decorative backdrop, mounted once in App.jsx so it's behind
// every page. Three motifs tying back to the logo (blood + DNA/pulse):
// drifting "blood cell" dots, a couple of pulsing neuron-style links,
// and bubbles rising like in a test tube. Everything is a fixed number
// of absolutely-positioned elements animated with CSS transform/opacity
// keyframes only — no JS animation loop, nothing recalculated on
// render, so it stays cheap to run continuously. Respects the
// site-wide prefers-reduced-motion override in tokens.css.

const BLOOD_CELLS = [
  { left: '6%', size: 7, duration: 14, delay: 0 },
  { left: '18%', size: 5, duration: 18, delay: 3 },
  { left: '32%', size: 8, duration: 16, delay: 7 },
  { left: '48%', size: 6, duration: 20, delay: 1 },
  { left: '63%', size: 5, duration: 15, delay: 9 },
  { left: '78%', size: 7, duration: 19, delay: 4 },
  { left: '90%', size: 6, duration: 17, delay: 11 },
]

const BUBBLES = [
  { left: '14%', size: 6, duration: 11, delay: 0 },
  { left: '40%', size: 4, duration: 9, delay: 3 },
  { left: '58%', size: 5, duration: 12, delay: 6 },
  { left: '85%', size: 4, duration: 10, delay: 2 },
]

export default function SiteBackground() {
  return (
    <div className="site-bg" aria-hidden="true">
      <div className="site-bg__neuron site-bg__neuron--a">
        <span className="site-bg__node" />
        <span className="site-bg__node" />
        <svg viewBox="0 0 120 60" className="site-bg__link"><path d="M10 50 Q60 -10 110 30" /></svg>
      </div>
      <div className="site-bg__neuron site-bg__neuron--b">
        <span className="site-bg__node" />
        <span className="site-bg__node" />
        <svg viewBox="0 0 120 60" className="site-bg__link"><path d="M10 10 Q60 70 110 25" /></svg>
      </div>

      {BLOOD_CELLS.map((c, i) => (
        <span
          key={`cell-${i}`}
          className="site-bg__cell"
          style={{
            left: c.left,
            width: c.size, height: c.size,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      {BUBBLES.map((b, i) => (
        <span
          key={`bubble-${i}`}
          className="site-bg__bubble"
          style={{
            left: b.left,
            width: b.size, height: b.size,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
