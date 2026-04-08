import { Home, PenLine, FileText, User } from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'create', label: 'Create Post', icon: PenLine },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'profile', label: 'My Profile', icon: User },
]

export default function Sidebar({ active, onNavigate }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-brand">
          <svg className="topbar-mark" viewBox="0 0 54 68" width="36" height="36">
            <rect x="18" y="14" width="36" height="54" rx="4" fill="none" stroke="#c8a84b" strokeWidth="3" opacity="0.22"/>
            <rect x="9" y="7" width="36" height="54" rx="4" fill="none" stroke="#c8a84b" strokeWidth="3.5" opacity="0.48"/>
            <rect x="0" y="0" width="36" height="54" rx="4" fill="#c8a84b"/>
            <line x1="9" y1="0" x2="9" y2="54" stroke="#0c0c18" strokeWidth="2" opacity="0.45" strokeLinecap="round"/>
            <line x1="18" y1="0" x2="18" y2="54" stroke="#0c0c18" strokeWidth="2" opacity="0.22" strokeLinecap="round"/>
            <polyline points="27,3 34,3 34,10" fill="none" stroke="#0c0c18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="topbar-title">Podium</div>
          <span className="topbar-subtitle">by Zenlyr Labs</span>
        </div>

        <nav className="topbar-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`topbar-item ${active === id ? 'active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
