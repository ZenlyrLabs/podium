export async function callClaude(prompt, systemPrompt = '') {
  const res = await fetch('/.netlify/functions/claude', {
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
  const res = await fetch('/.netlify/functions/claude', {
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
