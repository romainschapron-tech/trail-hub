import { createFileRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'

export const Route = createFileRoute('/races')({
  component: RacesLayout,
})

function RacesLayout() {
  const { location } = useRouterState()

  const views = [
    { to: '/races', label: 'Liste', exact: true },
    { to: '/races/calendar', label: 'Calendrier' },
    { to: '/races/map', label: 'Carte' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Courses</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="view-switcher">
            {views.map((v) => {
              const isActive = v.exact
                ? location.pathname === v.to
                : location.pathname.startsWith(v.to)
              return (
                <Link key={v.to} to={v.to} className={`view-btn ${isActive ? 'active' : ''}`}>
                  {v.label}
                </Link>
              )
            })}
          </div>
          <Link to="/races/new" className="btn btn-primary">
            + Ajouter
          </Link>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
