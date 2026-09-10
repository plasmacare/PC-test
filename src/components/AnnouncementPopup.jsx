import { useEffect, useState } from 'react'
import { fetchActiveAnnouncement } from '../lib/content'
import './AnnouncementPopup.css'

const AUTO_CLOSE_SECONDS = 15
const SEEN_KEY_PREFIX = 'pc_announcement_seen_'

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState(null)
  const [visible, setVisible] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS)

  useEffect(() => {
    fetchActiveAnnouncement()
      .then((a) => {
        if (!a) return
        // Don't nag with the same announcement every single page load —
        // once per browser session is enough.
        const seenKey = SEEN_KEY_PREFIX + a.id
        if (sessionStorage.getItem(seenKey)) return
        sessionStorage.setItem(seenKey, '1')
        setAnnouncement(a)
        setVisible(true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!visible) return
    if (secondsLeft <= 0) {
      setVisible(false)
      return
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [visible, secondsLeft])

  if (!visible || !announcement) return null

  return (
    <div className="announcement-overlay" onClick={() => setVisible(false)}>
      <div className="announcement-card" onClick={(e) => e.stopPropagation()}>
        <button className="announcement-card__close" onClick={() => setVisible(false)} aria-label="Close">
          ×
        </button>
        {announcement.image_url && (
          <img src={announcement.image_url} alt="" className="announcement-card__poster" />
        )}
        <h2>{announcement.title}</h2>
        <p>{announcement.message}</p>
        {announcement.cta_text && announcement.cta_link && (
          <a className="btn btn--primary btn--block announcement-card__cta" href={announcement.cta_link}>
            {announcement.cta_text}
          </a>
        )}
        <p className="announcement-card__timer">Closing in {secondsLeft}s</p>
      </div>
    </div>
  )
}
