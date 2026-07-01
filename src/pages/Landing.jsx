import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

const DRAFTS = {
  thought: {
    hook: "Onboarding isn't paperwork. It's the first product experience.",
    body: "The teams I admire treat a new hire's first week the way they treat a customer's first session: every friction point is a signal, every unanswered question a bug. Get it right and someone decides to stay before they've done any real work. Get it wrong and you spend six months earning back trust you lost on day one."
  },
  story: {
    hook: "My first day, nobody had set up my laptop. I almost left.",
    body: "I sat in a meeting room for three hours with a broken login and a welcome email that hadn't been sent. It's a small thing — except it told me exactly how much thought the company put into people once the offer was signed. The best onboarding I've had since felt like the opposite: someone had clearly imagined my first hour, and built for it."
  },
  contra: {
    hook: "Your onboarding checklist is why new hires quit in 90 days.",
    body: "Everyone's proud of their 40-item checklist. Nobody asks whether checking boxes is the same as making someone feel capable and wanted. It isn't. A checklist optimises for the company's paperwork; a real onboarding optimises for the moment a new person thinks 'I can do this, and I'm glad I came.' Those are not the same project, and most teams only build the first one."
  }
}

const STYLES = [
  { key: 'thought', label: 'Thought Leader' },
  { key: 'story', label: 'Storyteller' },
  { key: 'contra', label: 'Contrarian' }
]

const STEPS = [
  { n: '01', t: 'Topic', d: 'Start from a thought, or react to a trending article from your field.' },
  { n: '02', t: 'Style', d: 'Five voices, from Thought Leader to Contrarian. The register sets the tone.' },
  { n: '03', t: 'Hook', d: 'Four opening lines, generated for the topic. Pick the one that earns the scroll-stop.' },
  { n: '04', t: 'Review', d: 'The full post, drafted in your voice — not a generic template.' },
  { n: '05', t: 'Editor', d: 'Tighten it. Shorter, bolder, warmer — one tap each. Then copy and post.' }
]

const CAPS = [
  { i: '01', h: 'Learns from your writing', d: 'Paste a few past posts and Podium mirrors your rhythm and phrasing. Upload your LinkedIn export and it reads your whole profile for context.' },
  { i: '02', h: 'Hooks that earn the click', d: 'The first line decides whether anyone reads the rest. Podium generates four openers per session so you choose, rather than settle.' },
  { i: '03', h: "React to what's happening", d: "A curated feed across leadership, AI, startups, and operations. Click any article to write your take on it while it's still current." },
  { i: '04', h: 'Edit like a writer, not a prompter', d: '"Make it shorter." "More confident." One-tap edits that reshape the draft without you rewriting the prompt each time.' }
]

