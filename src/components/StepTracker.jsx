import './StepTracker.css'

export default function StepTracker({ steps, currentStep }) {
  return (
    <div className="step-tracker" role="list" aria-label="Booking progress">
      <div className="step-tracker__line">
        <div
          className="step-tracker__line-fill"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>
      <div className="step-tracker__nodes">
        {steps.map((label, i) => (
          <div
            className={`step-tracker__node ${i <= currentStep ? 'is-active' : ''} ${i === currentStep ? 'is-current' : ''}`}
            key={label}
            role="listitem"
          >
            <span className="step-tracker__dot" />
            <span className="step-tracker__label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
