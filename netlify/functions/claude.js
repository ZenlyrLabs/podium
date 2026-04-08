const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(body),
  }
}

// Fetch a URL and extract the og:image meta tag (3s timeout per URL)
async function extractOgImage(url) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PodiumBot/1.0)' },
      redirect: 'follow',
    })
    clearTimeout(timer)

    if (!res.ok) return null

    // Read only first 50KB to find og:image quickly
    const reader = res.body?.getReader()
    if (!reader) return null

    let html = ''
    const decoder = new TextDecoder()
    while (html.length < 50000) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
      // Stop early if we've passed </head>
      if (html.includes('</head>')) break
    }
    reader.cancel().catch(() => {})

    // Extract og:image from meta tags
    const ogMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    )

    const imageUrl = ogMatch?.[1]
    if (!imageUrl) return null

    // Validate it looks like an image URL
    if (imageUrl.startsWith('http') && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(imageUrl)) {
      return imageUrl
    }
    // Some og:images don't have extensions but are still valid
    if (imageUrl.startsWith('http')) return imageUrl

    return null
  } catch {
    return null
  }
}

// Parse Claude's web search response, extract topics JSON, enrich with og:images
async function enrichTopicsWithImages(contentArray) {
  // Find the last text block (Claude's synthesized answer)
  const textBlock = [...contentArray].reverse().find((b) => b.type === 'text')
  if (!textBlock?.text) return contentArray // Return raw if can't parse

  const cleaned = textBlock.text.replace(/```(?:json)?\s*\n?/g, '').trim()
  let topics
  try {
    topics = JSON.parse(cleaned)
  } catch {
    return contentArray // Return raw if JSON parse fails
  }

  if (!Array.isArray(topics)) return contentArray

  // Fetch og:images in parallel for topics that have URLs
  console.log('[claude] Enriching', topics.length, 'topics with og:images...')
  const enriched = await Promise.all(
    topics.map(async (topic) => {
      if (topic.url) {
        const image_url = await extractOgImage(topic.url)
        if (image_url) {
          console.log('[claude] Got og:image for', topic.source, ':', image_url.substring(0, 80))
          return { ...topic, image_url }
        }
      }
      return topic
    })
  )

  console.log('[claude] Enrichment done —', enriched.filter(t => t.image_url).length, 'images found')
  return enriched
}

export async function handler(event) {
  console.log('[claude] Invoked — method:', event.httpMethod, 'path:', event.path)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  console.log('[claude] API key present:', !!apiKey, 'length:', apiKey?.length ?? 0)

  if (!apiKey) {
    return respond(500, { error: 'API key not configured' })
  }

  try {
    // Netlify may base64-encode large request bodies
    let rawBody = event.body
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(event.body, 'base64').toString('utf-8')
      console.log('[claude] Decoded base64-encoded request body')
    }

    const { prompt, systemPrompt, pdfBase64, useWebSearch } = JSON.parse(rawBody)
    console.log('[claude] Prompt length:', prompt?.length, 'hasPdf:', !!pdfBase64, 'pdfSize:', pdfBase64?.length ?? 0, 'hasSystem:', !!systemPrompt, 'webSearch:', !!useWebSearch)

    let userContent
    const hasPdf = !!pdfBase64

    if (hasPdf) {
      userContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64,
          },
        },
        {
          type: 'text',
          text: prompt,
        },
      ]
    } else {
      userContent = prompt
    }

    const messages = [{ role: 'user', content: userContent }]

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages,
    }

    if (systemPrompt) {
      requestBody.system = systemPrompt
    }

    if (useWebSearch) {
      requestBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }]
      requestBody.max_tokens = 4096
      console.log('[claude] Web search tool enabled')
    }

    // Build headers — PDF document type requires the beta header
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }
    if (hasPdf) {
      headers['anthropic-beta'] = 'pdfs-2024-09-25'
      console.log('[claude] Added PDF beta header')
    }

    console.log('[claude] Calling Anthropic API...')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    console.log('[claude] Anthropic response status:', response.status)

    if (!response.ok) {
      const errText = await response.text()
      console.error('[claude] Anthropic error body:', errText)
      let errMsg = `Anthropic API error (${response.status})`
      try {
        const errJson = JSON.parse(errText)
        errMsg = errJson.error?.message || errMsg
      } catch {}
      return respond(response.status, { error: errMsg })
    }

    const data = await response.json()

    if (useWebSearch) {
      console.log('[claude] Web search response — blocks:', data.content?.length)
      // Parse topics and enrich with og:image from article URLs
      const enriched = await enrichTopicsWithImages(data.content)
      return respond(200, { content: enriched })
    }

    const content = data.content?.[0]?.text || ''
    console.log('[claude] Success — response length:', content.length)

    return respond(200, { content })
  } catch (err) {
    console.error('[claude] Function error:', err.message, err.stack)
    return respond(500, { error: err.message || 'Internal server error' })
  }
}
