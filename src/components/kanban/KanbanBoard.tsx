'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import { KanbanColumn } from './KanbanColumn'
import { DealCardOverlay } from './DealCard'
import { COLUMN_ORDER, STAGE_PROBABILITY_DEFAULTS, type StageKey } from '@/lib/constants'
import type { Deal } from '@/types/app.types'

interface KanbanBoardProps {
  deals:            Deal[]
  onStageChange:    (id: string, stage: StageKey, probability: number) => void
  onAddDeal?:       () => void
  onDeleteDeal?:    (id: string) => void
}

export function KanbanBoard({ deals, onStageChange, onAddDeal, onDeleteDeal }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Require 8px movement before drag
    })
  )

  const activeDeal = activeId ? deals.find(d => d.id === activeId) ?? null : null

  // Group deals by stage
  const dealsByStage = COLUMN_ORDER.reduce((acc, stage) => {
    acc[stage] = deals.filter(d => d.stage === stage)
    return acc
  }, {} as Record<StageKey, Deal[]>)

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const dealId      = active.id as string
    const overId      = over.id as string
    const currentDeal = deals.find(d => d.id === dealId)
    if (!currentDeal) return

    // Check if we're dropping on a column (stage key) or on another card
    let targetStage: StageKey | null = null

    if (COLUMN_ORDER.includes(overId as StageKey)) {
      // Dropped directly on column
      targetStage = overId as StageKey
    } else {
      // Dropped on another card — find that card's stage
      const overDeal = deals.find(d => d.id === overId)
      if (overDeal) targetStage = overDeal.stage
    }

    if (!targetStage || targetStage === currentDeal.stage) return

    const probability = STAGE_PROBABILITY_DEFAULTS[targetStage]
    onStageChange(dealId, targetStage, probability)
  }, [deals, onStageChange])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMN_ORDER.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={dealsByStage[stage]}
            onAddDeal={stage === 'leads' ? onAddDeal : undefined}
            onDeleteDeal={onDeleteDeal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? <DealCardOverlay deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
