import type { StageKey, BucketKey, RoleKey } from '@/lib/constants'

export interface Profile {
  id:         string
  name:       string
  email:      string
  role:       RoleKey
  created_at: string
}

export interface Deal {
  id:                  string
  name:                string
  client_name:         string
  bucket:              BucketKey
  estimated_value:     number
  probability:         number
  stage:               StageKey
  expected_close_date: string | null
  month_attribution:   string
  next_action:         string | null
  next_action_due:     string | null
  owner_id:            string
  notes:               string | null
  tags:                string[]
  industry:            string | null
  source:              string | null
  last_updated_at:     string
  created_at:          string
  // Joined
  owner?:              Profile
}

export interface DealNote {
  id:         string
  deal_id:    string
  content:    string
  author_id:  string
  created_at: string
  author?:    Profile
}

export interface Target {
  id:            string
  month:         string
  baseline:      number
  good:          number
  excellent:     number
  active_target: number | null
  created_at:    string
}

export interface EmailSubscriber {
  id:         string
  email:      string
  name:       string
  is_active:  boolean
  created_at: string
}

export interface FilterState {
  month:           string   // 'YYYY-MM-01'
  owner_id:        string   // '' = all
  bucket:          string   // '' = all | 'small' | 'medium' | 'large'
  stage:           string   // '' = all | stage key
  prob_min:        number   // 0
  prob_max:        number   // 100
  keyword:         string   // '' = none
}

export interface ForecastData {
  totalPipelineValue:  number
  weightedForecast:    number
  closedWonValue:      number
  closedLostValue:     number
  winRate:             number
  dealCount:           number
  dealsByStage:        Record<string, { count: number; value: number; weighted: number }>
  dealsByBucket:       Record<string, { count: number; value: number }>
  remainingToTarget:   number
  targetProgress:      number
  forecastProgress:    number
  activeTarget:        number
  mustWinDeals:        Deal[]
}

export interface DashboardData {
  forecast:   ForecastData
  target:     Target | null
  deals:      Deal[]
  staleDeals: Deal[]
}
