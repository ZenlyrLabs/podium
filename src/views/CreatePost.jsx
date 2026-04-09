import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Sparkles, Save, Copy, Check, Loader2, ExternalLink } from 'lucide-react'
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

function buildArticleBlock(article) {
  if (!article) return ''
  const parts = ['=== NEWS ARTICLE THE AUTHOR IS REACTING TO ===']
  if (article.headline) parts.push(`Title: ${article.headline}`)
  if (article.source) parts.push(`Source: ${article.source}`)
  if (article.publishedAt) parts.push(`Published: ${article.publishedAt}`)
  if (article.url) parts.push(`URL: ${article.url}`)
  if (article.snippet) parts.push(`Summary: ${article.snippet}`)
  parts.push('=== END ARTICLE ===')
  return parts.join('\n')
}

const BASE_HOOK_SYSTEM = `You are a LinkedIn ghostwriter who writes in the exact voice and style of the author described below. Study their voice samples carefully — match their sentence structure, vocabulary, rhythm, and personality. Hooks should feel like something this specific person would write, not a generic content creator. Return valid JSON only — an array of 4 strings.`

const BASE_POST_SYSTEM = `You are a LinkedIn ghostwriter who writes in the exact voice and style of the author described below. Study their voice samples carefully — match their sentence structure, vocabulary, rhythm, and personality precisely. Draw on their real accomplishments and expertise to add specific, authentic details. Never sound generic, corporate, or like a template. Write the post content only — no explanations, preamble, or hashtags.`

const COMMENTARY_SYSTEM_ADDENDUM = `

IMPORTANT — COMMENTARY MODE:
The author is reacting to a specific news article. The full article details are included in the user message below. You MUST:
- Reference the specific article in the opening (mention the source or the actual news)
- Quickly pivot to the author's own insight, experience, or professional opinion
- Add genuine expert value beyond summarizing the news
- Use specific details from the article (title, source, facts from the summary)
- End with a thought-provoking question to drive engagement
- Sound like a genuine expert reaction — never a news summary or press release

Do NOT write a generic post. The article context is critical — use it.`

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

