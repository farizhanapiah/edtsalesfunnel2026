'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthLabel } from '@/lib/utils'

interface MonthSelectorProps {
  month:    string   // 'YYYY-MM-01'
  onChange: (month: string) => void
}

export function MonthSelector({ month, onChange }: MonthSelectorProps) {
  function shift(delta: number) {
    const d = new Date(month + 'T00:00:00')
    d.setMonth(d.getMonth() + delta)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    onChange(key)
  }

  return (
    <div className="flex items-center gap-0 window-chrome-grey border border-[#333]">
      <button
        onClick={() => shift(-1)}
        className="px-3 py-2 text-[#8C8C8C] hover:text-white hover:bg-[#111] transition-colors border-r border-[#333]"
      >
        <ChevronLeft size={14} />
      </button>

      <span className="px-4 py-2 label-caps text-white text-[12px] min-w-[160px] text-center">
        {getMonthLabel(month)}
      </span>

      <button
        onClick={() => shift(1)}
        className="px-3 py-2 text-[#8C8C8C] hover:text-white hover:bg-[#111] transition-colors border-l border-[#333]"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
