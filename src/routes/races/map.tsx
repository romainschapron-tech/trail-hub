import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/races/map')({
  component: () => (
    <div className="card">
      <div className="empty-state">
        <h3>Vue carte</h3>
        <p>Phase 3 - a venir</p>
      </div>
    </div>
  ),
})
