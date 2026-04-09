import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Sparkles, Save, Copy, Check, Loader2 } from 'lucide-react'
import StepIndicator from '../components/StepIndicator'
import { callClaude } from '../utils/api'
import { saveDraft, getProfile } from '../utils/storage'
import './CreatePost.css'

function stripMarkdownFences(text) {
  return text.replace(/```(?:json)?\s*\n?/g, '').trim()
}

function buildAuthorBrief(profile) {
  const sections = []
  sections.push('=== AUTHOR BRIEF ===')

  if (profile.name) sections.push(`Name: ${profile.name}`)
  if (profile.headline) sections.push(`Role: ${profile.headline}`)
  if (profile.summary) sections.push(`Career Summary: ${profile.summary}`)

  if (profile.accomplishments) {
    const items = profile.accomplishments.split('\n').filter(Boolean).map(a => `  - ${a.trim()}`)
    if (items.length) sections.push(`Key Accomplishments:\n${items.join('\n')}`)
  }

  if (profile.expertise) {
    const items = profile.expertise.split('\n').filter(Boolean)
    sections.push(`Expertise: ${items.join(', ')}`)
  }

  if (profile.communicationStyle) {
    sections.push(`Communication Style: ${profile.communicationStyle}`)
  }

  if (profile.topics) sections.push(`Topics: ${profile.topics}`)

  if (profile.voiceSamples?.trim()) {
    sections.push(`\n=== VOICE SAMPLES (match this writing style closely) ===`)
    sections.push(profile.voiceSamples.trim())
  }

  sections.push('=== END AUTHOR BRIEF ===')
  return sections.join('\n')
}

const HOOK_SYSTEM = `You are a LinkedIn ghostwriter who writes in the exact voice and style of the author described below. Study their voice samples carefully — match their sentence structure, vocabulary, rhythm, and personality. Hooks should feel like something this specific person would write, not a generic content creator. Return valid JSON only — an array of 4 strings.`

const POST_SYSTEM = `You are a LinkedIn ghostwriter who writes in the exact voice and style of the author described below. Study their voice samples carefully — match their sentence structure, vocabulary, rhythm, and personality precisely. Draw on their real accomplishments and expertise to add specific, authentic details. Never sound generic, corporate, or like a template. Write the post content only — no explanations, preamble, or hashtags.`

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
  { id: 'storytelling', label: 'Storytelling', emoji: '📖', desc: 'Narrative-driven, personal anecdotes' },
  { id: 'educational', label: 'Educational', emoji: '🎓', desc: 'Teach something valuable, how-to format' },
  { id: 'contrarian', label: 'Contrarian', emoji: '🔥', desc: 'Challenge conventional wisdom' },
  { id: 'inspirational', label: 'Inspirational', emoji: '✨', desc: 'Motivate and uplift your audience' },
  { id: 'data-driven', label: 'Data-Driven', emoji: '📊', desc: 'Facts, stats, and evidence-based insights' },
  { id: 'conversational', label: 'Conversational', emoji: '💭', desc: 'Casual, engaging, question-based' },
  { id: 'commentary', label: 'Commentary', emoji: '💬', desc: 'Share your expert perspective on a trending news story' },
]

function ArticlePreviewCard({ article }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = article.image_url && !imgFailed

  return (
    <div className="article-preview">
      {showImage && (
        <img
          className="article-preview-img"
          src={article.image_url}
          alt=""
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      )}
      <div className="article-preview-body">
        <div className="article-preview-source">{article.source || 'News'}</div>
        <div className="article-preview-headline">{article.headline}</div>
        {article.snippet && (
          <div className="article-preview-snippet">{article.snippet}</div>
        )}
      </div>
    </div>
  )
}

function buildArticleContext(article) {
  if (!article || !article.snippet) return ''
  return `\n\nThe user wants to write a LinkedIn commentary post about this article:\nTitle: ${article.headline}\nSource: ${article.source || 'Unknown'}\nSummary: ${article.snippet}\n\nWrite a post where the author shares their expert perspective and professional opinion on this news. The post should:\n- Reference the article/news briefly in the opening\n- Pivot quickly to the author's own insight, experience or opinion\n- Add value beyond just summarizing the news\n- End with a question to drive engagement\n- Sound like a genuine expert reaction, not a news summary`
}

export default function CreatePost({ editingDraft, onClearDraft, prefilledArticle, onClearPrefilledArticle }) {
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
  const [article, setArticle] = useState(null)

  useEffect(() => {
    if (prefilledArticle) {
      setArticle(prefilledArticle)
      setTopic('custom')
      setCustomTopic(prefilledArticle.headline || '')
      // If the article came with full context (snippet/source), pre-select Commentary
      if (prefilledArticle.snippet) {
        setStyle('commentary')
      }
      setStep(0)
      onClearPrefilledArticle?.()
    }
  }, [prefilledArticle])

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
    setArticle(null)
    onClearDraft()
  }

  const activeTopic = topic === 'custom' ? customTopic : topic

  const isCommentary = style === 'commentary' && article?.snippet
  const articleCtx = isCommentary ? buildArticleContext(article) : ''

  async function generateHooks() {
    setLoading(true)
    setError('')
    const profile = getProfile()
    const brief = profile.name ? `\n\n${buildAuthorBrief(profile)}` : ''
    try {
      const userPrompt = isCommentary
        ? `Generate 4 compelling LinkedIn post hooks/opening lines for a commentary post reacting to the news article below. Each hook should briefly reference the news then pivot to the author's perspective. Each hook is 1-2 sentences, attention-grabbing, and authentically in the author's voice.${articleCtx}${brief}\n\nReturn ONLY a JSON array of 4 strings, no other text.`
        : `Generate 4 compelling LinkedIn post hooks/opening lines about "${activeTopic}" in a ${style} style. Each hook should be 1-2 sentences that grab attention and feel authentically written by this author — not generic.${brief}\n\nReturn ONLY a JSON array of 4 strings, no other text.`

      const result = await callClaude(userPrompt, HOOK_SYSTEM)
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
    const brief = profile.name ? `\n\n${buildAuthorBrief(profile)}` : ''
    try {
      const userPrompt = isCommentary
        ? `Write a LinkedIn commentary post reacting to the news article below. Start with this hook: "${selectedHook}"${articleCtx}${brief}\n\nRequirements:\n- 150-250 words, optimized for LinkedIn\n- Reference the article briefly in the opening, then pivot to the author's insight/experience\n- Add genuine expert value beyond summarizing the news\n- Use line breaks for readability\n- End with a thought-provoking question\n- Do NOT include hashtags\n- Must sound like the author wrote it, not a ghostwriter`
        : `Write a LinkedIn post about "${activeTopic}" in a ${style} style. Start with this hook: "${selectedHook}"${brief}\n\nRequirements:\n- 150-250 words, optimized for LinkedIn\n- Use line breaks for readability\n- Reference the author's real experience and accomplishments where relevant\n- End with a thought-provoking question or call to action\n- Do NOT include hashtags\n- Must sound like the author wrote it, not a ghostwriter`

      const result = await callClaude(userPrompt, POST_SYSTEM)
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
    (step === 0 && ((article?.snippet) || (topic && (topic !== 'custom' || customTopic.trim())))) ||
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
          {article?.snippet ? (
            <>
              <h3>Commenting on:</h3>
              <p className="step-desc">You'll share your expert perspective on this news story.</p>
              <ArticlePreviewCard article={article} />
              <div className="article-actions">
                <button
                  className="btn-text"
                  onClick={() => { setArticle(null); setTopic(''); setCustomTopic(''); setStyle('') }}
                >
                  Choose a different topic instead
                </button>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="step-content">
          <h3>Choose a writing style</h3>
          <p className="step-desc">How should your post feel?</p>
          <div className="style-grid">
            {STYLES
              .filter((s) => s.id !== 'commentary' || article?.snippet)
              .map((s) => (
                <button
                  key={s.id}
                  className={`style-card ${style === s.id ? 'selected' : ''}`}
                  onClick={() => setStyle(s.id)}
                >
                  <span className="style-emoji">{s.emoji}</span>
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
          {isCommentary && <ArticlePreviewCard article={article} />}
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
          {isCommentary && <ArticlePreviewCard article={article} />}
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
