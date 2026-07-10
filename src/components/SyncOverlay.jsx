// Full-screen loader shown on open while the logged-in user's latest progress
// is pulled from the cloud — guarantees no stale nailed/important is shown.
export default function SyncOverlay({ label = 'Loading your latest progress…' }) {
  return (
    <div style={wrap}>
      <style>{keyframes}</style>
      <div style={ring}>
        <div style={{ ...arc, animation: 'gq-spin 0.9s linear infinite' }} />
        <div style={dot} />
      </div>
      <p style={text}>{label}</p>
    </div>
  )
}

const keyframes = `
@keyframes gq-spin { to { transform: rotate(360deg) } }
@keyframes gq-pulse { 0%,100% { opacity:.5; transform:scale(.85) } 50% { opacity:1; transform:scale(1) } }
`
const wrap = { position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, background: 'var(--bg, #0b0d12)' }
const ring = { position: 'relative', width: 58, height: 58 }
const arc = { position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#818cf8', borderRightColor: '#818cf8' }
const dot = { position: 'absolute', inset: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a78bfa)', animation: 'gq-pulse 1.4s ease-in-out infinite' }
const text = { color: 'var(--text-3)', fontSize: '0.86rem', letterSpacing: '.2px' }
