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

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return respond(500, { error: 'API key not configured' })
  }

  try {
    const { prompt, systemPrompt, pdfBase64 } = JSON.parse(event.body)

    let userContent

    if (pdfBase64) {
      // Use Anthropic's document content type for PDF files
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
      console.error('Anthropic API error:', JSON.stringify(err))
      return respond(response.status, {
        error: err.error?.message || `Anthropic API error (${response.status})`,
      })
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    return respond(200, { content })
  } catch (err) {
    console.error('Function error:', err)
    return respond(500, { error: err.message || 'Internal server error' })
  }
}
