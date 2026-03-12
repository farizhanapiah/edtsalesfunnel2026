'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Target } from '@/types/app.types'
import { TARGET_DEFAULTS } from '@/lib/constants'

export function useTargets(month: string) {
  const [target, setTarget]   = useState<Target | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('targets')
        .select('*')
        .eq('month', month)
        .single()

      setTarget(data ?? null)
      setLoading(false)
    }
    load()
  }, [month])

  // Returns the active target value (uses active_target if set, else baseline)
  const activeTarget = target?.active_target ?? target?.baseline ?? TARGET_DEFAULTS.baseline

  async function updateTarget(updates: Partial<Omit<Target, 'id' | 'created_at'>>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('targets')
      .upsert({ month, ...updates }, { onConflict: 'month' })
      .select()
      .single()

    if (!error && data) setTarget(data)
  }

  return { target, loading, activeTarget, updateTarget }
}
