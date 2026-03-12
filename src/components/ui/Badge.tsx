import { cn } from '@/lib/utils'
import type { StageKey, BucketKey } from '@/lib/constants'
import { STAGES, BUCKETS } from '@/lib/constants'

interface BadgeProps {
  children:    React.ReactNode
  className?:  string
  style?:      React.CSSProperties
}

export function Badge({ children, className, style }: BadgeProps) {
  return (
    <span
      className={cn('panel-label border border-current', className)}
      style={style}
    >
      {children}
    </span>
  )
}

export function StageBadge({ stage }: { stage: StageKey }) {
  const s = STAGES[stage]
  return (
    <Badge style={{ color: s.color, borderColor: s.color }}>
      {s.label}
    </Badge>
  )
}

export function BucketBadge({ bucket }: { bucket: BucketKey }) {
  const b = BUCKETS[bucket]
  return (
    <span
      className="panel-label"
      style={{
        backgroundColor: b.color,
        color:           b.textColor,
        border:          'none',
      }}
    >
      {b.label}
    </span>
  )
}

export function StaleBadge() {
  return (
    <Badge style={{ color: '#F59E0B', borderColor: '#F59E0B' }}>
      ⚠ STALE
    </Badge>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'admin'
  return (
    <Badge
      style={{
        color:       isAdmin ? '#2D2DFF' : '#8C8C8C',
        borderColor: isAdmin ? '#2D2DFF' : '#8C8C8C',
      }}
    >
      {role.toUpperCase()}
    </Badge>
  )
}
