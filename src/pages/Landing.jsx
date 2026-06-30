import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Zap, FileText, Search, TrendingUp, PenLine,
  Briefcase, Lightbulb, Users, Award, Target,
  Check, ArrowRight, Star,
} from 'lucide-react'
import './Landing.css'

const FEATURES = [
  { icon: Sparkles, title: 'AI Post Generator', desc: 'Full LinkedIn posts in your voice from a single topic.' },
  { icon: Zap, title: 'Hook Generator', desc: '4 scroll-stopping opening lines, powered by AI.' },
  { icon: FileText, title: 'LinkedIn Profile Import', desc: 'Upload your PDF so the AI writes like you.' },
  { icon: Search, title: 'Live Research', desc: 'Commentary posts built on real trending articles.' },
  { icon: TrendingUp, title: 'Trending Topics', desc: 'Curated news feed across 4 industry categories.' },
  { icon: PenLine, title: 'AI Editor', desc: 'Refine your post with natural-language instructions.' },
]

const SOLUTIONS = [
  { icon: Briefcase, title: 'Executives & C-Suite', desc: 'Share strategic insights without spending hours writing.' },
  { icon: Lightbulb, title: 'Founders', desc: 'Build in public and attract investors, hires, and customers.' },
  { icon: Users, title: 'Consultants', desc: 'Establish authority in your niche and generate inbound leads.' },
  { icon: Award, title: 'Thought Leaders', desc: 'Publish consistently and grow your professional audience.' },
  { icon: Target, title: 'Job Seekers', desc: 'Stand out to recruiters with a strong LinkedIn presence.' },
]

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'VP of Marketing', text: "Podium cut my LinkedIn content time from 2 hours to 10 minutes. The posts actually sound like me.", avatar: 'S' },
  { name: 'James K.', role: 'Startup Founder', text: "I went from posting once a month to 3x a week. My engagement is up 400% and I'm getting inbound leads.", avatar: 'J' },
  { name: 'Priya R.', role: 'Management Consultant', text: "The commentary feature is brilliant. I react to industry news and it positions me as an expert effortlessly.", avatar: 'P' },
]

const FREE_FEATURES = [
  '5 posts per month',
  'Popular topic suggestions',
  'Basic writing styles',
  'Copy to clipboard',
  'Draft saving',
]

const PRO_FEATURES = [
  'Unlimited posts',
  'LinkedIn PDF import',
  'Personalised topic suggestions',
  'Voice samples matching',
  'Full draft library',
  'AI editor refinements',
  'Commentary on trending news',
  'No watermark',
  'Priority support',
]

