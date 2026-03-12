'use client'

import { Search, X, SlidersHorizontal } from 'lucide-react'
import type { FilterState } from '@/types/app.types'
import type { Profile } from '@/types/app.types'
import { BUCKETS, STAGES, COLUMN_ORDER } from '@/lib/constants'
import { getMonthKey } from '@/lib/utils'

interface FilterBarProps {
  filters:   FilterState
  onChange:  (filters: Partial<FilterState>) => void
  owners?:   Profile[]
  showMonth?: boolean
}

export function FilterBar({ filters, onChange, owners = [], showMonth = false }: FilterBarProps) {
  function clear() {
    onChange({
      month:    getMonthKey(),
      owner_id: '',
      bucket:   '',
      stage:    '',
      prob_min: 0,
      prob_max: 100,
      keyword:  '',
    })
  }

  const hasFilters = filters.owner_id || filters.bucket || filters.stage ||
    filters.prob_min > 0 || filters.prob_max < 100 || filters.keyword

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-[#0A0A0A] border-b border-[#222]">
      {/* Keyword search */}
      <div className="flex items-center gap-2 border border-[#333] px-3 py-2 flex-1 min-w-[200px] max-w-[280px]">
        <Search size={13} className="text-[#8C8C8C] flex-shrink-0" />
        <input
          type="text"
          value={filters.keyword}
          onChange={e => onChange({ keyword: e.target.value })}
          placeholder="Search deal or client..."
          className="bg-transparent text-white text-sm placeholder:text-[#444] flex-1 outline-none"
        />
        {filters.keyword && (
          <button onClick={() => onChange({ keyword: '' })} className="text-[#8C8C8C] hover:text-white">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Bucket filter */}
      <select
        value={filters.bucket}
        onChange={e => onChange({ bucket: e.target.value })}
        className="bg-[#111] border border-[#333] text-white px-3 py-2 text-xs cursor-pointer
          label-caps focus:border-[#2D2DFF] appearance-none min-w-[120px]"
      >
        <option value="">ALL BUCKETS</option>
        {Object.entries(BUCKETS).map(([key, b]) => (
          <option key={key} value={key}>{b.label} ({b.range})</option>
        ))}
      </select>

      {/* Stage filter */}
      <select
        value={filters.stage}
        onChange={e => onChange({ stage: e.target.value })}
        className="bg-[#111] border border-[#333] text-white px-3 py-2 text-xs cursor-pointer
          label-caps focus:border-[#2D2DFF] appearance-none min-w-[130px]"
      >
        <option value="">ALL STAGES</option>
        {COLUMN_ORDER.map(key => (
          <option key={key} value={key}>{STAGES[key].label}</option>
        ))}
      </select>

      {/* Owner filter */}
      {owners.length > 0 && (
        <select
          value={filters.owner_id}
          onChange={e => onChange({ owner_id: e.target.value })}
          className="bg-[#111] border border-[#333] text-white px-3 py-2 text-xs cursor-pointer
            label-caps focus:border-[#2D2DFF] appearance-none min-w-[130px]"
        >
          <option value="">ALL OWNERS</option>
          {owners.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      )}

      {/* Probability range */}
      <div className="flex items-center gap-2 border border-[#333] px-3 py-2">
        <SlidersHorizontal size={12} className="text-[#8C8C8C]" />
        <span className="label-caps text-[#8C8C8C] text-[10px]">PROB</span>
        <input
          type="number"
          min={0} max={100}
          value={filters.prob_min}
          onChange={e => onChange({ prob_min: parseInt(e.target.value) || 0 })}
          className="bg-transparent text-white text-xs w-8 text-center outline-none"
        />
        <span className="text-[#8C8C8C] text-xs">–</span>
        <input
          type="number"
          min={0} max={100}
          value={filters.prob_max}
          onChange={e => onChange({ prob_max: parseInt(e.target.value) || 100 })}
          className="bg-transparent text-white text-xs w-8 text-center outline-none"
        />
        <span className="label-caps text-[#8C8C8C] text-[10px]">%</span>
      </div>

      {/* Clear button */}
      {hasFilters && (
        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-2 border border-[#EF4444] text-[#EF4444]
            hover:bg-[#EF4444] hover:text-white transition-colors label-caps text-[11px]"
        >
          <X size={11} />
          CLEAR
        </button>
      )}
    </div>
  )
}
