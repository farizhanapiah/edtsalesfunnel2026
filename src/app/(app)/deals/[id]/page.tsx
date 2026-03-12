'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit, Trash2, ArrowLeft, AlertCircle, CalendarX, Clock } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { WindowPanel } from '@/components/ui/WindowPanel'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { BucketBadge, StageBadge } from '@/components/ui/Badge'
import { DealForm } from '@/components/deals/DealForm'
import { DealNotes } from '@/components/deals/DealNotes'
import { createClient } from '@/lib/supabase/client'
import { formatRM, formatDate, getDaysAgo, isOverdue } from '@/lib/utils'
import { STALE_DEAL_DAYS } from '@/lib/constants'
import type { Deal, Profile } from '@/types/app.types'

export default function DealDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const [deal, setDeal]       = useState<Deal | null>(null)
  const [me, setMe]           = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setMe(profile)
      }

      const { data } = await supabase
        .from('deals')
        .select('*, owner:profiles(id, name, email, role)')
        .eq('id', id)
        .single()

      setDeal(data as Deal ?? null)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('deals').delete().eq('id', id)
    router.push('/board')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <span className="label-caps text-[#8C8C8C]">LOADING...</span>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <span className="font-display text-white text-xl">DEAL NOT FOUND</span>
        <Link href="/board" className="text-[#2D2DFF] label-caps text-sm">← BACK TO BOARD</Link>
      </div>
    )
  }

  const daysStale = getDaysAgo(deal.last_updated_at)
  const isStale   = daysStale >= STALE_DEAL_DAYS && ['leads', 'negotiation'].includes(deal.stage)
  const isAdmin   = me?.role === 'admin'
  const canEdit   = isAdmin || me?.id === deal.owner_id

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={deal.name}
        subtitle={deal.client_name}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/board"
              className="flex items-center gap-1.5 label-caps text-[#8C8C8C] text-[11px]
                hover:text-white transition-colors px-3 py-2 border border-[#333]"
            >
              <ArrowLeft size={12} />
              BOARD
            </Link>
            {canEdit && (
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                <Edit size={12} />
                EDIT
              </Button>
            )}
            {isAdmin && (
              <Button size="sm" variant="danger" onClick={() => setDeleting(true)}>
                <Trash2 size={12} />
                DELETE
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 flex flex-col lg:flex-row gap-6 max-w-[1200px]">
        {/* Left: Deal info */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Status bar */}
          <div className="flex flex-wrap items-center gap-2">
            <BucketBadge bucket={deal.bucket} />
            <StageBadge stage={deal.stage} />
            {isStale && (
              <span className="panel-label border border-[#F59E0B] text-[#F59E0B]">
                <AlertCircle size={10} className="inline mr-1" />
                STALE ({daysStale} DAYS)
              </span>
            )}
          </div>

          {/* Main stats */}
          <div className="window-chrome">
            <div className="window-title-bar-blue">
              <span className="window-dot" /><span className="window-dot" /><span className="window-dot-filled" />
              <span className="label-caps text-white text-[11px] ml-2">{deal.name.toUpperCase()}.DEAL</span>
            </div>
            <div className="bg-[#111] p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="label-caps text-[#8C8C8C] text-[10px] block mb-1">VALUE</span>
                <span className="font-display text-white text-2xl">{formatRM(Number(deal.estimated_value))}</span>
              </div>
              <div>
                <span className="label-caps text-[#8C8C8C] text-[10px] block mb-1">PROBABILITY</span>
                <span className="font-display text-[#2D2DFF] text-2xl">{deal.probability}%</span>
              </div>
              <div>
                <span className="label-caps text-[#8C8C8C] text-[10px] block mb-1">WEIGHTED</span>
                <span className="font-display text-white text-2xl">
                  {formatRM(Number(deal.estimated_value) * deal.probability / 100, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <WindowPanel title="DEAL.INFO">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'CLIENT',        value: deal.client_name },
                { label: 'OWNER',         value: deal.owner?.name ?? '—' },
                { label: 'CLOSE DATE',    value: formatDate(deal.expected_close_date) },
                { label: 'MONTH',         value: deal.month_attribution.slice(0, 7) },
                { label: 'INDUSTRY',      value: deal.industry ?? '—' },
                { label: 'SOURCE',        value: deal.source   ?? '—' },
                { label: 'CREATED',       value: formatDate(deal.created_at) },
                { label: 'LAST UPDATED',  value: `${formatDate(deal.last_updated_at)} (${daysStale}d ago)` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="label-caps text-[#8C8C8C] text-[10px] block mb-0.5">{label}</span>
                  <span className="text-white text-sm">{value}</span>
                </div>
              ))}
            </div>

            {deal.notes && (
              <div className="mt-4 pt-4 border-t border-[#222]">
                <span className="label-caps text-[#8C8C8C] text-[10px] block mb-2">NOTES</span>
                <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{deal.notes}</p>
              </div>
            )}

            {deal.tags && deal.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#222]">
                <span className="label-caps text-[#8C8C8C] text-[10px] block mb-2">TAGS</span>
                <div className="flex flex-wrap gap-2">
                  {deal.tags.map(tag => (
                    <span key={tag} className="panel-label border border-[#333] text-[#8C8C8C]">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </WindowPanel>

          {/* Next action */}
          {(deal.next_action || deal.next_action_due) && (
            <WindowPanel
              title="NEXT.ACTION"
              accent={isOverdue(deal.next_action_due) ? 'blue' : 'black'}
            >
              <div className="flex items-start gap-3">
                <CalendarX
                  size={16}
                  style={{ color: isOverdue(deal.next_action_due) ? '#EF4444' : '#2D2DFF' }}
                  className="flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-white text-sm">{deal.next_action}</p>
                  {deal.next_action_due && (
                    <p
                      className="label-caps text-[11px] mt-1"
                      style={{ color: isOverdue(deal.next_action_due) ? '#EF4444' : '#8C8C8C' }}
                    >
                      {isOverdue(deal.next_action_due) ? '⚠ OVERDUE — ' : 'DUE: '}
                      {formatDate(deal.next_action_due)}
                    </p>
                  )}
                </div>
              </div>
            </WindowPanel>
          )}
        </div>

        {/* Right: Notes */}
        <div className="lg:w-[360px]">
          <WindowPanel title="MEETING.LOG" accent="surface" noPadding>
            <div className="p-4">
              <DealNotes dealId={deal.id} />
            </div>
          </WindowPanel>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="EDIT.DEAL.EXE" size="lg">
        <DealForm
          deal={deal}
          onSaved={saved => { setDeal(saved); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleting} onClose={() => setDeleting(false)} title="CONFIRM.DELETE" size="sm" accent="black">
        <div className="p-6 flex flex-col gap-4">
          <p className="text-white text-sm leading-relaxed">
            Delete <strong>{deal.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} arrow>DELETE</Button>
            <Button variant="secondary" onClick={() => setDeleting(false)}>CANCEL</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
