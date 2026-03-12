'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen:    boolean
  onClose:   () => void
  title:     string
  children:  React.ReactNode
  size?:     'sm' | 'md' | 'lg' | 'xl'
  accent?:   'black' | 'blue'
}

export function Modal({
  isOpen, onClose, title, children, size = 'md', accent = 'blue'
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else        document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Modal */}
      <div
        className={cn('relative w-full window-chrome', widths[size])}
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className={accent === 'blue' ? 'window-title-bar-blue' : 'window-title-bar'}>
          <span className="window-dot" />
          <span className="window-dot" />
          <span className="window-dot-filled" />
          <span className="label-caps text-white text-[11px] ml-2 flex-1 truncate">
            {title}
          </span>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors ml-auto"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#0A0A0A] max-h-[85vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
