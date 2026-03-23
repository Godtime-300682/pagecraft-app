export default function StepWizard({ steps, currentStep }) {
  const pct = ((currentStep) / (steps.length - 1)) * 100

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Progress bar */}
      <div style={{ height: 4, background: '#1f2937', borderRadius: 100, marginBottom: 24, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #06b6d4, #a855f7)',
            borderRadius: 100,
            transition: 'width 0.5s ease'
          }}
        />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {steps.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  background: done ? '#06b6d4' : active ? 'rgba(6,182,212,0.15)' : '#1f2937',
                  color: done ? '#000' : active ? '#06b6d4' : '#6b7280',
                  border: active ? '2px solid #06b6d4' : done ? '2px solid #06b6d4' : '2px solid #374151',
                  transition: 'all 0.3s'
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? '#e5e7eb' : done ? '#9ca3af' : '#4b5563',
                whiteSpace: 'nowrap'
              }}>
                {step}
              </span>
              {i < steps.length - 1 && (
                <div style={{ width: 24, height: 1, background: done ? '#06b6d4' : '#1f2937', marginLeft: 4 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
