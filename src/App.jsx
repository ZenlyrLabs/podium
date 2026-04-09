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
  const [prefilledArticle, setPrefilledArticle] = useState(null)

  function handleEditDraft(draft) {
    setEditingDraft(draft)
    setPrefilledArticle(null)
    setView('create')
  }

  // Accepts either a string topic or a full article object
  function handleSelectTopic(articleOrTopic) {
    const article =
      typeof articleOrTopic === 'string'
        ? { headline: articleOrTopic }
        : articleOrTopic
    setPrefilledArticle(article)
    setEditingDraft(null)
    setView('create')
  }

  function handleViewChange(v) {
    if (v !== 'create') {
      setEditingDraft(null)
      setPrefilledArticle(null)
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
            prefilledArticle={prefilledArticle}
            onClearPrefilledArticle={() => setPrefilledArticle(null)}
          />
        )}
        {view === 'drafts' && <Drafts onEdit={handleEditDraft} />}
        {view === 'guide' && <Guide />}
        {view === 'profile' && <MyProfile />}
      </main>
    </div>
  )
}
