import { cn } from '@/lib/utils'

interface KPICardProps {
  title:      string
  value:      string
  subtitle?:  string
  accent?:    'blue' | 'green' | 'grey' | 'amber' | 'red'
  className?: string
  trend?:     { label: string; positive: boolean }
}

const accentColors = {
  blue:  '#2D2DFF',
  green: '#22C55E',
  grey:  '#8C8C8C',
  amber: '#F59E0B',
  red:   '#EF4444',
}

export function KPICard({ title, value, subtitle, accent = 'blue', className, trend }: KPICardProps) {
  const color = accentColors[accent]

  return (
    <div className={cn('window-chrome', className)}>
      {/* Title bar */}
      <div className="window-title-bar">
        <span className="window-dot" />
        <span className="window-dot" />
        <span className="window-dot-filled" />
        <span className="label-caps text-[#8C8C8C] text-[10px] ml-2 flex-1 truncate">
          {title}
        </span>
      </div>

      {/* Value */}
      <div className="bg-[#111] p-4 flex flex-col gap-1">
        <span
          className="font-display text-3xl leading-none"
          style={{ color }}
        >
          {value}
        </span>
        {subtitle && (
          <span className="label-caps text-[#8C8C8C] text-[10px]">{subtitle}</span>
        )}
        {trend && (
          <span
            className="label-caps text-[11px] mt-1"
            style={{ color: trend.positive ? '#22C55E' : '#EF4444' }}
          >
            {trend.positive ? '▲' : '▼'} {trend.label}
          </span>
        )}
      </div>
    </div>
  )
}
