import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { logPageView, joinLiveViewerPresence } from '../lib/analytics'

export default function Analytics() {
  const location = useLocation()

  // Presence: joined once for the life of the tab, not per navigation.
  useEffect(() => {
    const leave = joinLiveViewerPresence()
    return leave
  }, [])

  // One page-view row per route change (including the first load).
  useEffect(() => {
    logPageView(location.pathname)
  }, [location.pathname])

  return null
}