export default function CreatePost({ editingDraft, onClearDraft, activeArticle, onClearArticle }) {
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
  const [includeSourceLink, setIncludeSourceLink] = useState(true)
  // Source info preserved across drafts even if activeArticle was cleared
  const [draftSource, setDraftSource] = useState(null)

  // When an active article arrives (from Home), auto-configure the wizard.
  // Note: activeArticle is stored in App.jsx and persists across all steps.
  useEffect(() => {
    if (activeArticle) {
      console.log('[CreatePost] activeArticle received:', {
        headline: activeArticle.headline,
        source: activeArticle.source,
        hasSnippet: !!activeArticle.snippet,
      })
      setTopic('custom')
      setCustomTopic(activeArticle.headline || '')
      if (activeArticle.snippet && !style) {
        setStyle('commentary')
      }
      if (step > 0) setStep(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeArticle])

  useEffect(() => {
    if (editingDraft) {
      setPostContent(editingDraft.content || '')
      setTopic(editingDraft.topic || '')
      setStyle(editingDraft.style || '')
      if (editingDraft.source_url || editingDraft.source_headline) {
        setDraftSource({
          headline: editingDraft.source_headline || '',
          url: editingDraft.source_url || '',
        })
      }
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
    setDraftSource(null)
    onClearArticle?.()
    onClearDraft()
  }

  // Resolve the source to display in the editor — prefer live activeArticle,
  // fall back to draftSource (when reopening a saved draft)
  const displaySource = activeArticle?.url
    ? { headline: activeArticle.headline, url: activeArticle.url }
    : draftSource

  const activeTopic = topic === 'custom' ? customTopic : topic

  // Article context is used whenever activeArticle is present with a snippet,
  // regardless of whether the user explicitly chose Commentary style.
  const hasArticleContext = !!activeArticle?.snippet
  const isCommentary = style === 'commentary' || hasArticleContext

  async function generateHooks() {
    setLoading(true)
    setError('')
    const profile = getProfile()
    const brief = profile.name ? `\n\n${buildAuthorBrief(profile)}` : ''
    const articleBlock = hasArticleContext ? `\n\n${buildArticleBlock(activeArticle)}` : ''

    // Build system prompt — inject article context and commentary addendum when reacting to an article
    const systemPrompt = hasArticleContext
      ? `${BASE_HOOK_SYSTEM}${COMMENTARY_SYSTEM_ADDENDUM}${articleBlock}`
      : BASE_HOOK_SYSTEM

    const userPrompt = hasArticleContext
      ? `Generate 4 compelling LinkedIn post hooks/opening lines for a commentary post reacting to the news article above. Each hook should briefly reference the news (mention the article or source) then pivot to the author's perspective. Each hook is 1-2 sentences, attention-grabbing, and authentically in the author's voice.${brief}\n\nReturn ONLY a JSON array of 4 strings, no other text.`
      : `Generate 4 compelling LinkedIn post hooks/opening lines about "${activeTopic}" in a ${style} style. Each hook should be 1-2 sentences that grab attention and feel authentically written by this author — not generic.${brief}\n\nReturn ONLY a JSON array of 4 strings, no other text.`

    console.log('[CreatePost.generateHooks]', {
      hasArticleContext,
      style,
      isCommentary,
      activeTopic,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      articleHeadline: activeArticle?.headline,
    })

    try {
      const result = await callClaude(userPrompt, systemPrompt)
      const parsed = JSON.parse(stripMarkdownFences(result))
      setHooks(Array.isArray(parsed) ? parsed : [])
      setStep(3)
    } catch (e) {
      console.error('[CreatePost.generateHooks] error:', e)
      setError('Failed to generate hooks. Please check your API key and try again.')
    }
    setLoading(false)
  }

  async function generatePost() {
    setLoading(true)
    setError('')
    const profile = getProfile()
    const brief = profile.name ? `\n\n${buildAuthorBrief(profile)}` : ''
    const articleBlock = hasArticleContext ? `\n\n${buildArticleBlock(activeArticle)}` : ''

    const systemPrompt = hasArticleContext
      ? `${BASE_POST_SYSTEM}${COMMENTARY_SYSTEM_ADDENDUM}${articleBlock}`
      : BASE_POST_SYSTEM

    const userPrompt = hasArticleContext
      ? `Write a LinkedIn commentary post reacting to the news article shown in the system prompt above. Start with this hook: "${selectedHook}"${brief}\n\nRequirements:\n- 150-250 words, optimized for LinkedIn\n- Reference the article by name/source in the opening, then pivot to the author's insight\n- Use specific details from the article summary\n- Add genuine expert value beyond summarizing the news\n- Use line breaks for readability\n- End with a thought-provoking question\n- Do NOT include hashtags\n- Must sound like the author wrote it, not a ghostwriter`
      : `Write a LinkedIn post about "${activeTopic}" in a ${style} style. Start with this hook: "${selectedHook}"${brief}\n\nRequirements:\n- 150-250 words, optimized for LinkedIn\n- Use line breaks for readability\n- Reference the author's real experience and accomplishments where relevant\n- End with a thought-provoking question or call to action\n- Do NOT include hashtags\n- Must sound like the author wrote it, not a ghostwriter`

    console.log('[CreatePost.generatePost]', {
      hasArticleContext,
      style,
      isCommentary,
      selectedHook: selectedHook?.substring(0, 60),
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      articleHeadline: activeArticle?.headline,
      articleInSystemPrompt: systemPrompt.includes(activeArticle?.headline || '___NONE___'),
    })

    try {
      const result = await callClaude(userPrompt, systemPrompt)
      setPostContent(result.trim())
      setStep(4)
    } catch (e) {
      console.error('[CreatePost.generatePost] error:', e)
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
      source_url: displaySource?.url || null,
      source_headline: displaySource?.headline || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCopy() {
    let textToCopy = postContent
    if (includeSourceLink && displaySource?.url) {
      textToCopy += `\n\nSource: ${displaySource.headline}\n${displaySource.url}`
    }
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canNext =
    (step === 0 && (hasArticleContext || (topic && (topic !== 'custom' || customTopic.trim())))) ||
    (step === 1 && style) ||
    (step === 3 && selectedHook)

  // Trace render state on every render
  console.log('[CreatePost.render]', {
    step,
    style,
    hasActiveArticle: !!activeArticle,
    hasArticleContext,
    isCommentary,
    activeArticleHeadline: activeArticle?.headline,
  })

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
          {hasArticleContext ? (
            <>
              <h3>Commenting on:</h3>
              <p className="step-desc">You'll share your expert perspective on this news story.</p>
              <ArticlePreviewCard article={activeArticle} />
              <div className="article-actions">
                <button
                  className="btn-text"
                  onClick={() => {
                    onClearArticle?.()
                    setTopic('')
                    setCustomTopic('')
                    setStyle('')
                  }}
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
              .filter((s) => s.id !== 'commentary' || hasArticleContext)
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
          {hasArticleContext && <ArticlePreviewCard article={activeArticle} />}
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
          {hasArticleContext && <ArticlePreviewCard article={activeArticle} />}
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

              {displaySource?.url && (
                <div className="source-link-card">
                  <div className="source-link-info">
                    <span className="source-link-label">Source article</span>
                    <div className="source-link-headline">{displaySource.headline}</div>
                    <a
                      className="source-link-url"
                      href={displaySource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={12} />
                      {displaySource.url}
                    </a>
                  </div>
                  <label className="source-link-toggle">
                    <input
                      type="checkbox"
                      checked={includeSourceLink}
                      onChange={(e) => setIncludeSourceLink(e.target.checked)}
                    />
                    <span>Include link when copying</span>
                  </label>
                </div>
              )}

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
              console.log('[CreatePost] Next clicked — step:', step, 'hasArticle:', hasArticleContext)
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
