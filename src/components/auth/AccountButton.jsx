import { useState } from 'react'
import { LogIn, LogOut, User, Check, CloudOff, Star, Bookmark } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useProgressMeta } from '../../contexts/ProgressContext.jsx'

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

function timeAgo(date) {
  if (!date) return null
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 45) return 'just now'
  if (s < 90) return 'a minute ago'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d} days ago`
  return date.toLocaleDateString()
}

export default function AccountButton() {
  const { configured, user, signInWithGoogle, signOut } = useAuth()
  const { nailedCount, importantCount, lastSaved } = useProgressMeta()
  const [open, setOpen] = useState(false)

  if (!configured) {
    return (
      <button className="theme-toggle-nav" title="Cloud sync not configured" disabled>
        <CloudOff size={17} />
      </button>
    )
  }

  const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="theme-toggle-nav"
        onClick={() => setOpen(o => !o)}
        title={user ? user.email : 'Sign in to sync progress'}
        style={avatar ? { padding: 3, overflow: 'hidden' } : undefined}
      >
        {avatar
          ? <img src={avatar} alt="" referrerPolicy="no-referrer" style={{ width: 22, height: 22, borderRadius: '50%', display: 'block', objectFit: 'cover' }} />
          : user ? <User size={17} /> : <LogIn size={17} />}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={backdrop} />
          <div style={dropdown} role="menu">
            {user ? (
              <>
                <div style={idRow}>
                  {avatar
                    ? <img src={avatar} alt="" referrerPolicy="no-referrer" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={fallbackAvatar}><User size={18} /></div>}
                  <div style={{ minWidth: 0 }}>
                    {name && <div style={nameText}>{name}</div>}
                    <div style={emailText}>{user.email}</div>
                  </div>
                </div>

                <div style={statsRow}>
                  <span style={stat}><Star size={13} style={{ color: '#f59e0b' }} /> {nailedCount} nailed</span>
                  <span style={statDivider} />
                  <span style={stat}><Bookmark size={13} style={{ color: '#ef4444' }} /> {importantCount} important</span>
                </div>

                <div style={syncNote}>
                  <Check size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
                  {lastSaved ? `Saved ${timeAgo(lastSaved)}` : 'Synced across your devices'}
                </div>

                <button onClick={() => { signOut(); setOpen(false) }} style={signOutBtn}>
                  <LogOut size={15} /> Sign out
                </button>
              </>
            ) : (
              <>
                <p style={signInHead}>Sign in to sync your Nailed &amp; Important flags across every device.</p>
                <button type="button" onClick={() => signInWithGoogle()} style={googleBtn}>
                  <GoogleIcon size={17} /> Continue with Google
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const backdrop = { position: 'fixed', inset: 0, zIndex: 1000 }
const dropdown = { position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 1001, width: 256, padding: 14, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 16px 44px rgba(0,0,0,0.22)' }
const idRow = { display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }
const fallbackAvatar = { width: 38, height: 38, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const nameText = { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const emailText = { fontSize: '0.78rem', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const statsRow = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, background: 'var(--elevated)', marginBottom: 8 }
const stat = { display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }
const statDivider = { width: 1, alignSelf: 'stretch', background: 'var(--border)' }
const syncNote = { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--text-3)', marginBottom: 12 }
const signOutBtn = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }
const signInHead = { fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.5, margin: '0 0 12px' }
const googleBtn = { width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: '#fff', color: '#1f2328', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }
