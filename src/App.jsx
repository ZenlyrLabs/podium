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
  // Single source of truth for the active article context — persists across Create Post steps
  const [activeArticle, setActiveArticle] = useState(null)

  function handleEditDraft(draft) {
    console.log('[App] handleEditDraft', draft?.id)
    setEditingDraft(draft)
    setActiveArticle(null)
    setView('create')
  }

  // Accepts either a string topic or a full article object
  function handleSelectTopic(articleOrTopic) {
    const article =
      typeof articleOrTopic === 'string'
        ? { headline: articleOrTopic }
        : articleOrTopic
    console.log('[App] handleSelectTopic — article:', {
      headline: article?.headline,
      source: article?.source,
      hasSnippet: !!article?.snippet,
      snippetLength: article?.snippet?.length,
      hasImage: !!article?.image_url,
    })
    setActiveArticle(article)
    setEditingDraft(null)
    setView('create')
  }

  function handleClearArticle() {
    console.log('[App] handleClearArticle')
    setActiveArticle(null)
  }

  function handleViewChange(v) {
    console.log('[App] handleViewChange →', v)
    if (v !== 'create') {
      setEditingDraft(null)
      setActiveArticle(null)
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
            activeArticle={activeArticle}
            onClearArticle={handleClearArticle}
          />
        )}
        {view === 'drafts' && <Drafts onEdit={handleEditDraft} />}
        {view === 'guide' && <Guide />}
        {view === 'profile' && <MyProfile />}
      </main>
    </div>
  )
}
