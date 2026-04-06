import { useState, useEffect } from 'react'
import { FileText, Pencil, Trash2, Copy, Check } from 'lucide-react'
import { getDrafts, deleteDraft } from '../utils/storage'
import './Drafts.css'

export default function Drafts({ onEdit }) {
  const [drafts, setDrafts] = useState([])
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    setDrafts(getDrafts())
  }, [])

  function handleDelete(id) {
    setDrafts(deleteDraft(id))
  }

  function handleCopy(draft) {
    navigator.clipboard.writeText(draft.content)
    setCopiedId(draft.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="drafts-view">
      <div className="view-header">
        <h2>Drafts</h2>
        <span className="draft-count">{drafts.length} saved</span>
      </div>

      {drafts.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} strokeWidth={1} />
          <h3>No drafts yet</h3>
          <p>Posts you save will appear here.</p>
        </div>
      ) : (
        <div className="drafts-list">
          {drafts.map((draft) => (
            <div key={draft.id} className="draft-card">
              <div className="draft-meta">
                <span className="draft-topic">{draft.topic || 'Untitled'}</span>
                <span className="draft-date">{formatDate(draft.updatedAt)}</span>
              </div>
              <p className="draft-preview">
                {draft.content?.slice(0, 160)}
                {draft.content?.length > 160 ? '...' : ''}
              </p>
              <div className="draft-actions">
                <button className="icon-btn" title="Edit" onClick={() => onEdit(draft)}>
                  <Pencil size={15} />
                </button>
                <button className="icon-btn" title="Copy" onClick={() => handleCopy(draft)}>
                  {copiedId === draft.id ? <Check size={15} /> : <Copy size={15} />}
                </button>
                <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(draft.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
