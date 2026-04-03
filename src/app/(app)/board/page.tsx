'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { FilterBar } from '@/components/filters/FilterBar'
import { Modal } from '@/components/ui/Modal'
import { UndoToast } from '@/components/ui/UndoToast'
import { Button } from '@/components/ui/Button'
import { useAllDeals } from '@/hooks/useDeals'
import { createClient } from '@/lib/supabase/client'
import type { Deal, FilterState } from '@/types/app.types'
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
  const { deals, loading, updateDealStage, deleteDeal, refetch } = useAllDeals(filters)

  const month = getMonthKey()

  // Delete confirmation state
  const [pendingDelete, setPendingDelete] = useState<Deal | null>(null)

  // Undo state
  const [deletedDeal, setDeletedDeal] = useState<Deal | null>(null)
  const [showUndo, setShowUndo] = useState(false)

  function handleFilterChange(updates: Partial<Omit<FilterState, 'month'>>) {
    setFilters(prev => ({ ...prev, ...updates }))
  }

  function handleStageChange(id: string, stage: StageKey, probability: number) {
    updateDealStage(id, stage, probability)
  }

  function handleDeleteRequest(id: string) {
    const deal = deals.find(d => d.id === id)
    if (deal) setPendingDelete(deal)
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    const deal = pendingDelete
    setPendingDelete(null)

    // Delete the deal
    await deleteDeal(deal.id)

    // Show undo toast
    setDeletedDeal(deal)
    setShowUndo(true)
  }

  const handleUndo = useCallback(async () => {
    if (!deletedDeal) return
    setShowUndo(false)

    // Re-insert the deal
    const supabase = createClient()
    const { owner, ...dealData } = deletedDeal
    await supabase.from('deals').insert(dealData)
    refetch()
    setDeletedDeal(null)
  }, [deletedDeal, refetch])

  const handleUndoDismiss = useCallback(() => {
    setShowUndo(false)
    setDeletedDeal(null)
  }, [])

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
            onDeleteDeal={handleDeleteRequest}
          />
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="confirm_delete.exe"
        size="sm"
        accent="black"
      >
        <div className="p-6 flex flex-col gap-4">
          <p className="text-white text-sm">
            Delete <strong>{pendingDelete?.name}</strong>? This action can be undone within 5 seconds.
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Button size="sm" variant="secondary" onClick={() => setPendingDelete(null)}>
              CANCEL
            </Button>
            <Button size="sm" variant="danger" onClick={handleConfirmDelete}>
              <Trash2 size={12} />
              DELETE
            </Button>
          </div>
        </div>
      </Modal>

      {/* Undo toast */}
      <UndoToast
        isVisible={showUndo}
        message={`"${deletedDeal?.name}" deleted`}
        onUndo={handleUndo}
        onDismiss={handleUndoDismiss}
      />
    </div>
  )
}
