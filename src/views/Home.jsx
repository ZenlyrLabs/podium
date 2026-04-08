import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, PenLine, Loader2 } from 'lucide-react'
import { fetchTrendingTopics } from '../utils/api'
import './Home.css'

const CACHE_KEY = 'podium_trending_cache'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

function getCachedTopics() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { topics, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp < CACHE_TTL && Array.isArray(topics) && topics.length > 0) {
      return topics
    }
  } catch {}
  return null
}

function setCachedTopics(topics) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ topics, timestamp: Date.now() }))
  } catch {}
}

const GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #0f3460, #16213e)',
  'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
  'linear-gradient(135deg, #162447, #1f4068)',
  'linear-gradient(135deg, #1b1b2f, #162447)',
  'linear-gradient(135deg, #2c3333, #395B64)',
  'linear-gradient(135deg, #1a1a2e, #e94560 120%)',
  'linear-gradient(135deg, #0a0a0a, #c8a84b 200%)',
  'linear-gradient(135deg, #2d2d2d, #0f3460)',
  'linear-gradient(135deg, #1b262c, #0f4c75)',
]

function TopicImage({ src, source, index }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className="topic-img-placeholder"
        style={{ background: GRADIENTS[index % GRADIENTS.length] }}
      >
        <span>{(source || 'News').charAt(0).toUpperCase()}</span>
      </div>
    )
  }

  return (
    <img
      className="topic-img"
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export default function Home({ onSelectTopic }) {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function loadTopics({ skipCache = false } = {}) {
    setError('')
    try {
      const results = await fetchTrendingTopics()
      const valid = Array.isArray(results) ? results : []
      setTopics(valid)
      if (valid.length > 0) setCachedTopics(valid)
    } catch (e) {
      console.error('Trending topics error:', e)
      if (topics.length === 0) {
        setError('Failed to load trending topics. Please try again.')
      }
    }
  }

  useEffect(() => {
    const cached = getCachedTopics()
    if (cached) {
      setTopics(cached)
      setLoading(false)
      // Refresh in background
      loadTopics({ skipCache: true })
    } else {
      loadTopics().finally(() => setLoading(false))
    }
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await loadTopics({ skipCache: true })
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
              <TopicImage src={t.image} source={t.source} index={i} />
              <div className="topic-body">
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
