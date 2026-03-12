'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { FilterBar } from '@/components/filters/FilterBar'
import { useAllDeals } from '@/hooks/useDeals'
import type { FilterState } from '@/types/app.types'
import type { StageKey } from '@/lib/constants'
import { getMonthKey } from '@/lib/utils'

const DEFAULT_FILTERS: Omit<FilterState, 'month'> = {
  owner_id: '',
  bucket:   '',
  stage:    '',
  prob_min: 0,
  prob_max: 100,
  keyword:  '',
}

export default function BoardPage() {
  const router = useRouter()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const { deals, loading, updateDealStage } = useAllDeals(filters)

  const month = getMonthKey()

  function handleFilterChange(updates: Partial<Omit<FilterState, 'month'>>) {
    setFilters(prev => ({ ...prev, ...updates }))
  }

  function handleStageChange(id: string, stage: StageKey, probability: number) {
    updateDealStage(id, stage, probability)
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="PIPELINE"
        subtitle="Kanban board — drag & drop to update stage"
        showExport
        exportHref={`/api/deals/export`}
        actions={
          <button
            onClick={() => router.push('/deals/new')}
            className="flex items-center gap-2 bg-[#2D2DFF] text-white px-4 py-2
              label-caps text-[11px] hover:bg-[#0000CC] transition-colors"
          >
            <Plus size={13} />
            ADD DEAL
          </button>
        }
      />

      <FilterBar
        filters={{ ...filters, month }}
        onChange={handleFilterChange}
      />

      <div className="flex-1 overflow-x-auto p-4 pixel-grid-subtle">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <span className="label-caps text-[#8C8C8C]">LOADING PIPELINE...</span>
          </div>
        ) : (
          <KanbanBoard
            deals={deals}
            onStageChange={handleStageChange}
            onAddDeal={() => router.push('/deals/new')}
          />
        )}
      </div>
    </div>
  )
}
