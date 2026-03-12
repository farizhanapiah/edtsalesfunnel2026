import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title:       string
  description?: string
  action?:     React.ReactNode
  className?:  string
  icon?:       React.ReactNode
}

export function EmptyState({ title, description, action, className, icon }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && <div className="mb-4 text-[#8C8C8C]">{icon}</div>}
      <h3 className="font-display text-white text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-[#8C8C8C] text-sm max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
