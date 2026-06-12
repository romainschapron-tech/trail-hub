import { Link, useRouterState } from '@tanstack/react-router'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '\u2302' },
  { to: '/races', label: 'Courses', icon: '\u2691' },
  { to: '/stats', label: 'Stats', icon: '\u25f3' },
  { to: '/training', label: 'Entra\u00eenement', icon: '\u26a1' },
  { to: '/races/new', label: 'Ajouter', icon: '+' },
  { to: '/settings', label: 'Parametres', icon: '\u2699' },
]

export function Sidebar() {
  const { location } = useRouterState()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">TrailHub</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.to === '/races'
              ? location.pathname.startsWith('/races') && location.pathname !== '/races/new'
              : location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
