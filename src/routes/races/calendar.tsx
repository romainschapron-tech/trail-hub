import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/races/calendar')({
  component: () => (
    <div className="card">
      <div className="empty-state">
        <h3>Vue calendrier</h3>
        <p>Phase 3 - a venir</p>
      </div>
    </div>
  ),
})
