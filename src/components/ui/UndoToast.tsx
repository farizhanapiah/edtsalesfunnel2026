'use client'

import { useEffect, useState, useCallback } from 'react'
import { Undo2 } from 'lucide-react'

interface UndoToastProps {
  message:    string
  onUndo:     () => void
  onDismiss:  () => void
  duration?:  number
  isVisible:  boolean
}

export function UndoToast({
  message, onUndo, onDismiss, duration = 5000, isVisible,
}: UndoToastProps) {
  const [remaining, setRemaining] = useState(duration)

  const handleUndo = useCallback(() => {
    onUndo()
  }, [onUndo])

  // Reset countdown when toast becomes visible
  useEffect(() => {
    if (isVisible) setRemaining(duration)
  }, [isVisible, duration])

  // Countdown timer
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 100) {
          onDismiss()
          return 0
        }
        return prev - 100
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isVisible, onDismiss])

  if (!isVisible) return null

  const seconds = Math.ceil(remaining / 1000)
  const progress = remaining / duration

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="window-chrome bg-[#111] min-w-[320px]">
        <div className="window-title-bar-surface">
          <span className="window-dot" />
          <span className="window-dot" />
          <span className="window-dot-filled" />
          <span className="label-caps text-[#8C8C8C] text-[10px] ml-2 truncate">
            system.alert
          </span>
        </div>

        <div className="p-3 flex items-center gap-3">
          <span className="text-white text-sm flex-1">{message}</span>

          <span className="label-caps text-[#8C8C8C] text-[11px] tabular-nums w-4 text-center">
            {seconds}
          </span>

          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D2DFF] text-white
              label-caps text-[11px] hover:bg-[#0000CC] transition-colors cursor-pointer"
          >
            <Undo2 size={11} />
            UNDO
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-[#222]">
          <div
            className="h-full bg-[#2D2DFF] transition-all duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
