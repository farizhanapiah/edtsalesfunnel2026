import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string
  error?:    string
  className?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="label-caps text-[#8C8C8C] text-[10px]">{label}</label>
      )}
      <input
        className={cn(
          'bg-[#111] border text-white px-3 py-2.5 text-sm w-full',
          'placeholder:text-[#444] transition-colors',
          error
            ? 'border-red-500 focus:border-red-400'
            : 'border-[#333] focus:border-[#2D2DFF]',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:    string
  error?:    string
  children:  React.ReactNode
  className?: string
}

export function Select({ label, error, children, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="label-caps text-[#8C8C8C] text-[10px]">{label}</label>
      )}
      <select
        className={cn(
          'bg-[#111] border text-white px-3 py-2.5 text-sm w-full cursor-pointer',
          'transition-colors appearance-none',
          error
            ? 'border-red-500 focus:border-red-400'
            : 'border-[#333] focus:border-[#2D2DFF]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:    string
  error?:    string
  className?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="label-caps text-[#8C8C8C] text-[10px]">{label}</label>
      )}
      <textarea
        className={cn(
          'bg-[#111] border text-white px-3 py-2.5 text-sm w-full resize-y min-h-[80px]',
          'placeholder:text-[#444] transition-colors',
          error
            ? 'border-red-500 focus:border-red-400'
            : 'border-[#333] focus:border-[#2D2DFF]',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
