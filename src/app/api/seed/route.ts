import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// POST /api/seed — dev-only seed endpoint
// Only available when ENABLE_SEED_ROUTE=true
export async function POST(req: NextRequest) {
  if (process.env.ENABLE_SEED_ROUTE !== 'true') {
    return NextResponse.json({ error: 'Seed route disabled' }, { status: 403 })
  }

  const supabase = createServiceRoleClient()

  // Get both users
  const { data: profiles } = await supabase
    .from('profiles').select('*').order('created_at')

  if (!profiles || profiles.length < 2) {
    return NextResponse.json({
      error: 'Create admin@weareedt.com and sales@weareedt.com users in Supabase Auth first'
    }, { status: 400 })
  }

  const adminProfile = profiles.find(p => p.email === 'admin@weareedt.com') ?? profiles[0]
  const salesProfile = profiles.find(p => p.email === 'sales@weareedt.com') ?? profiles[1]

  // Update roles
  await Promise.all([
    supabase.from('profiles').update({ role: 'admin' }).eq('id', adminProfile.id),
    supabase.from('profiles').update({ role: 'sales' }).eq('id', salesProfile.id),
  ])

  const now = new Date()
  function daysAgo(n: number) {
    const d = new Date(now)
    d.setDate(d.getDate() - n)
    return d.toISOString()
  }

  // Delete existing seed data
  await supabase.from('deals').delete().in('owner_id', [adminProfile.id, salesProfile.id])

  const { data: deals, error } = await supabase.from('deals').insert([
    // LEADS
    {
      name: 'Axiata AR Brand Activation', client_name: 'Axiata Group Berhad',
      bucket: 'large', estimated_value: 65000, probability: 20,
      stage: 'leads', expected_close_date: '2026-04-30',
      next_action: 'Send proposal deck', next_action_due: '2026-03-18',
      owner_id: adminProfile.id, industry: 'Telco', source: 'Referral',
      notes: 'Initial intro call done. CMO interested in AR activation for brand day.',
      last_updated_at: daysAgo(3),
    },
    {
      name: 'Grab Malaysia AI Photobooth', client_name: 'Grab Malaysia',
      bucket: 'medium', estimated_value: 38000, probability: 30,
      stage: 'leads', expected_close_date: '2026-04-15',
      next_action: 'Follow up on brief', next_action_due: '2026-03-20',
      owner_id: salesProfile.id, industry: 'Tech / Super App', source: 'Inbound',
      notes: 'Responded to RFP. Need to clarify number of booths and duration.',
      last_updated_at: daysAgo(5),
    },
    {
      name: 'CIMB Internal XR Training', client_name: 'CIMB Bank',
      bucket: 'small', estimated_value: 22000, probability: 25,
      stage: 'leads', expected_close_date: '2026-05-01',
      next_action: 'Schedule discovery call', next_action_due: '2026-03-22',
      owner_id: salesProfile.id, industry: 'Banking', source: 'LinkedIn',
      notes: 'Warm lead from LinkedIn. HR Director wants XR onboarding module.',
      last_updated_at: daysAgo(10),
    },
    // NEGOTIATION
    {
      name: 'Maxis Immersive Product Launch', client_name: 'Maxis Berhad',
      bucket: 'large', estimated_value: 70000, probability: 65,
      stage: 'negotiation', expected_close_date: '2026-03-31',
      next_action: 'Negotiate scope reduction', next_action_due: '2026-03-15',
      owner_id: adminProfile.id, industry: 'Telco', source: 'Direct Outreach',
      notes: 'Client wants to reduce scope. Propose phased delivery. Budget confirmed.',
      last_updated_at: daysAgo(2),
    },
    {
      name: 'TM One Digital Campus', client_name: 'Telekom Malaysia',
      bucket: 'medium', estimated_value: 40000, probability: 70,
      stage: 'negotiation', expected_close_date: '2026-03-25',
      next_action: 'Send revised commercial proposal', next_action_due: '2026-03-14',
      owner_id: adminProfile.id, industry: 'Telco / Government', source: 'Tender',
      notes: 'SOW signed. Client reviewing commercial terms. Minor changes expected.',
      last_updated_at: daysAgo(1),
    },
    {
      name: 'Sunway XR Retail Experience', client_name: 'Sunway Group',
      bucket: 'small', estimated_value: 24000, probability: 55,
      stage: 'negotiation', expected_close_date: '2026-03-28',
      next_action: 'Get legal sign-off on IP clause', next_action_due: '2026-03-16',
      owner_id: salesProfile.id, industry: 'Property / Retail', source: 'Referral',
      notes: 'All terms agreed except IP ownership clause. Legal reviewing.',
      last_updated_at: daysAgo(7),
    },
    // CLOSED WON
    {
      name: 'Petronas NCSM XR Exhibit', client_name: 'Petronas',
      bucket: 'large', estimated_value: 68000, probability: 100,
      stage: 'closed_won', expected_close_date: '2026-03-01',
      owner_id: adminProfile.id, industry: 'Oil & Gas', source: 'Direct Outreach',
      notes: 'Contract signed Feb 28. Kick-off March 5. Full payment received.',
      last_updated_at: daysAgo(12),
    },
    {
      name: 'Maybank AI Avatar Campaign', client_name: 'Maybank Berhad',
      bucket: 'medium', estimated_value: 37500, probability: 100,
      stage: 'closed_won', expected_close_date: '2026-03-10',
      owner_id: salesProfile.id, industry: 'Banking', source: 'Referral',
      notes: 'PO received. Project in production. Delivery April 2026.',
      last_updated_at: daysAgo(4),
    },
    // CLOSED LOST
    {
      name: 'KLCC Hologram Event', client_name: 'KLCC Holdings',
      bucket: 'large', estimated_value: 62000, probability: 0,
      stage: 'closed_lost', expected_close_date: '2026-02-28',
      owner_id: adminProfile.id, industry: 'Property', source: 'Tender',
      notes: 'Lost to cheaper vendor. Client prioritised cost over quality. Re-engage Q3.',
      last_updated_at: daysAgo(20),
    },
    {
      name: 'MDEC Metaverse Summit', client_name: 'MDEC',
      bucket: 'small', estimated_value: 21000, probability: 0,
      stage: 'closed_lost', expected_close_date: '2026-02-15',
      owner_id: salesProfile.id, industry: 'Government', source: 'Tender',
      notes: 'Budget cut by client. Project postponed to 2027. Keep warm.',
      last_updated_at: daysAgo(25),
    },
  ]).select()

  // Upsert targets for March 2026
  await supabase.from('targets').upsert({
    month: '2026-03-01',
    baseline: 90000, good: 108000, excellent: 130000,
    active_target: 108000,
  }, { onConflict: 'month' })

  // Add subscribers if none
  const { data: existingSubs } = await supabase.from('email_subscribers').select('email')
  const existingEmails = (existingSubs ?? []).map(s => s.email)

  const subsToAdd = [
    { email: adminProfile.email, name: adminProfile.name },
    { email: salesProfile.email, name: salesProfile.name },
  ].filter(s => !existingEmails.includes(s.email))

  if (subsToAdd.length > 0) {
    await supabase.from('email_subscribers').insert(subsToAdd)
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    success: true,
    dealsCreated: deals?.length ?? 0,
    adminId:      adminProfile.id,
    salesId:      salesProfile.id,
  })
}
