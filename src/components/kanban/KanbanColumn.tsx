'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { DealCard } from './DealCard'
import { cn, formatRM } from '@/lib/utils'
import { STAGES, type StageKey } from '@/lib/constants'
import type { Deal } from '@/types/app.types'

interface KanbanColumnProps {
  stage:          StageKey
  deals:          Deal[]
  onAddDeal?:     () => void
  onDeleteDeal?:  (id: string) => void
}

export function KanbanColumn({ stage, deals, onAddDeal, onDeleteDeal }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const stageConfig = STAGES[stage]

  const totalValue    = deals.reduce((s, d) => s + Number(d.estimated_value), 0)
  const weightedValue = deals.reduce((s, d) => s + (Number(d.estimated_value) * d.probability / 100), 0)

  return (
    <div className="flex flex-col flex-shrink-0 w-[260px]">
      {/* Column header */}
      <div
        className="window-chrome mb-2"
        style={{ borderColor: stageConfig.color }}
      >
        <div
          className="window-title-bar"
          style={{ backgroundColor: stageConfig.bgColor, borderColor: stageConfig.color }}
        >
          <span className="window-dot" style={{ borderColor: stageConfig.color }} />
          <span className="window-dot" style={{ borderColor: stageConfig.color }} />
          <span className="window-dot-filled" style={{ backgroundColor: stageConfig.color }} />
          <span
            className="label-caps text-[11px] ml-2 flex-1"
            style={{ color: stageConfig.color }}
          >
            {stageConfig.label}
          </span>
          <span
            className="label-caps text-[11px] px-2 py-0.5"
            style={{ backgroundColor: stageConfig.color, color: '#fff' }}
          >
            {deals.length}
          </span>
        </div>

        {/* Stage totals */}
        <div className="px-3 py-2 bg-[#0A0A0A] flex items-center justify-between">
          <span className="label-caps text-[#8C8C8C] text-[10px]">
            {formatRM(totalValue, true)}
          </span>
          {['leads', 'negotiation'].includes(stage) && (
            <span className="label-caps text-[#2D2DFF] text-[10px]">
              ~{formatRM(weightedValue, true)}
            </span>
          )}
          {onAddDeal && ['leads', 'negotiation'].includes(stage) && (
            <button
              onClick={onAddDeal}
              className="text-[#8C8C8C] hover:text-white transition-colors ml-2"
              title="Add deal"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 min-h-[200px] p-2 transition-colors',
          'bg-[#0A0A0A] border border-[#1a1a1a]',
          isOver && 'column-drag-over'
        )}
      >
        <SortableContext
          items={deals.map(d => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map(deal => (
            <DealCard key={deal.id} deal={deal} onDelete={onDeleteDeal ? () => onDeleteDeal(deal.id) : undefined} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <span className="label-caps text-[#333] text-[10px]">NO DEALS</span>
          </div>
        )}
      </div>
    </div>
  )
}
