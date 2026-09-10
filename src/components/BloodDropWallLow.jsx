// The cheap tier: fakes the "inner wall of a glass test tube" using a
// semi-transparent gradient + backdrop-blur panel, with a handful of
// teardrop shapes falling on a CSS keyframe loop. No canvas, no WebGL,
// safe for the lowest-end phones. Squash/stretch on the drops (scaleY
// grows, scaleX shrinks as they "accelerate") gives a bit of the same
// gravity feel as the high tier, just cheaper.
import './BloodDropWall.css'

const DROPS = [
  { left: '8%', size: 14, duration: 4.2, delay: 0 },
  { left: '22%', size: 10, duration: 3.4, delay: 1.1 },
  { left: '38%', size: 16, duration: 4.8, delay: 0.4 },
  { left: '52%', size: 11, duration: 3.8, delay: 2.2 },
  { left: '67%', size: 15, duration: 4.4, delay: 0.9 },
  { left: '81%', size: 12, duration: 3.6, delay: 1.7 },
  { left: '93%', size: 13, duration: 4.6, delay: 2.6 },
]

export default function BloodDropWallLow() {
  return (
    <div className="drop-wall drop-wall--low" aria-hidden="true">
      <div className="drop-wall__glass" />
      {DROPS.map((d, i) => (
        <span
          key={i}
          className="drop-wall__drop"
          style={{
            left: d.left,
            width: d.size,
            height: d.size * 1.3,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
