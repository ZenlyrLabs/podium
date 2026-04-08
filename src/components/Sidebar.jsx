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
          <div className="topbar-logo">P</div>
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
