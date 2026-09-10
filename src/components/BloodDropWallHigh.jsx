// The premium tier: real WebGL rendering via Three.js. A back "wall"
// plane with a gentle animated refraction-like ripple (custom shader,
// cheap — a sine-based UV wobble, not a full raytraced refraction,
// which would need HDR environment textures we can't ship), plus
// squashed-sphere "drops" using Three's built-in physical material for
// a glossy, translucent look, falling with simple gravity easing and
// looping seamlessly. Everything is imperative Three.js (no
// react-three-fiber dependency) so this stays a single lazy-loaded
// chunk, per the "only load Three.js when quality=high" requirement.
import { useEffect, useRef } from 'react'
import './BloodDropWall.css'

const DROP_COUNT = 9
const RED = 0xc0152f
const RED_DARK = 0x5a0b18

function makeDrop(THREE, i) {
  const geometry = new THREE.SphereGeometry(0.16, 20, 16)
  const material = new THREE.MeshPhysicalMaterial({
    color: RED,
    roughness: 0.15,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transmission: 0.35,
    thickness: 0.4,
    ior: 1.4,
    transparent: true,
    opacity: 0.92,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.userData = {
    x: (Math.random() * 1.8 - 0.9) * 5,
    speed: 0.55 + Math.random() * 0.35,
    // Staggers drops in time so they don't all fall in a single rank —
    // negative "progress" means "hasn't started yet".
    progress: -Math.random() * 1.4,
  }
  return mesh
}

export default function BloodDropWallHigh() {
  const canvasRef = useRef(null)

  useEffect(() => {
    let renderer, scene, camera, frameId, wallMaterial
    let disposed = false

    import('three').then((THREE) => {
      if (disposed || !canvasRef.current) return

      const canvas = canvasRef.current
      const width = window.innerWidth
      const height = window.innerHeight

      scene = new THREE.Scene()
      camera = new THREE.OrthographicCamera(-5, 5, 5 * (height / width), -5 * (height / width), 0.1, 100)
      camera.position.z = 10

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

      scene.add(new THREE.AmbientLight(0xffffff, 0.9))
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.1)
      dirLight.position.set(-3, 4, 6)
      scene.add(dirLight)

      // Back "wall" — a large plane with a cheap animated ripple, faking
      // the feel of looking through glass without needing an actual
      // environment map / refraction render pass.
      wallMaterial = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uColorA: { value: new THREE.Color(RED_DARK) },
          uColorB: { value: new THREE.Color(0x0b2545) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          void main() {
            float ripple = sin((vUv.y * 8.0) + uTime * 0.6) * 0.5
                          + sin((vUv.x * 5.0) - uTime * 0.4) * 0.5;
            float mixAmt = clamp(vUv.y + ripple * 0.06, 0.0, 1.0);
            vec3 color = mix(uColorA, uColorB, mixAmt);
            float alpha = 0.05 + 0.02 * ripple;
            gl_FragColor = vec4(color, alpha);
          }
        `,
      })
      const wallGeo = new THREE.PlaneGeometry(12, 12 * (height / width), 1, 1)
      const wall = new THREE.Mesh(wallGeo, wallMaterial)
      wall.position.z = -2
      scene.add(wall)

      const drops = Array.from({ length: DROP_COUNT }, (_, i) => makeDrop(THREE, i))
      drops.forEach((d) => scene.add(d))

      const topY = 5 * (height / width) + 1
      const bottomY = -topY

      const clock = new THREE.Clock()

      function animate() {
        const dt = clock.getDelta()
        const elapsed = clock.getElapsedTime()
        wallMaterial.uniforms.uTime.value = elapsed

        drops.forEach((drop) => {
          drop.userData.progress += dt * drop.userData.speed
          let p = drop.userData.progress
          if (p < 0) {
            // Hasn't started its fall yet — park it just above the top.
            drop.visible = false
          } else {
            drop.visible = true
            if (p > 1) {
              // Loop: restart from the top with a new random lane.
              drop.userData.progress = 0
              drop.userData.x = (Math.random() * 1.8 - 0.9) * 5
              p = 0
            }
            // Ease-in (gravity-like acceleration) + squash/stretch.
            const eased = p * p
            drop.position.y = topY - eased * (topY - bottomY)
            drop.position.x = drop.userData.x
            const stretch = 1 + eased * 0.9
            drop.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch))
          }
        })

        renderer.render(scene, camera)
        frameId = requestAnimationFrame(animate)
      }
      animate()

      function handleResize() {
        const w = window.innerWidth
        const h = window.innerHeight
        renderer.setSize(w, h)
        const halfHeight = 5 * (h / w)
        camera.top = halfHeight
        camera.bottom = -halfHeight
        camera.updateProjectionMatrix()
      }
      window.addEventListener('resize', handleResize)

      canvasRef.current._cleanup = () => {
        window.removeEventListener('resize', handleResize)
        cancelAnimationFrame(frameId)
        drops.forEach((d) => {
          d.geometry.dispose()
          d.material.dispose()
        })
        wallGeo.dispose()
        wallMaterial.dispose()
        renderer.dispose()
      }
    })

    return () => {
      disposed = true
      canvasRef.current?._cleanup?.()
    }
  }, [])

  return (
    <div className="drop-wall drop-wall--high" aria-hidden="true">
      <canvas ref={canvasRef} className="drop-wall__canvas" />
    </div>
  )
}
