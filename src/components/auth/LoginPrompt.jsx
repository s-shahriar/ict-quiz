import { Star, X } from 'lucide-react'

// Shown when a logged-out user taps Nail It / Important. Saving requires a
// signed-in account (progress is cloud-only, no offline storage).
function GoogleIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.6 8.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5.4 0 10.3-2.1 14-5.4l-6.5-5.5c-2 1.5-4.6 2.4-7.5 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.5 5.5c-.5.4 7-5.1 7-15.6 0-1.2-.1-2.3-.3-3.5z"/>
    </svg>
  )
}

export default function LoginPrompt({ onGoogle, onClose }) {
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={sheet}>
        <button onClick={onClose} style={closeBtn} aria-label="Close"><X size={18} /></button>
        <div style={icon}><Star size={24} fill="currentColor" /></div>
        <h3 style={title}>Sign in to save</h3>
        <p style={sub}>Nail It &amp; Important are saved to your account so they sync across every device. Sign in to keep them.</p>
        <button type="button" onClick={() => onGoogle()} style={googleBtn}>
          <GoogleIcon size={17} /> Continue with Google
        </button>
      </div>
    </div>
  )
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
const sheet = { position: 'relative', width: '100%', maxWidth: 340, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px 24px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }
const closeBtn = { position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }
const icon = { width: 52, height: 52, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }
const title = { fontSize: '1.12rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }
const sub = { fontSize: '0.84rem', color: 'var(--text-3)', lineHeight: 1.55, margin: '0 0 18px' }
const googleBtn = { width: '100%', padding: '11px 16px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', color: '#1f2328', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }
