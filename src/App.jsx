import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Home from './views/Home'
import CreatePost from './views/CreatePost'
import Drafts from './views/Drafts'
import Guide from './views/Guide'
import MyProfile from './views/MyProfile'
import './App.css'

export default function App() {
  const [view, setView] = useState('home')
  const [editingDraft, setEditingDraft] = useState(null)
  const [prefilledTopic, setPrefilledTopic] = useState(null)

  function handleEditDraft(draft) {
    setEditingDraft(draft)
    setPrefilledTopic(null)
    setView('create')
  }

  function handleSelectTopic(topic) {
    setPrefilledTopic(topic)
    setEditingDraft(null)
    setView('create')
  }

  function handleViewChange(v) {
    if (v !== 'create') {
      setEditingDraft(null)
      setPrefilledTopic(null)
    }
    setView(v)
  }

  return (
    <div className="app">
      <Sidebar active={view} onNavigate={handleViewChange} />
      <main className="main-content">
        {view === 'home' && <Home onSelectTopic={handleSelectTopic} />}
        {view === 'create' && (
          <CreatePost
            editingDraft={editingDraft}
            onClearDraft={() => setEditingDraft(null)}
            prefilledTopic={prefilledTopic}
            onClearPrefilledTopic={() => setPrefilledTopic(null)}
          />
        )}
        {view === 'drafts' && <Drafts onEdit={handleEditDraft} />}
        {view === 'guide' && <Guide />}
        {view === 'profile' && <MyProfile />}
      </main>
    </div>
  )
}
