import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getDaysAgo } from '@/lib/utils'
import { STALE_DEAL_DAYS } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url   = new URL(req.url)
  const month = url.searchParams.get('month')

  let query = supabase
    .from('deals')
    .select('*, owner:profiles(name, email)')
    .order('created_at', { ascending: false })

  if (month) query = query.eq('month_attribution', month)

  const { data: deals } = await query
  if (!deals) return NextResponse.json({ error: 'No data' }, { status: 404 })

  const HEADERS = [
    'Deal Name', 'Client', 'Stage', 'Bucket', 'Value (RM)',
    'Probability (%)', 'Weighted Value (RM)', 'Expected Close',
    'Month Attribution', 'Owner', 'Industry', 'Source',
    'Next Action', 'Next Action Due', 'Stale (14d+)', 'Tags', 'Notes',
    'Created', 'Last Updated',
  ]

  const rows = deals.map((d: Record<string, unknown>) => {
    const stale = getDaysAgo(d.last_updated_at as string) >= STALE_DEAL_DAYS ? 'YES' : 'NO'
    return [
      d.name, d.client_name, d.stage, d.bucket,
      d.estimated_value, d.probability,
      Math.round(Number(d.estimated_value) * Number(d.probability) / 100),
      d.expected_close_date ?? '',
      d.month_attribution,
      (d.owner as { name: string } | null)?.name ?? '',
      d.industry ?? '', d.source ?? '',
      d.next_action ?? '', d.next_action_due ?? '',
      stale,
      Array.isArray(d.tags) ? d.tags.join(';') : '',
      String(d.notes ?? '').replace(/[\r\n,]/g, ' '),
      d.created_at, d.last_updated_at,
    ]
  })

  const csv = [HEADERS, ...rows]
    .map(row =>
      row.map(cell =>
        `"${String(cell ?? '').replace(/"/g, '""')}"`
      ).join(',')
    )
    .join('\n')

  const dateStr  = new Date().toISOString().slice(0, 10)
  const filename = `edt-deals${month ? `-${month.slice(0, 7)}` : ''}-${dateStr}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
