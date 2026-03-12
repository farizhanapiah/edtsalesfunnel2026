import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  'primary' | 'secondary' | 'ghost' | 'danger'
  size?:     'sm' | 'md' | 'lg'
  children:  React.ReactNode
  arrow?:    boolean
  asChild?:  boolean
}

export function Button({
  variant = 'primary', size = 'md', arrow = false,
  className, children, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center gap-2 font-semibold transition-colors cursor-pointer label-caps disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-[#2D2DFF] text-white hover:bg-[#0000CC]',
    secondary: 'bg-transparent text-white border border-white hover:bg-white hover:text-[#0A0A0A]',
    ghost:     'bg-transparent text-[#2D2DFF] hover:underline',
    danger:    'bg-transparent text-red-400 border border-red-400 hover:bg-red-400 hover:text-white',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-[11px]',
    md: 'px-5 py-2.5 text-[12px]',
    lg: 'px-7 py-3.5 text-[13px]',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
      {arrow && <span className="text-current">→</span>}
    </button>
  )
}