export default function Landing() {
  const navigate = useNavigate()
  const go = () => navigate('/app')

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-nav-brand">
            <div className="lp-logo">P</div>
            <span className="lp-wordmark">Podium</span>
            <span className="lp-by">by Zenlyr Labs</span>
          </div>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#solutions">Solutions</a>
            <a href="#pricing">Pricing</a>
            <span className="lp-nav-soon">Blog</span>
          </div>
          <div className="lp-nav-actions">
            <button className="lp-btn-outline" onClick={go}>Login</button>
            <button className="lp-btn-gold" onClick={go}>Start Free</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">AI-Powered LinkedIn Content</div>
          <h1 className="lp-hero-h1">
            Write LinkedIn posts that<br />sound like <em>you</em> — in minutes
          </h1>
          <p className="lp-hero-sub">
            AI-powered content creation that learns your voice, your expertise,
            and your audience. Built for professionals who have something to say.
          </p>
          <div className="lp-hero-ctas">
            <button className="lp-btn-gold lp-btn-lg" onClick={go}>
              Start Free <ArrowRight size={18} />
            </button>
            <a href="#features" className="lp-btn-outline lp-btn-lg">See How It Works</a>
          </div>
          <div className="lp-hero-preview">
            <div className="lp-preview-bar">
              <span className="lp-dot" /><span className="lp-dot" /><span className="lp-dot" />
              <span className="lp-preview-url">getpodium.netlify.app</span>
            </div>
            <div className="lp-preview-body">
              <div className="lp-preview-nav">
                {['Home', 'Guide', 'Create Post', 'Drafts', 'My Profile'].map((t) => (
                  <span key={t} className="lp-preview-tab">{t}</span>
                ))}
              </div>
              <div className="lp-preview-grid">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="lp-preview-card">
                    <div className="lp-preview-img" />
                    <div className="lp-preview-lines">
                      <div className="lp-preview-line w80" />
                      <div className="lp-preview-line w60" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-label">Features</div>
          <h2 className="lp-section-h2">Everything you need to own LinkedIn</h2>
          <p className="lp-section-sub">From topic discovery to polished posts — the complete toolkit.</p>
          <div className="lp-features-grid">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="lp-feature-card">
                <div className="lp-feature-icon"><Icon size={22} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="lp-section lp-section-alt" id="solutions">
        <div className="lp-section-inner">
          <div className="lp-section-label">Solutions</div>
          <h2 className="lp-section-h2">Built for professionals who lead</h2>
          <p className="lp-section-sub">Podium adapts to your role, audience, and expertise.</p>
          <div className="lp-solutions-grid">
            {SOLUTIONS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="lp-solution-card">
                <Icon size={24} className="lp-solution-icon" />
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-label">What People Say</div>
          <h2 className="lp-section-h2">Trusted by professionals</h2>
          <div className="lp-stats-row">
            <div className="lp-stat"><span>5</span> Writing Styles</div>
            <div className="lp-stat"><span>4</span> Hooks per Post</div>
            <div className="lp-stat"><span>100%</span> LinkedIn-Optimised</div>
          </div>
          <div className="lp-testimonials">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="lp-testimonial">
                <div className="lp-testimonial-stars">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} fill="currentColor" />)}
                </div>
                <p>{t.text}</p>
                <div className="lp-testimonial-author">
                  <div className="lp-avatar">{t.avatar}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="lp-section lp-section-alt" id="pricing">
        <div className="lp-section-inner">
          <div className="lp-section-label">Pricing</div>
          <h2 className="lp-section-h2">Start free, upgrade when you're ready</h2>
          <div className="lp-pricing-grid">
            <div className="lp-price-card">
              <h3>Free</h3>
              <div className="lp-price">$0<span>/month</span></div>
              <p className="lp-price-desc">Get started with AI-powered LinkedIn posts.</p>
              <ul>
                {FREE_FEATURES.map((f) => (
                  <li key={f}><Check size={15} /> {f}</li>
                ))}
              </ul>
              <button className="lp-btn-outline lp-btn-block" onClick={go}>Start Free</button>
            </div>
            <div className="lp-price-card lp-price-pro">
              <div className="lp-price-badge">Most Popular</div>
              <h3>Pro</h3>
              <div className="lp-price">$9<span>/month</span></div>
              <p className="lp-price-sub">or $79/year (save 27%)</p>
              <p className="lp-price-desc">Full personalisation with your voice and expertise.</p>
              <ul>
                {PRO_FEATURES.map((f) => (
                  <li key={f}><Check size={15} /> {f}</li>
                ))}
              </ul>
              <button className="lp-btn-gold lp-btn-block" onClick={go}>Upgrade to Pro</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo">P</div>
            <span className="lp-wordmark">Podium</span>
            <span className="lp-by">by Zenlyr Labs</span>
          </div>
          <div className="lp-footer-links">
            <a href="#features">Features</a>
            <a href="#solutions">Solutions</a>
            <a href="#pricing">Pricing</a>
            <a href="/app">Guide</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
          <div className="lp-footer-bottom">
            <span>Powered by Claude AI</span>
            <span>&copy; {new Date().getFullYear()} Zenlyr Labs</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
