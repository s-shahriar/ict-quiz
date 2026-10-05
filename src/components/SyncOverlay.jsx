import Loader from './shared/Loader.jsx'

// Full-screen loader shown on open while the logged-in user's latest progress
// is pulled from the cloud — guarantees no stale nailed/important is shown.
export default function SyncOverlay({ label = 'Loading your latest progress…' }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Loader label={label} />
    </div>
  )
}
