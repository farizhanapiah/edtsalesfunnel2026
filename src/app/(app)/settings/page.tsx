'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { WindowPanel } from '@/components/ui/WindowPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTargets } from '@/hooks/useTargets'
import { getMonthKey, getMonthLabel } from '@/lib/utils'
import { TARGET_DEFAULTS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { EmailSubscriber } from '@/types/app.types'
import { Plus, Trash2, Mail, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const month     = getMonthKey()
  const { target, updateTarget } = useTargets(month)

  const [tiers, setTiers] = useState<{
    baseline:      number
    good:          number
    excellent:     number
    active_target: number | null
  }>({
    baseline:      TARGET_DEFAULTS.baseline,
    good:          TARGET_DEFAULTS.good,
    excellent:     TARGET_DEFAULTS.excellent,
    active_target: TARGET_DEFAULTS.baseline,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([])
  const [newEmail, setNewEmail]   = useState('')
  const [newName, setNewName]     = useState('')
  const [addingSub, setAddingSub] = useState(false)

  useEffect(() => {
    if (target) {
      setTiers({
        baseline:      target.baseline,
        good:          target.good,
        excellent:     target.excellent,
        active_target: target.active_target,
      })
    }
  }, [target])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('email_subscribers').select('*').order('created_at')
      setSubscribers((data as EmailSubscriber[]) ?? [])
    }
    load()
  }, [])

  async function saveTargets() {
    setSaving(true)
    await updateTarget(tiers)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function addSubscriber() {
    if (!newEmail.trim() || !newName.trim()) return
    setAddingSub(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('email_subscribers')
      .insert({ email: newEmail.trim(), name: newName.trim() })
      .select()
      .single()
    if (data) setSubscribers(prev => [...prev, data as EmailSubscriber])
    setNewEmail('')
    setNewName('')
    setAddingSub(false)
  }

  async function toggleSubscriber(id: string, is_active: boolean) {
    const supabase = createClient()
    await supabase.from('email_subscribers').update({ is_active }).eq('id', id)
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, is_active } : s))
  }

  async function deleteSubscriber(id: string) {
    const supabase = createClient()
    await supabase.from('email_subscribers').delete().eq('id', id)
    setSubscribers(prev => prev.filter(s => s.id !== id))
  }

  async function sendTestEmail() {
    await fetch('/api/email/send-summary', { method: 'POST' })
    alert('Test email sent to all active subscribers!')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="SETTINGS" subtitle="Targets, email list, and configuration" />

      <div className="p-6 flex flex-col gap-6 max-w-[900px]">
        {/* Target Setup */}
        <WindowPanel title="TARGET.SETUP.EXE" accent="blue">
          <div className="flex flex-col gap-4">
            <p className="label-caps text-[#8C8C8C] text-[10px]">
              MONTHLY TARGETS — {getMonthLabel(month)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="BASELINE TARGET (RM)"
                type="number"
                value={tiers.baseline}
                onChange={e => setTiers(t => ({ ...t, baseline: parseInt(e.target.value) || 0 }))}
              />
              <Input
                label="GOOD TARGET (RM)"
                type="number"
                value={tiers.good}
                onChange={e => setTiers(t => ({ ...t, good: parseInt(e.target.value) || 0 }))}
              />
              <Input
                label="EXCELLENT TARGET (RM)"
                type="number"
                value={tiers.excellent}
                onChange={e => setTiers(t => ({ ...t, excellent: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {/* Active tier selector */}
            <div>
              <span className="label-caps text-[#8C8C8C] text-[10px] block mb-2">ACTIVE TARGET TIER</span>
              <div className="flex gap-3 flex-wrap">
                {[
                  { key: 'baseline',  label: 'BASELINE',  value: tiers.baseline,  color: '#8C8C8C' },
                  { key: 'good',      label: 'GOOD',      value: tiers.good,      color: '#2D2DFF' },
                  { key: 'excellent', label: 'EXCELLENT', value: tiers.excellent, color: '#22C55E' },
                ].map(tier => {
                  const isActive = tiers.active_target === tier.value
                  return (
                    <button
                      key={tier.key}
                      onClick={() => setTiers(t => ({ ...t, active_target: tier.value }))}
                      className="px-4 py-2 transition-all label-caps text-[11px]"
                      style={{
                        border:          `1px solid ${isActive ? tier.color : '#333'}`,
                        color:           isActive ? tier.color : '#8C8C8C',
                        backgroundColor: isActive ? `${tier.color}18` : 'transparent',
                      }}
                    >
                      {tier.label} — RM{(tier.value/1000).toFixed(0)}k
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={saveTargets} disabled={saving} arrow>
                {saving ? 'SAVING...' : 'SAVE TARGETS'}
              </Button>
              {saved && (
                <span className="label-caps text-[#22C55E] text-[11px] flex items-center gap-1">
                  <CheckCircle size={12} />
                  SAVED
                </span>
              )}
            </div>
          </div>
        </WindowPanel>

        {/* Email Subscribers */}
        <WindowPanel title="EMAIL.SUBSCRIBERS" accent="black">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="label-caps text-[#8C8C8C] text-[10px]">
                RECIPIENTS FOR MONDAY + FRIDAY SUMMARY EMAILS
              </p>
              <button
                onClick={sendTestEmail}
                className="flex items-center gap-1.5 border border-[#333] text-[#8C8C8C]
                  hover:border-[#2D2DFF] hover:text-[#2D2DFF] transition-colors
                  px-3 py-1.5 label-caps text-[10px]"
              >
                <Mail size={11} />
                SEND TEST
              </button>
            </div>

            {/* Add subscriber */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="bg-[#111] border border-[#333] text-white px-3 py-2 text-sm
                  placeholder:text-[#444] focus:border-[#2D2DFF] transition-colors w-40"
              />
              <input
                type="email"
                placeholder="email@weareedt.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="bg-[#111] border border-[#333] text-white px-3 py-2 text-sm
                  placeholder:text-[#444] focus:border-[#2D2DFF] transition-colors flex-1"
              />
              <Button size="sm" onClick={addSubscriber} disabled={addingSub}>
                <Plus size={12} />
                ADD
              </Button>
            </div>

            {/* Subscriber list */}
            {subscribers.length === 0 ? (
              <p className="text-[#8C8C8C] text-xs label-caps py-4 text-center">NO SUBSCRIBERS YET</p>
            ) : (
              <div className="window-chrome-grey border border-[#222]">
                {subscribers.map((sub, i) => (
                  <div key={sub.id}>
                    {i > 0 && <div className="border-t border-[#222]" />}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-semibold">{sub.name}</p>
                        <p className="text-[#8C8C8C] text-xs">{sub.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSubscriber(sub.id, !sub.is_active)}
                          className="label-caps text-[10px] px-2 py-1 border transition-colors"
                          style={{
                            borderColor:     sub.is_active ? '#22C55E' : '#333',
                            color:           sub.is_active ? '#22C55E' : '#8C8C8C',
                            backgroundColor: sub.is_active ? 'rgba(34,197,94,0.1)' : 'transparent',
                          }}
                        >
                          {sub.is_active ? 'ACTIVE' : 'PAUSED'}
                        </button>
                        <button
                          onClick={() => deleteSubscriber(sub.id)}
                          className="text-[#8C8C8C] hover:text-[#EF4444] transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </WindowPanel>
      </div>
    </div>
  )
}
