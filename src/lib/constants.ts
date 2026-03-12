export type StageKey  = 'leads' | 'negotiation' | 'closed_won' | 'closed_lost'
export type BucketKey = 'small' | 'medium' | 'large'
export type RoleKey   = 'admin' | 'sales'

export const STAGES: Record<StageKey, { label: string; color: string; bgColor: string; order: number }> = {
  leads:       { label: 'LEADS',       color: '#8C8C8C', bgColor: '#1a1a1a', order: 0 },
  negotiation: { label: 'NEGOTIATION', color: '#2D2DFF', bgColor: '#0d0d2b', order: 1 },
  closed_won:  { label: 'CLOSED WON',  color: '#22C55E', bgColor: '#0d1f0d', order: 2 },
  closed_lost: { label: 'CLOSED LOST', color: '#EF4444', bgColor: '#1f0d0d', order: 3 },
}

export const BUCKETS: Record<BucketKey, { label: string; range: string; color: string; textColor: string; min: number; max: number }> = {
  small:  { label: 'SMALL',  range: 'RM20–25k', color: '#22C55E', textColor: '#000', min: 20000, max: 25000 },
  medium: { label: 'MEDIUM', range: 'RM35–40k', color: '#F59E0B', textColor: '#000', min: 35000, max: 40000 },
  large:  { label: 'LARGE',  range: 'RM60–70k', color: '#A855F7', textColor: '#fff', min: 60000, max: 70000 },
}

export const COLUMN_ORDER: StageKey[] = ['leads', 'negotiation', 'closed_won', 'closed_lost']

export const STAGE_PROBABILITY_DEFAULTS: Record<StageKey, number> = {
  leads:       20,
  negotiation: 60,
  closed_won:  100,
  closed_lost: 0,
}

export const STALE_DEAL_DAYS = 14

export const TARGET_DEFAULTS = {
  baseline:  90000,
  good:      108000,
  excellent: 130000,
} as const

export const ACTIVE_STAGES: StageKey[] = ['leads', 'negotiation']

export const INDUSTRY_OPTIONS = [
  'Telco', 'Banking', 'Property / Retail', 'Oil & Gas',
  'Government', 'Tech / Super App', 'FMCG', 'Healthcare',
  'Education', 'Automotive', 'Media & Entertainment', 'Other',
]

export const SOURCE_OPTIONS = [
  'Referral', 'Direct Outreach', 'Inbound', 'LinkedIn',
  'Tender / RFP', 'Event', 'Repeat Client', 'Other',
]
