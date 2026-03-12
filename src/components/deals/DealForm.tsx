'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import {
  BUCKETS, STAGES, COLUMN_ORDER,
  STAGE_PROBABILITY_DEFAULTS, INDUSTRY_OPTIONS, SOURCE_OPTIONS
} from '@/lib/constants'
import type { Deal, Profile } from '@/types/app.types'

const dealSchema = z.object({
  name:                z.string().min(2, 'Deal name required').max(100),
  client_name:         z.string().min(2, 'Client name required').max(100),
  bucket:              z.enum(['small', 'medium', 'large']),
  estimated_value:     z.number({ message: 'Must be a number' })
    .min(1000, 'Min RM1,000').max(9999999),
  probability:         z.number().min(0).max(100),
  stage:               z.enum(['leads', 'negotiation', 'closed_won', 'closed_lost']),
  expected_close_date: z.string().optional(),
  next_action:         z.string().max(200).optional(),
  next_action_due:     z.string().optional(),
  notes:               z.string().max(2000).optional(),
  industry:            z.string().optional(),
  source:              z.string().optional(),
  owner_id:            z.string().uuid(),
})

type FormData = z.infer<typeof dealSchema>

interface DealFormProps {
  deal?:     Deal        // If present, we're editing
  onSaved:   (deal: Deal) => void
  onCancel?: () => void
}

