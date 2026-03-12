'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Deal } from '@/types/app.types'
import type { FilterState } from '@/types/app.types'
import { getMonthKey } from '@/lib/utils'

const DEFAULT_FILTERS: FilterState = {
  month:    getMonthKey(),
  owner_id: '',
  bucket:   '',
  stage:    '',
  prob_min: 0,
  prob_max: 100,
  keyword:  '',
}

export function useDeals(filters?: Partial<FilterState>) {
  const [deals, setDeals]   = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const merged = { ...DEFAULT_FILTERS, ...filters }

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    let query = supabase
      .from('deals')
      .select('*, owner:profiles(id, name, email, role)')
      .order('created_at', { ascending: false })

    if (merged.month)    query = query.eq('month_attribution', merged.month)
    if (merged.owner_id) query = query.eq('owner_id', merged.owner_id)
    if (merged.bucket)   query = query.eq('bucket', merged.bucket)
    if (merged.stage)    query = query.eq('stage', merged.stage)
    if (merged.prob_min > 0)   query = query.gte('probability', merged.prob_min)
    if (merged.prob_max < 100) query = query.lte('probability', merged.prob_max)
    if (merged.keyword) {
      query = query.or(
        `name.ilike.%${merged.keyword}%,client_name.ilike.%${merged.keyword}%`
      )
    }

    const { data, error: err } = await query
    if (err) { setError(err.message); setLoading(false); return }
    setDeals((data as Deal[]) ?? [])
    setLoading(false)
  }, [JSON.stringify(merged)])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('deals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, fetchDeals)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchDeals])

  async function updateDealStage(id: string, stage: string, probability: number) {
    const supabase = createClient()
    // Optimistic update
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage: stage as Deal['stage'], probability } : d))

    const { error: err } = await supabase
      .from('deals')
      .update({ stage, probability })
      .eq('id', id)

    if (err) {
      setError(err.message)
      fetchDeals() // Revert on error
    }
  }

  async function deleteDeal(id: string) {
    const supabase = createClient()
    setDeals(prev => prev.filter(d => d.id !== id))
    const { error: err } = await supabase.from('deals').delete().eq('id', id)
    if (err) { setError(err.message); fetchDeals() }
  }

  return { deals, loading, error, refetch: fetchDeals, updateDealStage, deleteDeal }
}

// Load ALL deals without month filter (for kanban board)
export function useAllDeals(filters?: Partial<Omit<FilterState, 'month'>>) {
  const [deals, setDeals]   = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('deals')
      .select('*, owner:profiles(id, name, email, role)')
      .order('created_at', { ascending: false })

    if (filters?.owner_id) query = query.eq('owner_id', filters.owner_id)
    if (filters?.bucket)   query = query.eq('bucket', filters.bucket)
    if (filters?.stage)    query = query.eq('stage', filters.stage)
    if (filters?.prob_min && filters.prob_min > 0) query = query.gte('probability', filters.prob_min)
    if (filters?.prob_max && filters.prob_max < 100) query = query.lte('probability', filters.prob_max)
    if (filters?.keyword) {
      query = query.or(`name.ilike.%${filters.keyword}%,client_name.ilike.%${filters.keyword}%`)
    }

    const { data } = await query
    setDeals((data as Deal[]) ?? [])
    setLoading(false)
  }, [JSON.stringify(filters)])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  // Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('all-deals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, fetchDeals)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchDeals])

  async function updateDealStage(id: string, stage: string, probability: number) {
    const supabase = createClient()
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage: stage as Deal['stage'], probability } : d))
    await supabase.from('deals').update({ stage, probability }).eq('id', id)
  }

  return { deals, loading, refetch: fetchDeals, updateDealStage }
}