function Composer() {
  const [active, setActive] = useState('thought')
  const [typedHook, setTypedHook] = useState('')
  const [showBody, setShowBody] = useState(false)
  const [fade, setFade] = useState(false)
  const typeRef = useRef(null)

  const wordCount = (v) => {
    const t = DRAFTS[v].hook + ' ' + DRAFTS[v].body
    return t.trim().split(/\s+/).length
  }

  useEffect(() => {
    const full = DRAFTS.thought.hook
    let i = 0
    typeRef.current = setInterval(() => {
      i++
      setTypedHook(full.slice(0, i))
      if (i >= full.length) {
        clearInterval(typeRef.current)
        setTimeout(() => setShowBody(true), 320)
      }
    }, 26)
    return () => clearInterval(typeRef.current)
  }, [])

  const pick = (v) => {
    if (v === active) return
    setFade(true)
    setTimeout(() => {
      setActive(v)
      setTypedHook(DRAFTS[v].hook)
      setShowBody(true)
      setFade(false)
    }, 250)
  }

  return (
    <div className="lp-composer" aria-label="Live post composer preview">
      <div className="lp-composer-top">
        <span className="lp-tl"><i></i><i></i><i></i></span>
        podium · new draft
      </div>
      <div className="lp-composer-body">
        <div className="lp-field-label">Topic</div>
        <div className="lp-topic-box">Most teams treat onboarding as paperwork. The best treat it as the first product experience.</div>

        <div className="lp-field-label">Voice</div>
        <div className="lp-style-row">
          {STYLES.map(s => (
            <span
              key={s.key}
              className={'lp-chip' + (active === s.key ? ' active' : '')}
              onClick={() => pick(s.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(s.key) } }}
            >{s.label}</span>
          ))}
        </div>

        <div className="lp-field-label">Draft</div>
        <div className={'lp-draft' + (fade ? ' fade' : '')}>
          <span className="lp-hook">
            {typedHook}{!showBody && <span className="lp-caret" />}
          </span>
          {showBody && DRAFTS[active].body}
        </div>
      </div>
      <div className="lp-composer-bottom">
        <span>{showBody ? wordCount(active) + ' words' : '— words'}</span>
        <span>hook · 1 of 4</span>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const go = () => navigate('/app')

  return (
    <div className="lp">
      <nav className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <a href="#" className="lp-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <svg className="lp-mark" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="18" width="24" height="9" rx="1" fill="#2f5d50" />
              <rect x="8" y="11" width="16" height="9" rx="1" fill="#c4522f" />
              <rect x="12" y="4" width="8" height="9" rx="1" fill="#1a1815" />
            </svg>
            Podium
          </a>
          <div className="lp-nav-links">
            <a href="#how">How it works</a>
            <a href="#craft">The craft</a>
            <a href="#pricing">Pricing</a>
            <button className="lp-nav-cta" onClick={go}>Start writing</button>
          </div>
        </div>
      </nav>

      <header className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            <div className="lp-eyebrow">A quieter place to write for LinkedIn</div>
            <h1 className="lp-hero-h">Write the post<br />before the <em>noise.</em></h1>
            <p className="lp-hero-sub">The feed is loud. Your draft doesn't have to be. Podium is the composing room where one idea becomes your voice — a hook, a style, a finished post.</p>
            <div className="lp-hero-actions">
              <button className="lp-btn-primary" onClick={go}>Start writing free <span aria-hidden="true">→</span></button>
              <a href="#how" className="lp-btn-text">See how it works</a>
            </div>
            <div className="lp-hero-meta">
              <span><i className="lp-dot"></i>No login to try</span>
              <span><i className="lp-dot"></i>5 free posts a month</span>
              <span><i className="lp-dot"></i>Your voice, not a template</span>
            </div>
          </div>
          <Composer />
        </div>
      </header>

      <section className="lp-band" id="how">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <div className="lp-eyebrow">The path from blank to published</div>
            <h2 className="lp-sec">Five steps. <em>One voice.</em></h2>
            <p className="lp-sec-lede">Podium doesn't hand you a wall of AI text to fix. It walks the same path a good writer does — pick the idea, choose the register, open with a hook, shape it, ship it.</p>
          </div>
          <div className="lp-flow">
            {STEPS.map(s => (
              <div className="lp-step" key={s.n}>
                <div className="lp-step-n">{s.n}</div>
                <div className="lp-step-t">{s.t}</div>
                <div className="lp-step-d">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-band" id="craft">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <div className="lp-eyebrow">What makes it sound like you</div>
            <h2 className="lp-sec">Built to <em>protect the voice,</em><br />not replace it.</h2>
          </div>
          <div className="lp-caps">
            {CAPS.map(c => (
              <div className="lp-cap" key={c.i}>
                <div className="lp-cap-h"><span className="lp-idx">{c.i}</span>{c.h}</div>
                <div className="lp-cap-d">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-band" id="pricing">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <div className="lp-eyebrow">Free to start, fair to keep</div>
            <h2 className="lp-sec">Write a little, or <em>write a lot.</em></h2>
          </div>
          <div className="lp-price-grid">
            <div className="lp-plan">
              <div className="lp-plan-name">Free</div>
              <div className="lp-plan-price">$0<span> / forever</span></div>
              <div className="lp-plan-note">Enough to find your rhythm and see if the voice fits.</div>
              <ul>
                <li>5 posts a month</li>
                <li>All five writing styles</li>
                <li>Hook generator</li>
                <li>Trending article feed</li>
              </ul>
              <button className="lp-plan-cta" onClick={go}>Start free</button>
            </div>
            <div className="lp-plan pro">
              <div className="lp-founder-tag">Founding rate</div>
              <div className="lp-plan-name">Pro</div>
              <div className="lp-plan-price">$4.99<span> / mo</span></div>
              <div className="lp-plan-note">$4.99/mo for the first 100 members, then $9. Lock it in now.</div>
              <ul>
                <li>Unlimited posts</li>
                <li>LinkedIn profile import</li>
                <li>Voice samples &amp; personalisation</li>
                <li>Full drafts, no watermark</li>
              </ul>
              <button className="lp-plan-cta" onClick={go}>Become a founding member</button>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-closer">
        <div className="lp-wrap">
          <h2>Your next post is one <em>good idea</em> away.</h2>
          <button className="lp-btn-primary" onClick={go}>Open the composing room <span aria-hidden="true">→</span></button>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-foot-in">
          <div className="lp-brand" style={{ fontSize: '18px' }}>
            <svg className="lp-mark" viewBox="0 0 32 32" fill="none" style={{ width: '20px', height: '20px' }}>
              <rect x="4" y="18" width="24" height="9" rx="1" fill="#2f5d50" />
              <rect x="8" y="11" width="16" height="9" rx="1" fill="#c4522f" />
              <rect x="12" y="4" width="8" height="9" rx="1" fill="#1a1815" />
            </svg>
            Podium
          </div>
          <div className="lp-foot-links">
            <a href="https://zenlyr.com">A Zenlyr Labs product</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="mailto:hello@zenlyr.com">hello@zenlyr.com</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
