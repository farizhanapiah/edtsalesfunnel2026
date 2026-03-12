import { cn } from '@/lib/utils'

interface WindowPanelProps {
  title:      string
  children:   React.ReactNode
  accent?:    'black' | 'blue' | 'surface'
  className?: string
  actions?:   React.ReactNode
  noPadding?: boolean
}

export function WindowPanel({
  title, children, accent = 'black', className, actions, noPadding = false
}: WindowPanelProps) {
  const barClass = {
    black:   'window-title-bar',
    blue:    'window-title-bar-blue',
    surface: 'window-title-bar-surface',
  }[accent]

  return (
    <div className={cn('window-chrome', className)}>
      <div className={barClass}>
        <span className="window-dot" />
        <span className="window-dot" />
        <span className="window-dot-filled" />
        <span className="label-caps text-white text-[11px] ml-2 flex-1 truncate">
          {title}
        </span>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className={noPadding ? '' : 'p-4'}>
        {children}
      </div>
    </div>
  )
}
