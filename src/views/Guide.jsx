import { useState } from 'react'
import { UserCog, Compass, Palette, Sparkles, Send, ChevronDown } from 'lucide-react'
import './Guide.css'

const STEPS = [
  {
    icon: UserCog,
    title: 'Set Up Your Profile',
    body: 'Go to My Profile and fill in your details or upload your LinkedIn PDF. The more context you give, the more personalised your posts will sound.',
  },
  {
    icon: Compass,
    title: 'Find Your Topic',
    body: "Browse trending topics on the Home page and click 'Write Post About This', or go to Create Post and enter your own topic idea.",
  },
  {
    icon: Palette,
    title: 'Pick Your Style',
    body: 'Choose from 5 writing styles — Thought Leader, Storyteller, Data-Driven, Contrarian, or Educator. Each produces a distinctly different post.',
  },
  {
    icon: Sparkles,
    title: 'Choose Your Hook',
    body: 'Pick from 4 AI-generated opening lines designed to stop scrolling. The hook is the most important part of any LinkedIn post.',
  },
  {
    icon: Send,
    title: 'Polish and Post',
    body: "Edit your post manually or use the AI Editor with instructions like 'make it shorter' or 'add a statistic'. Then copy and paste to LinkedIn.",
  },
]

const FAQS = [
  {
    q: 'Why do I need to fill in My Profile?',
    a: 'Your profile is what makes posts sound like you. Without it, posts sound generic. The more detail you add — especially your LinkedIn PDF — the better the output.',
  },
  {
    q: 'How is Podium different from ChatGPT?',
    a: 'ChatGPT is a general AI. Podium is purpose-built for LinkedIn — it knows what hooks work, what writing styles perform, and it uses your professional background to write in your voice.',
  },
  {
    q: 'Are my drafts saved automatically?',
    a: 'You need to click Save Draft manually. Drafts are stored in your browser — if you clear your browser cache they will be lost. We recommend saving important posts.',
  },
  {
    q: 'How often does the trending feed update?',
    a: 'The home page fetches fresh topics every 2 hours. Click Refresh to get the latest articles immediately.',
  },
  {
    q: 'Can I post directly to LinkedIn from Podium?',
    a: 'Not yet — direct LinkedIn posting requires LinkedIn API approval which we are working on. For now copy your post and paste it directly into LinkedIn.',
  },
  {
    q: 'Is Podium free?',
    a: 'Yes — Podium is currently free to use as we are in beta. We appreciate your feedback to help us improve.',
  },
]

function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-question" onClick={onToggle}>
        <span>{faq.q}</span>
        <ChevronDown size={18} className="faq-chevron" />
      </button>
      <div className="faq-answer-wrap">
        <div className="faq-answer">{faq.a}</div>
      </div>
    </div>
  )
}

export default function Guide() {
  const [openIndex, setOpenIndex] = useState(0)

  function toggle(i) {
    setOpenIndex(openIndex === i ? -1 : i)
  }

  return (
    <div className="guide-view">
      <div className="view-header">
        <h2>Guide</h2>
      </div>
      <p className="guide-desc">
        Everything you need to know to write LinkedIn posts that sound authentically like you.
      </p>

      <section className="guide-section">
        <div className="section-header">
          <h3 className="section-title">How It Works</h3>
          <div className="section-divider" />
        </div>

        <div className="steps-list">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="step-item">
                <div className="step-number">{i + 1}</div>
                <div className="step-content">
                  <div className="step-title-row">
                    <Icon size={16} className="step-icon" />
                    <h4 className="step-title">{step.title}</h4>
                  </div>
                  <p className="step-body">{step.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="guide-section">
        <div className="section-header">
          <h3 className="section-title">Frequently Asked Questions</h3>
          <div className="section-divider" />
        </div>

        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
