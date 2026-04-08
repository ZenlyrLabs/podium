import { useState, useEffect, useRef } from 'react'
import { RefreshCw, TrendingUp, PenLine, Loader2 } from 'lucide-react'
import { fetchTrendingTopics } from '../utils/api'
import './Home.css'

const CACHE_KEY = 'podium_trending_cache'
const CACHE_TTL = 2 * 60 * 60 * 1000

const FALLBACK_TOPICS = [
  { headline: 'AI Is Reshaping the Future of Hiring', source: 'Forbes', domain: 'forbes.com', snippet: 'Companies are rethinking recruitment as AI tools screen candidates faster than ever.' },
  { headline: 'Remote Work Debate Heats Up Again', source: 'Bloomberg', domain: 'bloomberg.com', snippet: 'Major firms are reversing remote policies while employees push back on return-to-office mandates.' },
  { headline: 'The Rise of the Fractional Executive', source: 'Harvard Business Review', domain: 'hbr.org', snippet: 'More C-suite leaders are going part-time across multiple companies instead of one full-time role.' },
  { headline: 'Why Emotional Intelligence Beats IQ at Work', source: 'LinkedIn News', domain: 'linkedin.com', snippet: 'New research shows EQ is the strongest predictor of leadership effectiveness and team performance.' },
  { headline: 'Tech Layoffs Are Shifting to Middle Management', source: 'The Wall Street Journal', domain: 'wsj.com', snippet: 'After cutting engineers, companies are now flattening org charts by removing management layers.' },
  { headline: 'Climate Tech Investment Hits Record High', source: 'Reuters', domain: 'reuters.com', snippet: 'Venture capital pours into clean energy startups as regulatory pressure mounts globally.' },
  { headline: 'Personal Branding Is No Longer Optional', source: 'Fast Company', domain: 'fastcompany.com', snippet: 'Executives who build a public presence are getting promoted faster and attracting better opportunities.' },
  { headline: 'The Four-Day Work Week Goes Mainstream', source: 'BBC', domain: 'bbc.com', snippet: 'Pilot programs across Europe show productivity gains with no revenue loss from shorter weeks.' },
  { headline: 'Founder Burnout Is a Growing Crisis', source: 'TechCrunch', domain: 'techcrunch.com', snippet: 'Startup founders report record levels of exhaustion as funding markets tighten.' },
  { headline: 'Skills-Based Hiring Is Replacing Degree Requirements', source: 'CNBC', domain: 'cnbc.com', snippet: 'Google, Apple, and IBM lead the shift toward skills over diplomas in job postings.' },
  { headline: 'How Leaders Build Trust in Uncertain Times', source: 'MIT Sloan', domain: 'sloanreview.mit.edu', snippet: 'Transparent communication and decisive action are the top trust-building behaviors employees value.' },
  { headline: 'The Creator Economy Reaches $250 Billion', source: 'The Verge', domain: 'theverge.com', snippet: 'Content creators now rival traditional media companies in audience reach and advertising revenue.' },
]

// Map source name to a Clearbit-compatible domain
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
  'the washington post': 'washingtonpost.com',
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
  'yahoo finance': 'finance.yahoo.com',
  'financial times': 'ft.com',
  'ft': 'ft.com',
  'ars technica': 'arstechnica.com',
  'venturebeat': 'venturebeat.com',
  'engadget': 'engadget.com',
  'the information': 'theinformation.com',
  'protocol': 'protocol.com',
  'semafor': 'semafor.com',
  'time': 'time.com',
}

function getDomain(topic) {
  if (topic.domain) return topic.domain
  const key = (topic.source || '').toLowerCase().trim()
  if (DOMAIN_MAP[key]) return DOMAIN_MAP[key]
  // Best guess: lowercase, strip "the ", add .com
  const guess = key.replace(/^the\s+/, '').replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  return guess ? `${guess}.com` : null
}

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

// Deterministic gradient from source name — fallback for failed logos
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

function TopicVisual({ source, domain }) {
  const [logoFailed, setLogoFailed] = useState(false)
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null

  return (
    <div className="topic-visual" style={{ background: sourceGradient(source) }}>
      {logoUrl && !logoFailed ? (
        <img
          className="topic-logo"
          src={logoUrl}
          alt={source}
          loading="lazy"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <>
          <span className="topic-visual-icon">
            {(source || 'N').charAt(0).toUpperCase()}
          </span>
          <span className="topic-visual-label">{source || 'News'}</span>
        </>
      )}
    </div>
  )
}

export default function Home({ onSelectTopic }) {
  // Always start with content — cache, or fallbacks
  const [topics, setTopics] = useState(() => getCachedTopics() || FALLBACK_TOPICS)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const hasFetched = useRef(false)

  async function loadTopics() {
    try {
      const results = await fetchTrendingTopics()
      const valid = Array.isArray(results) ? results : []
      if (valid.length > 0) {
        setTopics(valid)
        setCachedTopics(valid)
      }
    } catch (e) {
      console.error('Trending topics error:', e)
      // Silently fail — we already have content showing
    }
  }

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      loadTopics()
    }
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    setError('')
    try {
      const results = await fetchTrendingTopics()
      const valid = Array.isArray(results) ? results : []
      if (valid.length > 0) {
        setTopics(valid)
        setCachedTopics(valid)
      } else {
        setError('No topics returned. Showing previous results.')
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

      <div className="topics-grid">
        {topics.map((t, i) => (
          <div key={i} className="topic-card">
            <TopicVisual source={t.source} domain={getDomain(t)} />
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
    </div>
  )
}
