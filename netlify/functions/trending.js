const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(body),
  }
}

const SECTIONS = [
  {
    id: 'leadership',
    title: 'Leadership & Management',
    query: 'leadership OR management OR "executive leadership" OR "workplace culture"',
  },
  {
    id: 'ai',
    title: 'AI & Future of Work',
    query: '"artificial intelligence" OR "future of work" OR "AI workplace" OR "workforce automation"',
  },
  {
    id: 'startups',
    title: 'Entrepreneurship & Startups',
    query: 'entrepreneurship OR startups OR founder OR "venture capital" OR "business growth"',
  },
  {
    id: 'cx',
    title: 'CX & Operations',
    query: '"customer experience" OR "contact center" OR "business operations" OR "operational excellence"',
  },
]

function mapArticles(data) {
  return (data.articles || []).map((a) => ({
    headline: a.title,
    source: a.source?.name || 'News',
    snippet: a.description || '',
    image_url: a.image || null,
    url: a.url || null,
    publishedAt: a.publishedAt || null,
  }))
}

async function fetchSection(section, gnewsKey) {
  try {
    const params = new URLSearchParams({
      q: section.query,
      lang: 'en',
      max: '3',
      apikey: gnewsKey,
    })
    const url = `https://gnews.io/api/v4/search?${params.toString()}`
    console.log('[trending]', section.id, '— fetching...')

    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text()
      console.error('[trending]', section.id, 'error', res.status, text.substring(0, 200))
      return { id: section.id, title: section.title, articles: [] }
    }

    const data = await res.json()
    const articles = mapArticles(data)
    console.log('[trending]', section.id, '—', articles.length, 'articles')
    return { id: section.id, title: section.title, articles }
  } catch (err) {
    console.error('[trending]', section.id, 'failed:', err.message)
    return { id: section.id, title: section.title, articles: [] }
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  const gnewsKey = process.env.GNEWS_API_KEY
  if (!gnewsKey) {
    console.error('[trending] GNEWS_API_KEY not configured')
    return respond(500, { error: 'GNews API key not configured' })
  }

  try {
    // Fetch all 4 sections in parallel
    const sections = await Promise.all(
      SECTIONS.map((section) => fetchSection(section, gnewsKey))
    )
    console.log('[trending] All sections fetched')
    return respond(200, { sections })
  } catch (err) {
    console.error('[trending] Function error:', err.message)
    return respond(500, { error: err.message || 'Internal server error' })
  }
}
