import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchLegalPage } from '../lib/content'
import './LegalPage.css'

export default function LegalPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(undefined) // undefined = loading

  useEffect(() => {
    setPage(undefined)
    fetchLegalPage(slug).then(setPage).catch(() => setPage(null))
  }, [slug])

  if (page === undefined) {
    return <div className="legal-page legal-page--loading">Loading…</div>
  }

  if (!page || !page.content?.trim()) {
    return (
      <div className="legal-page">
        <button className="legal-page__back" onClick={() => navigate('/')}>← Back</button>
        <p className="legal-page__empty">This page isn't available yet.</p>
      </div>
    )
  }

  return (
    <div className="legal-page">
      <button className="legal-page__back" onClick={() => navigate('/')}>← Back</button>
      <h1>{page.title}</h1>
      {page.content.split('\n\n').map((para, i) => (
        <p key={i}>{para}</p>
      ))}
      <p className="legal-page__updated">Last updated: {new Date(page.updated_at).toLocaleDateString('en-IN')}</p>
    </div>
  )
}
