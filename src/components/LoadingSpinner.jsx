export default function LoadingSpinner({ size = 24, color = '#06b6d4', text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <circle
          cx="12" cy="12" r="10"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray="50"
          strokeDashoffset="15"
          strokeLinecap="round"
        />
      </svg>
      {text && (
        <span style={{ color: '#9ca3af', fontSize: 14 }}>{text}</span>
      )}
    </div>
  )
}
