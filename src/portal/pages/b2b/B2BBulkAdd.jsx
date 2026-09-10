import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPackages, fetchTests } from '../../lib/catalogData'
import { submitRegistration } from '../../lib/b2bData'
import { logEvent } from '../../../lib/telemetry'
import { usePortalAuth } from '../../lib/portalAuth.jsx'
import TestPackageSearchSelect from '../../components/TestPackageSearchSelect'

const GENDERS = ['Male', 'Female', 'Other']

export default function B2BBulkAdd() {
  const { b2bAccount } = usePortalAuth()
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [tests, setTests] = useState([])
  const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '', optionKey: '' })
  const [sampleCollectionTime, setSampleCollectionTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPackages().then(setPackages).catch(() => {})
    fetchTests().then(setTests).catch(() => {})
  }, [])

  const options = useMemo(() => [
    ...packages.map((p) => ({ key: `pkg:${p.id}`, id: p.id, kind: 'package', price: p.price, label: `${p.name} — ₹${p.price}` })),
    ...tests.map((t) => ({ key: `test:${t.id}`, id: t.id, kind: 'test', price: t.price, label: `${t.name} — ₹${t.price}` })),
  ], [packages, tests])

  const selected = options.find((o) => o.key === form.optionKey)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.age.trim() || !form.gender || !selected) {
      setError('Please complete the patient details and select a test/package.')
      return
    }
    if (form.phone && form.phone.replace(/\D/g, '').length !== 10) {
      setError('Patient phone must be a valid 10-digit number, or left blank.')
      return
    }

    setSubmitting(true)
    try {
      await submitRegistration({
        b2bAccountId: b2bAccount.id,
        patient: {
          name: form.name.trim(),
          age: form.age.trim(),
          gender: form.gender,
          phone: form.phone.replace(/\D/g, ''),
          package_id: selected.kind === 'package' ? selected.id : null,
          individual_test_id: selected.kind === 'test' ? selected.id : null,
          test_label: selected.label.replace(/ — ₹.*/, ''),
          optionKey: form.optionKey,
        },
        sampleCollectionTime,
        notes,
      })
      logEvent({ type: 'b2b_registration_submitted', source: 'b2b', message: `Registration: ${form.name.trim()}` })
      navigate('/portal/b2b/history')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--navy-950)', marginBottom: 6 }}>New Registration</h2>
      <p className="portal-form__hint" style={{ marginBottom: 18 }}>
        Add one patient registration at a time. Each registration is processed individually.
      </p>

      <form onSubmit={handleSubmit} className="portal-form">
        <label>Patient name *</label>
        <input required value={form.name} onChange={(e) => update('name', e.target.value)} />

        <label>Age *</label>
        <input required type="number" min="0" max="120" inputMode="numeric" value={form.age} onChange={(e) => update('age', e.target.value)} />

        <label>Gender *</label>
        <select required value={form.gender} onChange={(e) => update('gender', e.target.value)}>
          <option value="">Select gender</option>
          {GENDERS.map((g) => <option key={g}>{g}</option>)}
        </select>

        <label>Patient phone (optional)</label>
        <input inputMode="tel" value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" />

        <label>Test / Package *</label>
        <TestPackageSearchSelect
          tests={tests}
          packages={packages}
          value={selected ? `${selected.label.replace(/ — ₹.*/, '')} — ₹${selected.price ?? ''}` : ''}
          onSelect={(opt) => update('optionKey', opt.key)}
          placeholder="Search test/package…"
        />

        <label>Sample collection time (optional)</label>
        <input type="time" value={sampleCollectionTime} onChange={(e) => setSampleCollectionTime(e.target.value)} />

        <label>Notes (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <p className="portal-form__hint">Sample collection date selection has been removed. The registration is recorded for today.</p>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Submit Registration'}
        </button>
      </form>
    </div>
  )
}
