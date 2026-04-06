export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) }
  }

  try {
    const { prompt, systemPrompt } = JSON.parse(event.body)

    const messages = [{ role: 'user', content: prompt }]

    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages,
    }

    if (systemPrompt) {
      body.system = systemPrompt
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: err.error?.message || 'Anthropic API error' }),
      }
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    }
  }
}
