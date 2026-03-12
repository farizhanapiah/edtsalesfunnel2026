import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { WeeklySummaryEmail } from '@/emails/WeeklySummaryEmail'
import { calculateForecast, getStaleDeals } from '@/lib/forecasting'
import { getMonthKey, getDaysAgo, isOverdue, formatDate } from '@/lib/utils'
import type { Deal, Target, EmailSubscriber } from '@/types/app.types'

export async function GET(req: NextRequest) {
  // Auth — Vercel passes this automatically; also allow manual calls with secret
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    req.headers.get('x-vercel-cron') !== '1'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase    = createServiceRoleClient()
  const monthKey    = getMonthKey()
  const today       = new Date()
  const isMonday    = today.getDay() === 1

  const [{ data: rawDeals }, { data: target }, { data: subscribers }] = await Promise.all([
    supabase.from('deals').select('*, owner:profiles(name)').eq('month_attribution', monthKey),
    supabase.from('targets').select('*').eq('month', monthKey).single(),
    supabase.from('email_subscribers').select('*').eq('is_active', true),
  ])

  const deals = (rawDeals as Deal[]) ?? []
  const t     = target as Target | null
  const subs  = (subscribers as EmailSubscriber[]) ?? []

  if (!subs.length) {
    return NextResponse.json({ message: 'No active subscribers' })
  }

  const forecast     = calculateForecast(deals, t)
  const staleDeals   = getStaleDeals(deals)
  const activeTarget = t?.active_target ?? t?.baseline ?? 90000

  // Now + 7 days for actions
  const week7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const actionsThisWeek = deals
    .filter(d => d.next_action_due && new Date(d.next_action_due) <= week7)
    .sort((a, b) => (a.next_action_due! > b.next_action_due! ? 1 : -1))
    .slice(0, 8)

  const topDeals = deals
    .filter(d => ['leads', 'negotiation'].includes(d.stage))
    .sort((a, b) =>
      (Number(b.estimated_value) * b.probability) -
      (Number(a.estimated_value) * a.probability)
    )
    .slice(0, 5)
    .map(d => ({
      name:        d.name,
      client:      d.client_name,
      stage:       d.stage,
      value:       `RM${(Number(d.estimated_value)/1000).toFixed(0)}k`,
      probability: `${d.probability}%`,
      weighted:    `RM${Math.round(Number(d.estimated_value) * d.probability / 100 / 1000)}k`,
    }))

  const period = today.toLocaleDateString('en-MY', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const emailHtml = await render(
    WeeklySummaryEmail({
      reportType:       isMonday ? 'monday' : 'friday',
      period,
      closedWonValue:   forecast.closedWonValue,
      weightedForecast: forecast.weightedForecast,
      totalPipeline:    forecast.totalPipelineValue,
      activeTarget,
      closedWonCount:   forecast.dealsByStage['closed_won']?.count ?? 0,
      staleDealsCount:  staleDeals.length,
      topDeals,
      actionsThisWeek:  actionsThisWeek.map(d => ({
        dealName: d.name,
        action:   d.next_action ?? '—',
        dueDate:  formatDate(d.next_action_due),
        overdue:  isOverdue(d.next_action_due),
      })),
    })
  )

  const resend    = new Resend(process.env.RESEND_API_KEY)
  const subject   = `EDT Sales ${isMonday ? 'Week Kickoff' : 'Week Review'} — ${period}`
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'sales@weareedt.com'
  const fromName  = process.env.RESEND_FROM_NAME  ?? 'EDT Sales Bot'

  const results = await Promise.allSettled(
    subs.map(sub =>
      resend.emails.send({
        from:    `${fromName} <${fromEmail}>`,
        to:      sub.email,
        subject,
        html:    emailHtml,
      })
    )
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed, period, subscriberCount: subs.length })
}
