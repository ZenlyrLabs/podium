import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Sparkles, Save, Copy, Check, Loader2 } from 'lucide-react'
import StepIndicator from '../components/StepIndicator'
import { callClaude } from '../utils/api'
import { saveDraft, getProfile } from '../utils/storage'
import './CreatePost.css'

function stripMarkdownFences(text) {
  return text.replace(/```(?:json)?\s*\n?/g, '').trim()
}

const TOPICS = [
  'Leadership & Management',
  'Career Growth',
  'Tech & Innovation',
  'Entrepreneurship',
  'Productivity',
  'Personal Branding',
  'Industry Insights',
  'Lessons Learned',
]

const STYLES = [
  { id: 'storytelling', label: 'Storytelling', desc: 'Narrative-driven, personal anecdotes' },
  { id: 'educational', label: 'Educational', desc: 'Teach something valuable, how-to format' },
  { id: 'contrarian', label: 'Contrarian', desc: 'Challenge conventional wisdom' },
  { id: 'inspirational', label: 'Inspirational', desc: 'Motivate and uplift your audience' },
  { id: 'data-driven', label: 'Data-Driven', desc: 'Facts, stats, and evidence-based insights' },
  { id: 'conversational', label: 'Conversational', desc: 'Casual, engaging, question-based' },
]

export default function CreatePost({ editingDraft, onClearDraft }) {
  const [step, setStep] = useState(0)
  const [topic, setTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [style, setStyle] = useState('')
  const [hooks, setHooks] = useState([])
  const [selectedHook, setSelectedHook] = useState('')
  const [postContent, setPostContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (editingDraft) {
      setPostContent(editingDraft.content || '')
      setTopic(editingDraft.topic || '')
      setStyle(editingDraft.style || '')
      setStep(4)
    }
  }, [editingDraft])

  function reset() {
    setStep(0)
    setTopic('')
    setCustomTopic('')
    setStyle('')
    setHooks([])
    setSelectedHook('')
    setPostContent('')
    setError('')
    onClearDraft()
  }

  const activeTopic = topic === 'custom' ? customTopic : topic

  async function generateHooks() {
    setLoading(true)
    setError('')
    const profile = getProfile()
    const profileContext = profile.summary
      ? `\nAuthor context: ${profile.name || 'Professional'}, ${profile.headline || ''}. ${profile.summary}`
      : ''
    try {
      const result = await callClaude(
        `Generate 4 compelling LinkedIn post hooks/opening lines about "${activeTopic}" in a ${style} style. Each hook should be 1-2 sentences that grab attention and make people want to read more.${profileContext}\n\nReturn ONLY a JSON array of 4 strings, no other text.`,
        'You are an expert LinkedIn content creator. Return valid JSON only.'
      )
      const parsed = JSON.parse(stripMarkdownFences(result))
      setHooks(Array.isArray(parsed) ? parsed : [])
      setStep(3)
    } catch (e) {
      setError('Failed to generate hooks. Please check your API key and try again.')
    }
    setLoading(false)
  }

  async function generatePost() {
    setLoading(true)
    setError('')
    const profile = getProfile()
    const profileContext = profile.summary
      ? `\nAuthor context: ${profile.name || 'Professional'}, ${profile.headline || ''}. ${profile.summary}`
      : ''
    try {
      const result = await callClaude(
        `Write a LinkedIn post about "${activeTopic}" in a ${style} style. Start with this hook: "${selectedHook}"${profileContext}\n\nThe post should be 150-250 words, engaging, and optimized for LinkedIn. Include relevant line breaks for readability. End with a thought-provoking question or call to action. Do NOT include hashtags.`,
        'You are an expert LinkedIn ghostwriter. Write the post content only, no explanations.'
      )
      setPostContent(result.trim())
      setStep(4)
    } catch (e) {
      setError('Failed to generate post. Please try again.')
    }
    setLoading(false)
  }

  function handleSave() {
    saveDraft({
      ...(editingDraft || {}),
      content: postContent,
      topic: activeTopic,
      style,
      hook: selectedHook,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCopy() {
    navigator.clipboard.writeText(postContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canNext =
    (step === 0 && (topic && (topic !== 'custom' || customTopic.trim()))) ||
    (step === 1 && style) ||
    (step === 3 && selectedHook)

  return (
    <div className="create-post">
      <div className="view-header">
        <h2>Create Post</h2>
        {step > 0 && (
          <button className="btn-text" onClick={reset}>
            Start Over
          </button>
        )}
      </div>

      <StepIndicator current={step} />

      {error && <div className="error-banner">{error}</div>}

      {step === 0 && (
        <div className="step-content">
          <h3>What's your post about?</h3>
          <p className="step-desc">Choose a topic or enter your own.</p>
          <div className="topic-grid">
            {TOPICS.map((t) => (
              <button
                key={t}
                className={`chip ${topic === t ? 'selected' : ''}`}
                onClick={() => { setTopic(t); setCustomTopic('') }}
              >
                {t}
              </button>
            ))}
            <button
              className={`chip ${topic === 'custom' ? 'selected' : ''}`}
              onClick={() => setTopic('custom')}
            >
              Custom Topic
            </button>
          </div>
          {topic === 'custom' && (
            <input
              className="text-input"
              placeholder="Enter your topic..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              autoFocus
            />
          )}
        </div>
      )}

      {step === 1 && (
        <div className="step-content">
          <h3>Choose a writing style</h3>
          <p className="step-desc">How should your post feel?</p>
          <div className="style-grid">
            {STYLES.map((s) => (
              <button
                key={s.id}
                className={`style-card ${style === s.id ? 'selected' : ''}`}
                onClick={() => setStyle(s.id)}
              >
                <strong>{s.label}</strong>
                <span>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step-content loading-step">
          <Loader2 className="spinner" size={32} />
          <h3>Generating hooks...</h3>
          <p className="step-desc">AI is crafting attention-grabbing openers for your post.</p>
        </div>
      )}

      {step === 3 && (
        <div className="step-content">
          <h3>Pick your hook</h3>
          <p className="step-desc">Choose the opening that resonates most.</p>
          <div className="hooks-list">
            {hooks.map((h, i) => (
              <button
                key={i}
                className={`hook-card ${selectedHook === h ? 'selected' : ''}`}
                onClick={() => setSelectedHook(h)}
              >
                <span className="hook-num">{i + 1}</span>
                <span>{h}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="step-content">
          <h3>Your Post</h3>
          <p className="step-desc">Edit the content below and copy when ready.</p>
          {loading ? (
            <div className="loading-step">
              <Loader2 className="spinner" size={32} />
              <p>Generating your post...</p>
            </div>
          ) : (
            <>
              <textarea
                className="post-editor"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={12}
                placeholder="Your post content will appear here..."
              />
              <div className="char-count">{postContent.length} characters</div>
              <div className="editor-actions">
                <button className="btn-primary" onClick={handleCopy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button className="btn-secondary" onClick={handleSave}>
                  {saved ? <Check size={16} /> : <Save size={16} />}
                  {saved ? 'Saved!' : 'Save as Draft'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step < 4 && step !== 2 && (
        <div className="step-nav">
          {step > 0 && step !== 2 && (
            <button className="btn-secondary" onClick={() => setStep(step === 3 ? 1 : step - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button
            className="btn-primary"
            disabled={!canNext || loading}
            onClick={() => {
              if (step === 1) {
                setStep(2)
                setTimeout(generateHooks, 100)
              } else if (step === 3) {
                generatePost()
              } else {
                setStep(step + 1)
              }
            }}
          >
            {step === 3 ? (
              <>
                <Sparkles size={16} /> Generate Post
              </>
            ) : (
              <>
                Next <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
