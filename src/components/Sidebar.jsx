import { Home, PenLine, FileText, BookOpen, User, Sun, Moon } from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'guide', label: 'Guide', icon: BookOpen },
  { id: 'create', label: 'Create Post', icon: PenLine },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'profile', label: 'My Profile', icon: User },
]

export default function Sidebar({ active, onNavigate, theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-brand">
          <div className="topbar-logo">P</div>
          <div className="topbar-title">Podium</div>
          <span className="topbar-subtitle">by Zenlyr Labs</span>
        </div>

        <div className="topbar-right">
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

          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}
