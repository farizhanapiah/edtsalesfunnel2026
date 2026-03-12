import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url    = new URL(req.url)
  const month  = url.searchParams.get('month')
  const owner  = url.searchParams.get('owner_id')
  const bucket = url.searchParams.get('bucket')
  const stage  = url.searchParams.get('stage')
  const kw     = url.searchParams.get('keyword')

  let query = supabase
    .from('deals')
    .select('*, owner:profiles(id, name, email, role)')
    .order('created_at', { ascending: false })

  if (month)  query = query.eq('month_attribution', month)
  if (owner)  query = query.eq('owner_id', owner)
  if (bucket) query = query.eq('bucket', bucket)
  if (stage)  query = query.eq('stage', stage)
  if (kw)     query = query.or(`name.ilike.%${kw}%,client_name.ilike.%${kw}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase.from('deals').insert(body).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
