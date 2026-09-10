import { useEffect, useState } from 'react'
import './LowInternetNotice.css'

function isSlowConnection() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  return Boolean(c?.saveData || ['slow-2g', '2g'].includes(c?.effectiveType))
}

export default function LowInternetNotice() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    const update = () => setSlow(isSlowConnection())
    update()
    c?.addEventListener?.('change', update)
    return () => c?.removeEventListener?.('change', update)
  }, [])
  if (!slow) return null
  return (
    <div className="low-internet-notice" role="status">
      <strong>Slow Internet Mode</strong>
      <span>This simple page is shown because your internet connection is slow. You can still proceed with your registration. Saving your details to the database is our first priority; animations and decoration are reduced.</span>
    </div>
  )
}
