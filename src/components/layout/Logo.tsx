// Speed-trail mark for Stride — 3 oblique strokes suggesting forward motion.
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 24 L13 14" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
      <path d="M12.5 25.5 L20.5 11.5" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 26 L28 9" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Horizontal lockup: mark + wordmark, used in the sidebar header.
export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
      <LogoMark size={30} />
      <span style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
        Stride
      </span>
    </div>
  )
}