export function DealForm({ deal, onSaved, onCancel }: DealFormProps) {
  const [owners, setOwners]   = useState<Profile[]>([])
  const [myId, setMyId]       = useState<string>('')
  const [errors, setErrors]   = useState<Partial<Record<keyof FormData, string>>>({})
  const [saving, setSaving]   = useState(false)

  const [form, setForm] = useState<Partial<FormData>>({
    name:                deal?.name ?? '',
    client_name:         deal?.client_name ?? '',
    bucket:              deal?.bucket ?? 'medium',
    estimated_value:     deal?.estimated_value ? Number(deal.estimated_value) : undefined,
    probability:         deal?.probability ?? 50,
    stage:               deal?.stage ?? 'leads',
    expected_close_date: deal?.expected_close_date ?? '',
    next_action:         deal?.next_action ?? '',
    next_action_due:     deal?.next_action_due ?? '',
    notes:               deal?.notes ?? '',
    industry:            deal?.industry ?? '',
    source:              deal?.source ?? '',
    owner_id:            deal?.owner_id ?? '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyId(user.id)

      // Load owner list (admin gets all, sales gets own profile)
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

      if (profile?.role === 'admin') {
        const { data: allProfiles } = await supabase.from('profiles').select('*').order('name')
        setOwners(allProfiles ?? [])
      } else {
        setOwners(profile ? [profile] : [])
        if (!deal) setForm(prev => ({ ...prev, owner_id: user!.id }))
      }

      if (!deal) setForm(prev => ({ ...prev, owner_id: prev.owner_id || user!.id }))
    }
    load()
  }, [])

  // Auto-update probability when stage changes
  function handleStageChange(stage: string) {
    setForm(prev => ({
      ...prev,
      stage:       stage as FormData['stage'],
      probability: STAGE_PROBABILITY_DEFAULTS[stage as keyof typeof STAGE_PROBABILITY_DEFAULTS],
    }))
  }

  function set(field: keyof FormData, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const result = dealSchema.safeParse({
      ...form,
      estimated_value: Number(form.estimated_value),
      probability:     Number(form.probability),
    })

    if (!result.success) {
      const errs: typeof errors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormData
        errs[field] = issue.message
      }
      setErrors(errs)
      setSaving(false)
      return
    }

    const supabase = createClient()
    const payload  = {
      ...result.data,
      expected_close_date: result.data.expected_close_date || null,
      next_action:         result.data.next_action         || null,
      next_action_due:     result.data.next_action_due     || null,
      notes:               result.data.notes               || null,
      industry:            result.data.industry            || null,
      source:              result.data.source              || null,
    }

    let saved: Deal | null = null
    if (deal) {
      const { data } = await supabase.from('deals').update(payload).eq('id', deal.id).select('*').single()
      saved = data
    } else {
      const { data } = await supabase.from('deals').insert(payload).select('*').single()
      saved = data
    }

    setSaving(false)
    if (saved) onSaved(saved)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
      {/* Deal info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="DEAL NAME"
            value={form.name ?? ''}
            onChange={e => set('name', e.target.value)}
            placeholder="Axiata AR Brand Activation"
            error={errors.name}
            required
          />
        </div>
        <Input
          label="CLIENT / COMPANY"
          value={form.client_name ?? ''}
          onChange={e => set('client_name', e.target.value)}
          placeholder="Axiata Group"
          error={errors.client_name}
          required
        />
        <Select
          label="BUCKET"
          value={form.bucket ?? 'medium'}
          onChange={e => set('bucket', e.target.value)}
          error={errors.bucket}
        >
          {Object.entries(BUCKETS).map(([key, b]) => (
            <option key={key} value={key}>{b.label} — {b.range}</option>
          ))}
        </Select>
        <Input
          label="ESTIMATED VALUE (RM)"
          type="number"
          value={form.estimated_value ?? ''}
          onChange={e => set('estimated_value', parseFloat(e.target.value) || 0)}
          placeholder="40000"
          error={errors.estimated_value}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="label-caps text-[#8C8C8C] text-[10px]">PROBABILITY (%)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0} max={100} step={5}
              value={form.probability ?? 50}
              onChange={e => set('probability', parseInt(e.target.value))}
              className="flex-1 accent-[#2D2DFF]"
            />
            <span className="text-[#2D2DFF] font-semibold w-10 text-right label-caps">
              {form.probability}%
            </span>
          </div>
        </div>
      </div>

      {/* Stage + close date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="STAGE"
          value={form.stage ?? 'leads'}
          onChange={e => handleStageChange(e.target.value)}
        >
          {COLUMN_ORDER.map(key => (
            <option key={key} value={key}>{STAGES[key].label}</option>
          ))}
        </Select>
        <Input
          label="EXPECTED CLOSE DATE"
          type="date"
          value={form.expected_close_date ?? ''}
          onChange={e => set('expected_close_date', e.target.value)}
          error={errors.expected_close_date}
        />
      </div>

      {/* Owner */}
      <Select
        label="OWNER"
        value={form.owner_id ?? ''}
        onChange={e => set('owner_id', e.target.value)}
        error={errors.owner_id}
      >
        <option value="">Select owner...</option>
        {owners.map(o => (
          <option key={o.id} value={o.id}>{o.name} ({o.role})</option>
        ))}
      </Select>

      {/* Next action */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="NEXT ACTION"
          value={form.next_action ?? ''}
          onChange={e => set('next_action', e.target.value)}
          placeholder="Send proposal deck"
        />
        <Input
          label="NEXT ACTION DUE DATE"
          type="date"
          value={form.next_action_due ?? ''}
          onChange={e => set('next_action_due', e.target.value)}
        />
      </div>

      {/* Classification */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="INDUSTRY"
          value={form.industry ?? ''}
          onChange={e => set('industry', e.target.value)}
        >
          <option value="">Select industry...</option>
          {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
        </Select>
        <Select
          label="SOURCE"
          value={form.source ?? ''}
          onChange={e => set('source', e.target.value)}
        >
          <option value="">Select source...</option>
          {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {/* Notes */}
      <Textarea
        label="NOTES"
        value={form.notes ?? ''}
        onChange={e => set('notes', e.target.value)}
        placeholder="Key context, meeting notes, budget confirmed..."
        rows={3}
      />

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2 border-t border-[#222]">
        <Button type="submit" disabled={saving} arrow>
          {saving ? 'SAVING...' : deal ? 'SAVE CHANGES' : 'CREATE DEAL'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            CANCEL
          </Button>
        )}
      </div>
    </form>
  )
}
