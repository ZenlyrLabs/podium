import { useState, useEffect, useRef } from 'react'
import { RefreshCw, TrendingUp, PenLine } from 'lucide-react'
import { fetchTrendingSections } from '../utils/api'
import './Home.css'

function timeAgo(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const CACHE_KEY = 'podium_trending_sections_v2'
const CACHE_TTL = 2 * 60 * 60 * 1000 // 2 hours

const FALLBACK_SECTIONS = [
  {
    id: 'leadership',
    title: 'Leadership & Management',
    articles: [
      { headline: 'Why Emotional Intelligence Beats IQ in Modern Leadership', source: 'Harvard Business Review', domain: 'hbr.org', snippet: 'New research shows EQ is the strongest predictor of leadership effectiveness across industries.' },
      { headline: 'The Return of the Chief of Staff Role', source: 'Fortune', domain: 'fortune.com', snippet: 'CEOs are hiring right-hand operators at record rates to execute on strategy faster.' },
      { headline: 'How Top Leaders Build Trust in Uncertain Times', source: 'MIT Sloan', domain: 'sloanreview.mit.edu', snippet: 'Transparent communication and decisive action rank as the top trust-building behaviors.' },
    ],
  },
  {
    id: 'ai',
    title: 'AI & Future of Work',
    articles: [
      { headline: 'AI Copilots Are Rewriting the Knowledge Worker Playbook', source: 'The Wall Street Journal', domain: 'wsj.com', snippet: 'Office workers using AI assistants report significant productivity gains across industries.' },
      { headline: 'The Jobs AI Will Transform First', source: 'Bloomberg', domain: 'bloomberg.com', snippet: 'Legal research, customer support, and data analysis lead the list of roles being reshaped.' },
      { headline: 'Why Human Skills Matter More, Not Less, in the AI Era', source: 'Forbes', domain: 'forbes.com', snippet: 'Judgment, empathy, and creativity are becoming the key differentiators as AI handles execution.' },
    ],
  },
  {
    id: 'startups',
    title: 'Entrepreneurship & Startups',
    articles: [
      { headline: 'Solo Founders Are Raising Bigger Rounds Than Ever', source: 'TechCrunch', domain: 'techcrunch.com', snippet: 'AI tools enable individual founders to build product and traction that used to require full teams.' },
      { headline: 'The Return of Capital-Efficient Startups', source: 'The Information', domain: 'theinformation.com', snippet: 'Investors are rewarding founders who reach profitability fast instead of burning cash for growth.' },
      { headline: 'Fractional Executives: The New Startup Hiring Model', source: 'Inc.', domain: 'inc.com', snippet: 'Early-stage companies are hiring seasoned C-suite talent part-time to avoid full-time overhead.' },
    ],
  },
  {
    id: 'cx',
    title: 'CX & Operations',
    articles: [
      { headline: 'AI Agents Are Transforming the Contact Center', source: 'CNBC', domain: 'cnbc.com', snippet: 'Voice AI is now handling complex support conversations that previously required human agents.' },
      { headline: 'How Operational Excellence Drives Retention', source: 'McKinsey', domain: 'mckinsey.com', snippet: 'Companies with the highest operational consistency score 40% better on customer retention metrics.' },
      { headline: 'The End of Tiered Support Models', source: 'Fast Company', domain: 'fastcompany.com', snippet: 'Leading companies are empowering frontline reps with full authority instead of escalation chains.' },
    ],
  },
]

const DOMAIN_MAP = {
  'forbes': 'forbes.com',
  'bloomberg': 'bloomberg.com',
  'harvard business review': 'hbr.org',
  'hbr': 'hbr.org',
  'linkedin news': 'linkedin.com',
  'linkedin': 'linkedin.com',
  'the wall street journal': 'wsj.com',
  'wall street journal': 'wsj.com',
  'wsj': 'wsj.com',
  'reuters': 'reuters.com',
  'fast company': 'fastcompany.com',
  'bbc': 'bbc.com',
  'techcrunch': 'techcrunch.com',
  'cnbc': 'cnbc.com',
  'mit sloan': 'sloanreview.mit.edu',
  'the verge': 'theverge.com',
  'wired': 'wired.com',
  'the new york times': 'nytimes.com',
  'new york times': 'nytimes.com',
  'nyt': 'nytimes.com',
  'washington post': 'washingtonpost.com',
  'cnn': 'cnn.com',
  'ap news': 'apnews.com',
  'business insider': 'businessinsider.com',
  'insider': 'businessinsider.com',
  'the economist': 'economist.com',
  'economist': 'economist.com',
  'fortune': 'fortune.com',
  'inc.': 'inc.com',
  'inc': 'inc.com',
  'the guardian': 'theguardian.com',
  'axios': 'axios.com',
  'financial times': 'ft.com',
  'ft': 'ft.com',
  'ars technica': 'arstechnica.com',
  'venturebeat': 'venturebeat.com',
  'the information': 'theinformation.com',
  'semafor': 'semafor.com',
  'time': 'time.com',
  'mckinsey': 'mckinsey.com',
}

function getDomain(topic) {
  if (topic.domain) return topic.domain
  const key = (topic.source || '').toLowerCase().trim()
  if (DOMAIN_MAP[key]) return DOMAIN_MAP[key]
  const guess = key.replace(/^the\s+/, '').replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  return guess ? `${guess}.com` : null
}

function getCachedSections() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { sections, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp < CACHE_TTL && Array.isArray(sections) && sections.length > 0) {
      return sections
    }
  } catch {}
  return null
}

