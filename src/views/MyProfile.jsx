import { useState, useEffect, useRef } from 'react'
import { Upload, Save, Check, Loader2 } from 'lucide-react'
import { getProfile, saveProfile } from '../utils/storage'
import { callClaude, callClaudeWithPdf } from '../utils/api'
import { calculateProfileCompleteness } from '../utils/profileCompleteness'
import './MyProfile.css'

const EXTRACT_PROMPT = `Analyze this LinkedIn profile thoroughly and return a JSON object with these keys:

- "name": full name
- "headline": current job title and company
- "industry": the primary industry they work in (e.g. "SaaS / B2B Software", "Healthcare", "Fintech")
- "summary": a 3-4 sentence career narrative covering their arc, what drives them, and what they're known for
- "accomplishments": an array of 3-5 specific career achievements — include hard metrics, numbers, percentages, team sizes, revenue figures, or growth stats wherever possible (e.g. "Scaled engineering org from 5 to 40 engineers in 18 months")
- "expertise": an array of 4-8 core skill/domain areas they are strongest in
- "targetAudience": who this person likely writes for on LinkedIn (e.g. "CTOs and engineering leaders at growth-stage startups")
- "communicationStyle": a comma-separated string of 3-5 tone descriptors that characterize how this person likely communicates based on their profile (e.g. "direct, data-oriented, uses storytelling, dry humor, concise")
- "signaturePhrases": an array of 2-4 recurring phrases, terminology, or language patterns found in the profile text
- "topics": a comma-separated string of topics they likely post about based on their experience

Be specific, not generic. Pull real details from the profile. If a field cannot be determined, use an empty string or empty array.`

const EXTRACT_SYSTEM = 'You are an expert profile analyst. Return valid JSON only, no other text or markdown.'

