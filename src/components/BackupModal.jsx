import { useState, useRef } from 'react'
import { X, Copy, Check, Upload, Download, ShieldCheck } from 'lucide-react'
import { generateCypher, parseCypher } from '../lib/backup.js'

export default function BackupModal({ mastered, important, writtenMastered, topics, writtenTList, onRestore, onClose }) {
  const [tab, setTab]           = useState('export')
  const [copied, setCopied]     = useState(false)
  const [importText, setImportText] = useState('')
  const [error, setError]       = useState('')
  const [restoreSummary, setRestoreSummary] = useState(null)
  const textRef = useRef(null)

  const cypher = generateCypher(mastered, important, writtenMastered, topics, writtenTList)
  const nailedCount         = mastered.size
  const writtenNailedCount  = writtenMastered.size
  const importantCount      = [...important].filter(id => !id.startsWith('written__')).length
  const writtenImportantCount = [...important].filter(id => id.startsWith('written__')).length

  function handleCopy() {
    navigator.clipboard.writeText(cypher).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleRestore() {
    setError('')
    setRestoreSummary(null)
    try {
      const { nailed, important: imp, writtenNailed, writtenImportant } = parseCypher(importText, topics, writtenTList)
      const newNailed          = nailed.filter(id => !mastered.has(id)).length
      const newImportant       = imp.filter(id => !important.has(id)).length
      const newWrittenNailed   = writtenNailed.filter(id => !writtenMastered.has(id)).length
      const newWrittenImportant = writtenImportant.filter(id => !important.has(id)).length
      onRestore(nailed, imp, writtenNailed, writtenImportant)
      setRestoreSummary({ newNailed, newImportant, newWrittenNailed, newWrittenImportant })
      setTimeout(onClose, 2800)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="backup-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="backup-modal anim-slide">
        <div className="backup-header">
          <div className="backup-title-row">
            <ShieldCheck size={18} className="backup-title-icon" />
            <div>
              <div className="backup-title">Backup & Restore</div>
              <div className="backup-sub">
                {nailedCount} nailed · {importantCount} important · {writtenNailedCount} written nailed · {writtenImportantCount} written important
              </div>
            </div>
          </div>
          <button className="backup-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="backup-tabs">
          <button
            className={`backup-tab${tab === 'export' ? ' active' : ''}`}
            onClick={() => setTab('export')}
          >
            <Download size={13} /> Export
          </button>
          <button
            className={`backup-tab${tab === 'import' ? ' active' : ''}`}
            onClick={() => setTab('import')}
          >
            <Upload size={13} /> Restore
          </button>
        </div>

        {tab === 'export' ? (
          <div className="backup-body">
            <p className="backup-hint">
              Save this code somewhere safe. Paste it in any device to restore your progress.
            </p>
            <div className="backup-cypher-wrap">
              <textarea
                ref={textRef}
                className="backup-cypher"
                readOnly
                value={cypher}
                onClick={e => e.target.select()}
                spellCheck={false}
              />
            </div>
            <button className="backup-copy-btn" onClick={handleCopy}>
              {copied
                ? <><Check size={14} /> Copied to clipboard!</>
                : <><Copy size={14} /> Copy backup code</>}
            </button>
          </div>
        ) : (
          <div className="backup-body">
            <p className="backup-hint">
              Paste your backup code below. Your existing progress will be merged (nothing deleted).
            </p>
            <textarea
              className="backup-cypher backup-cypher--input"
              value={importText}
              onChange={e => { setImportText(e.target.value); setError(''); setRestoreSummary(null) }}
              placeholder="Paste your ICT:... backup code here"
              spellCheck={false}
            />
            {error && <p className="backup-error">{error}</p>}
            {restoreSummary && (
              <div className="backup-summary">
                <div className="backup-summary-title">Restored successfully!</div>
                <div className="backup-summary-row">
                  <span className="bsr-nailed">⭐ {restoreSummary.newNailed} nailed</span>
                  <span className="bsr-dot">·</span>
                  <span className="bsr-important">🔖 {restoreSummary.newImportant} important</span>
                </div>
                {(restoreSummary.newWrittenNailed > 0 || restoreSummary.newWrittenImportant > 0) && (
                  <div className="backup-summary-row">
                    <span className="bsr-nailed">✏️ {restoreSummary.newWrittenNailed} written nailed</span>
                    <span className="bsr-dot">·</span>
                    <span className="bsr-important">📌 {restoreSummary.newWrittenImportant} written important</span>
                  </div>
                )}
                {restoreSummary.newNailed === 0 && restoreSummary.newImportant === 0 &&
                 restoreSummary.newWrittenNailed === 0 && restoreSummary.newWrittenImportant === 0 && (
                  <div className="backup-summary-already">All items were already saved — nothing changed.</div>
                )}
              </div>
            )}
            <button
              className="backup-restore-btn"
              onClick={handleRestore}
              disabled={!importText.trim()}
            >
              <Upload size={14} /> Restore Progress
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
