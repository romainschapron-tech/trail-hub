import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
  component: () => (
    <div>
      <div className="page-header">
        <h1 className="page-title">Parametres</h1>
      </div>
      <div className="card">
        <div className="empty-state">
          <h3>Parametres</h3>
          <p>Configuration scraping, rappels email - Phase 5</p>
        </div>
      </div>
    </div>
  ),
})