export default function MyProfile() {
  const [profile, setProfile] = useState({
    name: '',
    headline: '',
    industry: '',
    summary: '',
    accomplishments: '',
    expertise: '',
    targetAudience: '',
    communicationStyle: '',
    topics: '',
    voiceSamples: '',
    pdfUploaded: false,
  })
  const [saved, setSaved] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    const stored = getProfile()
    if (stored.name) setProfile((prev) => ({ ...prev, ...stored }))
  }, [])

  function handleChange(field, value) {
    setProfile((p) => ({ ...p, [field]: value }))
  }

  function handleSave() {
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function formatArrayField(val) {
    if (Array.isArray(val)) return val.join('\n')
    if (typeof val === 'string') return val
    return ''
  }

  async function handlePdfUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setParsing(true)
    setParseError('')

    try {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')

      let result
      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        result = await callClaudeWithPdf(base64, EXTRACT_PROMPT, EXTRACT_SYSTEM)
      } else {
        const text = await file.text()
        result = await callClaude(
          `${EXTRACT_PROMPT}\n\nProfile text:\n${text.slice(0, 6000)}`,
          EXTRACT_SYSTEM
        )
      }

      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)

      setProfile((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        headline: parsed.headline || prev.headline,
        industry: parsed.industry || prev.industry,
        summary: parsed.summary || prev.summary,
        accomplishments: formatArrayField(parsed.accomplishments) || prev.accomplishments,
        expertise: formatArrayField(parsed.expertise) || prev.expertise,
        targetAudience: parsed.targetAudience || prev.targetAudience,
        communicationStyle: parsed.communicationStyle || prev.communicationStyle,
        topics: parsed.topics || prev.topics,
        pdfUploaded: true,
      }))
      // Auto-save so pdfUploaded flag persists even if user navigates away without saving
      const merged = {
        ...profile,
        name: parsed.name || profile.name,
        headline: parsed.headline || profile.headline,
        industry: parsed.industry || profile.industry,
        summary: parsed.summary || profile.summary,
        accomplishments: formatArrayField(parsed.accomplishments) || profile.accomplishments,
        expertise: formatArrayField(parsed.expertise) || profile.expertise,
        targetAudience: parsed.targetAudience || profile.targetAudience,
        communicationStyle: parsed.communicationStyle || profile.communicationStyle,
        topics: parsed.topics || profile.topics,
        pdfUploaded: true,
      }
      saveProfile(merged)
    } catch (err) {
      console.error('Profile parse error:', err)
      const detail = err.message || String(err)
      setParseError(`Could not parse the file: ${detail}`)
    }
    setParsing(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const completeness = calculateProfileCompleteness(profile)

  return (
    <div className="profile-view">
      <div className="view-header">
        <h2>My Profile</h2>
      </div>

      <p className="profile-desc">
        Your profile helps the AI write posts that sound like <strong>you</strong>, not a generic thought leader. Upload your LinkedIn PDF and paste a few of your own posts for best results.
      </p>

      <div className="completeness-card">
        <div className="completeness-header">
          <span className="completeness-label">Profile Completeness</span>
          <span className="completeness-value">{completeness}%</span>
        </div>
        <div className="completeness-bar">
          <div
            className="completeness-fill"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 100 && (
          <p className="completeness-hint">
            {completeness < 50
              ? "Posts will be generic. Upload your LinkedIn PDF for the biggest jump."
              : completeness < 70
              ? "Almost there. Add a few more details for personalised posts."
              : "Looking good. Fill in the last fields for maximum personalisation."}
          </p>
        )}
      </div>

      <div className="upload-area" onClick={() => fileRef.current?.click()}>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt"
          hidden
          onChange={handlePdfUpload}
        />
        {parsing ? (
          <>
            <Loader2 className="spinner" size={28} />
            <span>Analyzing your profile...</span>
          </>
        ) : (
          <>
            <Upload size={28} />
            <span>Upload LinkedIn PDF / Text file</span>
            <span className="upload-hint">Extracts your accomplishments, expertise, and communication style</span>
          </>
        )}
      </div>

      {parseError && <div className="error-banner">{parseError}</div>}

      <div className="profile-form">
        <div className="form-group">
          <label>Name</label>
          <input
            className="text-input"
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label>Headline</label>
          <input
            className="text-input"
            value={profile.headline}
            onChange={(e) => handleChange('headline', e.target.value)}
            placeholder="e.g. VP of Engineering at Acme Corp"
          />
        </div>

        <div className="form-group">
          <label>Industry</label>
          <input
            className="text-input"
            value={profile.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
            placeholder="e.g. SaaS / B2B Software, Healthcare, Fintech"
          />
        </div>

        <div className="form-group">
          <label>Career Summary</label>
          <textarea
            className="text-input"
            value={profile.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            rows={4}
            placeholder="Your career arc, what drives you, what you're known for..."
          />
        </div>

        <div className="form-group">
          <label>Key Accomplishments</label>
          <textarea
            className="text-input"
            value={profile.accomplishments}
            onChange={(e) => handleChange('accomplishments', e.target.value)}
            rows={4}
            placeholder={"Scaled engineering team from 5 to 40 in 18 months\nLaunched product used by 2M+ users\nReduced deploy time by 70%"}
          />
          <span className="form-hint">One per line. Include specific metrics and numbers.</span>
        </div>

        <div className="form-group">
          <label>Communication Style</label>
          <input
            className="text-input"
            value={profile.communicationStyle}
            onChange={(e) => handleChange('communicationStyle', e.target.value)}
            placeholder="e.g. direct, uses storytelling, data-oriented, dry humor"
          />
          <span className="form-hint">How would you describe your writing tone?</span>
        </div>

        <div className="form-group">
          <label>Target Audience</label>
          <input
            className="text-input"
            value={profile.targetAudience}
            onChange={(e) => handleChange('targetAudience', e.target.value)}
            placeholder="e.g. CTOs and engineering leaders at growth-stage startups"
          />
          <span className="form-hint">Who do you write for on LinkedIn?</span>
        </div>

        <div className="form-group">
          <label>Topics You Post About</label>
          <input
            className="text-input"
            value={profile.topics}
            onChange={(e) => handleChange('topics', e.target.value)}
            placeholder="e.g. Leadership, AI, Product Management"
          />
        </div>

        <div className="form-divider" />

        <div className="form-group">
          <label>Voice Samples</label>
          <textarea
            className="text-input voice-samples"
            value={profile.voiceSamples}
            onChange={(e) => handleChange('voiceSamples', e.target.value)}
            rows={8}
            placeholder={"Paste 2-3 of your past LinkedIn posts here. This is the single most important field for matching your voice.\n\nExample:\n---\nI turned down a promotion last year. Here's why...\n(paste the full post)\n---\nEvery engineer I've hired in the last 5 years had one thing in common...\n(paste the full post)"}
          />
          <span className="form-hint">The AI will analyze your sentence structure, vocabulary, and tone to generate posts that sound authentically like you.</span>
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
