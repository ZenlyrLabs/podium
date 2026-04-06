import { useState } from 'react'
import Sidebar from './components/Sidebar'
import CreatePost from './views/CreatePost'
import Drafts from './views/Drafts'
import MyProfile from './views/MyProfile'
import './App.css'

export default function App() {
  const [view, setView] = useState('create')
  const [editingDraft, setEditingDraft] = useState(null)

  function handleEditDraft(draft) {
    setEditingDraft(draft)
    setView('create')
  }

  function handleViewChange(v) {
    if (v !== 'create') setEditingDraft(null)
    setView(v)
  }

  return (
    <div className="app">
      <Sidebar active={view} onNavigate={handleViewChange} />
      <main className="main-content">
        {view === 'create' && (
          <CreatePost
            editingDraft={editingDraft}
            onClearDraft={() => setEditingDraft(null)}
          />
        )}
        {view === 'drafts' && <Drafts onEdit={handleEditDraft} />}
        {view === 'profile' && <MyProfile />}
      </main>
    </div>
  )
}
