import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// POST /api/email/send-summary — triggers a manual email send (admin only)
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') {
    return new Response('Forbidden', { status: 403 })
  }

  // Delegate to the cron handler
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/cron/email-summary`, {
    headers: { 'authorization': `Bearer ${process.env.CRON_SECRET}` }
  })

  const data = await res.json()
  return Response.json(data)
}
