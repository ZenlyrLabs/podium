const API_URL = '/api/claude'

export async function callClaude(prompt, systemPrompt = '') {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'API request failed')
  }

  const data = await res.json()
  return data.content
}

export async function callClaudeWithPdf(pdfBase64, prompt, systemPrompt = '') {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt, pdfBase64 }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'API request failed')
  }

  const data = await res.json()
  return data.content
}

export async function fetchTrendingTopics() {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      useWebSearch: true,
      systemPrompt: 'You are a trend analyst. Search the web for current trending topics, then return ONLY a JSON array. No other text or markdown.',
      prompt: `Search for "trending LinkedIn topics today" and "top business news today". Based on the search results, return a JSON array of 8-10 trending topics that would make great LinkedIn posts. Each object must have:\n- "headline": a concise, engaging headline (max 12 words)\n- "source": the publication or website name\n- "snippet": a 1-sentence summary of why this is trending\n- "url": the full article URL from the search result\n\nFocus on business, tech, leadership, careers, and industry trends. Return ONLY the JSON array.`,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Failed to fetch trending topics')
  }

  const data = await res.json()
  const topics = data.content

  // The function now returns parsed + enriched topics directly (array)
  if (Array.isArray(topics)) return topics

  // Fallback: if the function returned raw content blocks, parse them
  if (Array.isArray(topics) && topics[0]?.type) {
    const textBlock = [...topics].reverse().find((b) => b.type === 'text')
    if (!textBlock?.text) throw new Error('No text response from search')
    const cleaned = textBlock.text.replace(/```(?:json)?\s*\n?/g, '').trim()
    return JSON.parse(cleaned)
  }

  throw new Error('Unexpected response format')
}
