'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { AlertCircle, Clock, CalendarX, Trash2 } from 'lucide-react'
import { BucketBadge } from '@/components/ui/Badge'
import { formatRM, formatDateShort, getDaysAgo, isOverdue, isDueSoon } from '@/lib/utils'
import { STALE_DEAL_DAYS } from '@/lib/constants'
import type { Deal } from '@/types/app.types'

interface DealCardProps {
  deal:       Deal
  isDragging?: boolean
  onDelete?:  () => void
}

export function DealCard({ deal, isDragging = false, onDelete }: DealCardProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging
  } = useSortable({ id: deal.id })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isSortableDragging ? 0.35 : 1,
    zIndex:     isSortableDragging ? 1 : undefined,
  }

  const daysStale    = getDaysAgo(deal.last_updated_at)
  const isStale      = daysStale >= STALE_DEAL_DAYS && ['leads', 'negotiation'].includes(deal.stage)
  const nextActDue   = deal.next_action_due
  const overdue      = isOverdue(nextActDue)
  const dueSoon      = isDueSoon(nextActDue, 3)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="window-chrome bg-[#111] select-none cursor-grab active:cursor-grabbing
        hover:border-[#2D2DFF] transition-colors"
    >
      {/* Window title bar */}
      <div className="window-title-bar-surface">
        <span className="window-dot" />
        <span className="window-dot" />
        <span className="window-dot-filled" />
        <span className="label-caps text-[#8C8C8C] text-[10px] ml-2 flex-1 truncate">
          {deal.client_name.toLowerCase()}.deal
        </span>
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); e.preventDefault(); onDelete() }}
            onPointerDown={e => e.stopPropagation()}
            className="text-[#8C8C8C] hover:text-red-400 transition-colors ml-auto p-0.5 cursor-pointer"
            title="Delete deal"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2">
        {/* Bucket + stale */}
        <div className="flex items-center justify-between gap-2">
          <BucketBadge bucket={deal.bucket} />
          {isStale && (
            <span className="panel-label border text-[#F59E0B]" style={{ borderColor: '#F59E0B', fontSize: '9px' }}>
              <AlertCircle size={8} className="inline mr-0.5" />
              {daysStale}D
            </span>
          )}
        </div>

        {/* Deal name — clickable link */}
        <Link
          href={`/deals/${deal.id}`}
          className="text-white text-sm font-semibold leading-tight hover:text-[#2D2DFF] transition-colors"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          {deal.name}
        </Link>

        {/* Value + probability */}
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-bold font-display" style={{ fontSize: '15px' }}>
            {formatRM(Number(deal.estimated_value), true)}
          </span>
          <span className="label-caps text-[#2D2DFF] text-[11px]">{deal.probability}%</span>
        </div>

        {/* Close date */}
        {deal.expected_close_date && (
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="text-[#8C8C8C] flex-shrink-0" />
            <span className="label-caps text-[#8C8C8C] text-[10px]">
              {formatDateShort(deal.expected_close_date)}
            </span>
          </div>
        )}

        {/* Next action due */}
        {nextActDue && (
          <div
            className="flex items-center gap-1.5 px-2 py-1"
            style={{
              borderLeft: `2px solid ${overdue ? '#EF4444' : dueSoon ? '#F59E0B' : '#333'}`,
            }}
          >
            <CalendarX size={10} style={{ color: overdue ? '#EF4444' : dueSoon ? '#F59E0B' : '#8C8C8C' }} />
            <span
              className="label-caps text-[10px]"
              style={{ color: overdue ? '#EF4444' : dueSoon ? '#F59E0B' : '#8C8C8C' }}
            >
              {overdue ? 'OVERDUE: ' : 'ACTION: '}{formatDateShort(nextActDue)}
            </span>
          </div>
        )}

        {/* Owner */}
        {deal.owner && (
          <div className="border-t border-[#222] pt-2 flex items-center justify-between">
            <span className="label-caps text-[#8C8C8C] text-[10px] truncate">
              {deal.owner.name}
            </span>
            {deal.tags && deal.tags.length > 0 && (
              <span className="label-caps text-[#8C8C8C] text-[9px]">
                {deal.tags[0]}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Ghost overlay during drag
export function DealCardOverlay({ deal }: { deal: Deal }) {
  return (
    <div className="window-chrome bg-[#111] opacity-90 rotate-2 scale-105 cursor-grabbing w-[240px]">
      <div className="window-title-bar-blue">
        <span className="window-dot" />
        <span className="window-dot" />
        <span className="window-dot-filled" />
        <span className="label-caps text-white text-[10px] ml-2 truncate">
          {deal.client_name.toLowerCase()}.deal
        </span>
      </div>
      <div className="p-3">
        <BucketBadge bucket={deal.bucket} />
        <p className="text-white text-sm font-semibold mt-1.5 leading-tight">{deal.name}</p>
        <p className="font-display text-white mt-1" style={{ fontSize: '15px' }}>
          {formatRM(Number(deal.estimated_value), true)}
        </p>
      </div>
    </div>
  )
}
