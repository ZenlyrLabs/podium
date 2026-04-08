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
    const url = `https://gnews.io/api/v4/top-headlines?topic=business&lang=en&max=9&apikey=${gnewsKey}`
    console.log('[trending] Fetching GNews headlines...')

    const res = await fetch(url)

    if (!res.ok) {
      const errText = await res.text()
      console.error('[trending] GNews error:', res.status, errText)
      return respond(res.status, { error: `GNews API error (${res.status})` })
    }

    const data = await res.json()
    const articles = (data.articles || []).map((a) => ({
      headline: a.title,
      source: a.source?.name || 'News',
      snippet: a.description || '',
      image_url: a.image || null,
      url: a.url || null,
      publishedAt: a.publishedAt || null,
    }))

    console.log('[trending] Returned', articles.length, 'articles')
    return respond(200, { articles })
  } catch (err) {
    console.error('[trending] Function error:', err.message)
    return respond(500, { error: err.message || 'Internal server error' })
  }
}
