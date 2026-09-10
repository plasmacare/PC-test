export default function MaintenanceScreen({ message }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif',
    }}>
      <h1 style={{ color: '#0B2545', fontSize: 22, marginBottom: 8 }}>Under Maintenance</h1>
      <p style={{ color: '#5C6B7A', maxWidth: 420, lineHeight: 1.5 }}>
        {message || 'We\u2019re making some improvements. Please check back shortly.'}
      </p>
    </div>
  )
}
