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
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">P</div>
        <div>
          <h1 className="sidebar-title">Podium</h1>
          <span className="sidebar-subtitle">by Zenlyr Labs</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${active === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>Powered by Claude AI</span>
      </div>
    </aside>
  )
}
