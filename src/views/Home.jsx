import { useState, useEffect, useRef } from 'react'
import { RefreshCw, TrendingUp, PenLine, Loader2 } from 'lucide-react'
import { fetchTrendingTopics } from '../utils/api'
import './Home.css'

const CACHE_KEY = 'podium_trending_cache'
const CACHE_TTL = 2 * 60 * 60 * 1000 // 2 hours

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

// Generate a deterministic gradient from a string (source name)
function sourceGradient(source) {
  const str = (source || 'News').toLowerCase()
  let h1 = 0
  let h2 = 0
  for (let i = 0; i < str.length; i++) {
    h1 = (h1 + str.charCodeAt(i) * 31) % 360
    h2 = (h2 + str.charCodeAt(i) * 17 + 97) % 360
  }
  // Keep saturation moderate and lightness dark for the dark theme
  const s1 = 35 + (h1 % 30) // 35-65%
  const l1 = 12 + (h1 % 8)  // 12-20%
  const s2 = 40 + (h2 % 25) // 40-65%
  const l2 = 18 + (h2 % 10) // 18-28%
  const angle = 135 + (h1 % 45) // 135-180deg
  return `linear-gradient(${angle}deg, hsl(${h1}, ${s1}%, ${l1}%), hsl(${h2}, ${s2}%, ${l2}%))`
}

function sourceIcon(source) {
  const s = (source || '').toLowerCase()
  if (s.includes('bloomberg') || s.includes('finance') || s.includes('wall street')) return '$'
  if (s.includes('tech') || s.includes('verge') || s.includes('wired') || s.includes('ars')) return '<>'
  if (s.includes('linkedin')) return 'in'
  if (s.includes('forbes')) return 'F'
  if (s.includes('reuters') || s.includes('ap news')) return 'R'
  if (s.includes('harvard') || s.includes('hbr')) return 'H'
  return (source || 'N').charAt(0).toUpperCase()
}

function TopicVisual({ source }) {
  return (
    <div className="topic-visual" style={{ background: sourceGradient(source) }}>
      <span className="topic-visual-icon">{sourceIcon(source)}</span>
      <span className="topic-visual-label">{source || 'News'}</span>
    </div>
  )
}

export default function Home({ onSelectTopic }) {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const hasFetched = useRef(false)

  async function loadTopics() {
    setError('')
    try {
      const results = await fetchTrendingTopics()
      const valid = Array.isArray(results) ? results : []
      setTopics(valid)
      if (valid.length > 0) setCachedTopics(valid)
    } catch (e) {
      console.error('Trending topics error:', e)
      // Only show error if we have nothing to display
      setTopics((prev) => {
        if (prev.length === 0) setError('Failed to load trending topics. Please try again.')
        return prev
      })
    }
  }

  useEffect(() => {
    const cached = getCachedTopics()
    if (cached) {
      // Instant display from cache — no spinner
      setTopics(cached)
      setLoading(false)
      // Silent background refresh
      if (!hasFetched.current) {
        hasFetched.current = true
        loadTopics()
      }
    } else {
      // First visit ever — show spinner
      hasFetched.current = true
      loadTopics().finally(() => setLoading(false))
    }
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
              <TopicVisual source={t.source} />
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