function setCachedSections(sections) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ sections, timestamp: Date.now() }))
  } catch {}
}

function sourceGradient(source) {
  const str = (source || 'News').toLowerCase()
  let h1 = 0, h2 = 0
  for (let i = 0; i < str.length; i++) {
    h1 = (h1 + str.charCodeAt(i) * 31) % 360
    h2 = (h2 + str.charCodeAt(i) * 17 + 97) % 360
  }
  const s1 = 35 + (h1 % 30)
  const l1 = 12 + (h1 % 8)
  const s2 = 40 + (h2 % 25)
  const l2 = 18 + (h2 % 10)
  const angle = 135 + (h1 % 45)
  return `linear-gradient(${angle}deg, hsl(${h1}, ${s1}%, ${l1}%), hsl(${h2}, ${s2}%, ${l2}%))`
}

function TopicVisual({ source, domain, imageUrl }) {
  const [imgFailed, setImgFailed] = useState(false)
  const [faviconFailed, setFaviconFailed] = useState(false)
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null

  if (imageUrl && !imgFailed) {
    return (
      <div className="topic-visual-wrap">
        <img
          className="topic-hero"
          src={imageUrl}
          alt=""
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      </div>
    )
  }

  return (
    <div className="topic-visual" style={{ background: sourceGradient(source) }}>
      {faviconUrl && !faviconFailed ? (
        <img
          className="topic-logo"
          src={faviconUrl}
          alt={source}
          loading="lazy"
          onError={() => setFaviconFailed(true)}
        />
      ) : (
        <>
          <span className="topic-visual-icon">{(source || 'N').charAt(0).toUpperCase()}</span>
          <span className="topic-visual-label">{source || 'News'}</span>
        </>
      )}
    </div>
  )
}

function TopicCard({ topic, onSelectTopic }) {
  return (
    <div className="topic-card">
      <TopicVisual source={topic.source} domain={getDomain(topic)} imageUrl={topic.image_url} />
      <div className="topic-body">
        <div className="topic-meta">
          <div className="topic-source">
            <TrendingUp size={13} />
            <span>{topic.source || 'Trending'}</span>
          </div>
          {topic.publishedAt && <span className="topic-time">{timeAgo(topic.publishedAt)}</span>}
        </div>
        <h3 className="topic-headline">{topic.headline}</h3>
        <p className="topic-snippet">{topic.snippet}</p>
        <button
          className="btn-primary write-btn"
          onClick={() => onSelectTopic(topic.headline)}
        >
          <PenLine size={14} />
          Write Post About This
        </button>
      </div>
    </div>
  )
}

// Merge fresh sections with fallbacks: if a section came back empty, keep the fallback
function mergeWithFallbacks(fresh) {
  return FALLBACK_SECTIONS.map((fb) => {
    const match = fresh.find((s) => s.id === fb.id)
    if (match && Array.isArray(match.articles) && match.articles.length > 0) {
      return { id: fb.id, title: fb.title, articles: match.articles }
    }
    return fb
  })
}

export default function Home({ onSelectTopic }) {
  const [sections, setSections] = useState(() => getCachedSections() || FALLBACK_SECTIONS)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const hasFetched = useRef(false)

  async function loadSections() {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      )
      const fresh = await Promise.race([fetchTrendingSections(), timeout])
      if (Array.isArray(fresh) && fresh.length > 0) {
        const merged = mergeWithFallbacks(fresh)
        setSections(merged)
        setCachedSections(merged)
      }
    } catch (e) {
      console.error('Trending sections error:', e)
      // Silently fail — fallbacks already showing
    }
  }

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      loadSections()
    }
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    setError('')
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      )
      const fresh = await Promise.race([fetchTrendingSections(), timeout])
      if (Array.isArray(fresh) && fresh.length > 0) {
        const merged = mergeWithFallbacks(fresh)
        setSections(merged)
        setCachedSections(merged)
      } else {
        setError('No updates available. Showing previous results.')
      }
    } catch (e) {
      setError('Failed to refresh. Showing previous results.')
    }
    setRefreshing(false)
  }

  return (
    <div className="home-view">
      <div className="home-header">
        <div>
          <h2>Trending Now</h2>
          <p className="home-subtitle">Curated news across the topics you write about</p>
        </div>
        <button
          className="btn-secondary refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={15} className={refreshing ? 'spinner' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh All'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {sections.map((section) => (
        <section key={section.id} className="topic-section">
          <div className="section-header">
            <h3 className="section-title">{section.title}</h3>
            <div className="section-divider" />
          </div>
          <div className="section-grid">
            {section.articles.map((topic, i) => (
              <TopicCard key={i} topic={topic} onSelectTopic={onSelectTopic} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
