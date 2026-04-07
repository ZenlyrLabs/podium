import { useState, useEffect, useRef } from 'react'
import { Upload, Save, Check, User, Loader2 } from 'lucide-react'
import { getProfile, saveProfile } from '../utils/storage'
import { callClaude, callClaudeWithPdf } from '../utils/api'
import './MyProfile.css'

export default function MyProfile() {
  const [profile, setProfile] = useState({ name: '', headline: '', summary: '', topics: '' })
  const [saved, setSaved] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    const stored = getProfile()
    if (stored.name) setProfile(stored)
  }, [])

  function handleChange(field, value) {
    setProfile((p) => ({ ...p, [field]: value }))
  }

  function handleSave() {
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
        result = await callClaudeWithPdf(
          base64,
          'Extract the following from this LinkedIn profile PDF and return as JSON with keys: name, headline, summary (a 2-3 sentence professional summary), topics (comma-separated list of topics they likely post about).',
          'You are a profile parser. Return valid JSON only, no other text.'
        )
      } else {
        const text = await file.text()
        result = await callClaude(
          `Extract the following from this LinkedIn profile text and return as JSON with keys: name, headline, summary (a 2-3 sentence professional summary), topics (comma-separated list of topics they likely post about).\n\nProfile text:\n${text.slice(0, 4000)}`,
          'You are a profile parser. Return valid JSON only, no other text.'
        )
      }

      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setProfile((prev) => ({
        name: parsed.name || prev.name,
        headline: parsed.headline || prev.headline,
        summary: parsed.summary || prev.summary,
        topics: parsed.topics || prev.topics,
      }))
    } catch (err) {
      console.error('Profile parse error:', err)
      const detail = err.message || String(err)
      setParseError(`Could not parse the file: ${detail}`)
    }
    setParsing(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="profile-view">
      <div className="view-header">
        <h2>My Profile</h2>
      </div>

      <p className="profile-desc">
        Your profile helps the AI write posts that sound like you. Upload your LinkedIn PDF or fill in details manually.
      </p>

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
            <span>Parsing your profile...</span>
          </>
        ) : (
          <>
            <Upload size={28} />
            <span>Upload LinkedIn PDF / Text file</span>
            <span className="upload-hint">Click to browse or drag and drop</span>
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
          <label>Professional Summary</label>
          <textarea
            className="text-input"
            value={profile.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            rows={4}
            placeholder="A short summary of your experience and expertise..."
          />
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

        <button className="btn-primary" onClick={handleSave}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
