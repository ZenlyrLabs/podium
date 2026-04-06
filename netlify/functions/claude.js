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
    const { prompt, systemPrompt, pdfBase64 } = JSON.parse(event.body)
    console.log('[claude] Prompt length:', prompt?.length, 'hasPdf:', !!pdfBase64, 'hasSystem:', !!systemPrompt)

    let userContent

    if (pdfBase64) {
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

    console.log('[claude] Calling Anthropic API...')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
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
    const content = data.content?.[0]?.text || ''
    console.log('[claude] Success — response length:', content.length)

    return respond(200, { content })
  } catch (err) {
    console.error('[claude] Function error:', err.message, err.stack)
    return respond(500, { error: err.message || 'Internal server error' })
  }
}
