'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { FilterBar } from '@/components/filters/FilterBar'
import { Modal } from '@/components/ui/Modal'
import { UndoToast } from '@/components/ui/UndoToast'
import { Button } from '@/components/ui/Button'
import { useAllDeals } from '@/hooks/useDeals'
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
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const month = getMonthKey()

  const [pendingDelete, setPendingDelete] = useState<Deal | null>(null)
  const [pendingUndo, setPendingUndo]     = useState<Deal | null>(null)
  const [hiddenIds, setHiddenIds]         = useState<Set<string>>(new Set())

  // Refs let the dismiss/undo callbacks stay stable so UndoToast's
  // countdown interval isn't torn down on every re-render.
  const pendingUndoRef = useRef<Deal | null>(null)
  const deleteDealRef  = useRef(deleteDeal)
  const refetchRef     = useRef(refetch)
  deleteDealRef.current = deleteDeal
  refetchRef.current    = refetch

  const visibleDeals = useMemo(
    () => deals.filter(d => !hiddenIds.has(d.id)),
    [deals, hiddenIds]
  )

  const removeHidden = useCallback((id: string) => {
    setHiddenIds(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const commitDelete = useCallback(async (deal: Deal) => {
    const ok = await deleteDealRef.current(deal.id)
    if (!ok) {
      removeHidden(deal.id)
      setDeleteError(
        `Could not delete "${deal.name}". You may not have permission, or the request failed.`
      )
      return
    }
    refetchRef.current()
    removeHidden(deal.id)
  }, [removeHidden])

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

  function handleConfirmDelete() {
    if (!pendingDelete) return
    const deal = pendingDelete
    setPendingDelete(null)

    // If a previous undo is still pending, commit it now (don't lose the delete)
    const prev = pendingUndoRef.current
    if (prev) {
      pendingUndoRef.current = null
      commitDelete(prev)
    }

    setHiddenIds(p => new Set(p).add(deal.id))
    pendingUndoRef.current = deal
    setPendingUndo(deal)
  }

  const handleUndo = useCallback(() => {
    const target = pendingUndoRef.current
    pendingUndoRef.current = null
    setPendingUndo(null)
    if (target) removeHidden(target.id)
  }, [removeHidden])

  const handleUndoDismiss = useCallback(() => {
    const target = pendingUndoRef.current
    pendingUndoRef.current = null
    setPendingUndo(null)
    if (target) commitDelete(target)
  }, [commitDelete])

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
            deals={visibleDeals}
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
            Delete <strong>{pendingDelete?.name}</strong>? You will have 5 seconds to undo.
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

      {/* Undo toast — countdown ticks here; commit fires on dismiss */}
      <UndoToast
        isVisible={!!pendingUndo}
        message={`"${pendingUndo?.name}" deleted`}
        onUndo={handleUndo}
        onDismiss={handleUndoDismiss}
      />

      {/* Delete error modal */}
      <Modal
        isOpen={!!deleteError}
        onClose={() => setDeleteError(null)}
        title="delete_failed.exe"
        size="sm"
        accent="black"
      >
        <div className="p-6 flex flex-col gap-4">
          <p className="text-white text-sm">{deleteError}</p>
          <div className="flex items-center justify-end">
            <Button size="sm" variant="secondary" onClick={() => setDeleteError(null)}>
              OK
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
