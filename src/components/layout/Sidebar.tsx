import { Link, useRouterState } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { Logo } from './Logo'
import {
  IconDashboard,
  IconRaces,
  IconStats,
  IconTraining,
  IconRoute,
  IconNutrition,
  IconAdd,
  IconSettings,
} from './Icons'

const NAV_ITEMS: { to: string; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
  { to: '/races', label: 'Courses', Icon: IconRaces },
  { to: '/stats', label: 'Stats', Icon: IconStats },
  { to: '/training', label: 'Entraînement', Icon: IconTraining },
  { to: '/planner', label: 'Préparer', Icon: IconRoute },
  { to: '/nutrition', label: 'Nutrition', Icon: IconNutrition },
  { to: '/races/new', label: 'Ajouter', Icon: IconAdd },
  { to: '/settings', label: 'Paramètres', Icon: IconSettings },
]

export function Sidebar() {
  const { location } = useRouterState()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo"><Logo /></div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const isActive =
            to === '/races'
              ? location.pathname.startsWith('/races') && location.pathname !== '/races/new'
              : location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <Link key={to} to={to} className={`nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><Icon size={19} /></span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
