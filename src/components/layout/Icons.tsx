// Monoline icons (lucide-style) matching the linear Stride logo.
// They inherit color from the parent (currentColor) and size via the `size` prop.

type IconProps = { size?: number }

function Svg({ size = 20, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconDashboard(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 9.5 L12 3 l9 6.5" />
      <path d="M5 9 V20 H19 V9" />
    </Svg>
  )
}

export function IconRaces(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 21 V4" />
      <path d="M5 4 h11 l-1.6 4 1.6 4 H5" />
    </Svg>
  )
}

export function IconStats(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 20 h18" />
      <path d="M6 20 V11" />
      <path d="M12 20 V4" />
      <path d="M18 20 V14" />
    </Svg>
  )
}

export function IconTraining(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 12 h4 l3 8 4-16 3 8 h4" />
    </Svg>
  )
}

export function IconAdd(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8 v8 M8 12 h8" />
    </Svg>
  )
}

export function IconCatalog(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 6 h13 M8 12 h13 M8 18 h13" />
      <path d="M3 6 h.01 M3 12 h.01 M3 18 h.01" />
    </Svg>
  )
}

export function IconBookmark(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 3 h12 v18 l-6-4 -6 4 Z" />
    </Svg>
  )
}

export function IconCalendar(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10 h18 M8 3 v4 M16 3 v4" />
    </Svg>
  )
}

export function IconAlarm(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9 v4 l3 2 M5 3 L2 6 M19 3 l3 3" />
    </Svg>
  )
}

export function IconNutrition(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3 C12 3 6.5 9.5 6.5 14 a5.5 5.5 0 0 0 11 0 C17.5 9.5 12 3 12 3 Z" />
      <path d="M9.5 14.5 a2.5 2.5 0 0 0 2.5 2.5" />
    </Svg>
  )
}

export function IconRoute(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="6" cy="19" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <path d="M8.4 19 H14 a4 4 0 0 0 4-4 V8.4" />
    </Svg>
  )
}

export function IconSettings(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 7 h6 M13 7 h8" />
      <circle cx="11" cy="7" r="2.2" />
      <path d="M3 12 h10 M17 12 h4" />
      <circle cx="15" cy="12" r="2.2" />
      <path d="M3 17 h3 M10 17 h11" />
      <circle cx="8" cy="17" r="2.2" />
    </Svg>
  )
}
