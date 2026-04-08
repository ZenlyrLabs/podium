import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, PenLine, Loader2 } from 'lucide-react'
import { fetchTrendingTopics } from '../utils/api'
import './Home.css'

export default function Home({ onSelectTopic }) {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function loadTopics() {
    setError('')
    try {
      const results = await fetchTrendingTopics()
      setTopics(Array.isArray(results) ? results : [])
    } catch (e) {
      console.error('Trending topics error:', e)
      setError('Failed to load trending topics. Please try again.')
    }
  }

  useEffect(() => {
    setLoading(true)
    loadTopics().finally(() => setLoading(false))
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await loadTopics()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="home-view">
        <div className="loading-step">
          <Loader2 className="spinner" size={32} />
          <h3>Loading trending topics...</h3>
          <p className="step-desc">Searching the web for what's happening today.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="home-view">
      <div className="home-header">
        <div>
          <h2>Trending Now</h2>
          <p className="home-subtitle">Today's top topics to write about on LinkedIn</p>
        </div>
        <button
          className="btn-secondary refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={15} className={refreshing ? 'spinner' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {topics.length > 0 && (
        <div className="topics-grid">
          {topics.map((t, i) => (
            <div key={i} className="topic-card">
              <div className="topic-source">
                <TrendingUp size={13} />
                <span>{t.source || 'Trending'}</span>
              </div>
              <h3 className="topic-headline">{t.headline}</h3>
              <p className="topic-snippet">{t.snippet}</p>
              <button
                className="btn-primary write-btn"
                onClick={() => onSelectTopic(t.headline)}
              >
                <PenLine size={14} />
                Write Post About This
              </button>
            </div>
          ))}
        </div>
      )}

      {topics.length === 0 && !error && (
        <div className="empty-state">
          <TrendingUp size={48} strokeWidth={1} />
          <h3>No topics found</h3>
          <p>Try refreshing to load trending topics.</p>
        </div>
      )}
    </div>
  )
}
