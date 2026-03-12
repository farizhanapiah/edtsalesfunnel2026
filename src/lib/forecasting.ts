import type { Deal, ForecastData, Target } from '@/types/app.types'
import { ACTIVE_STAGES, STALE_DEAL_DAYS } from './constants'
import { getDaysAgo } from './utils'

export function calculateForecast(deals: Deal[], target: Target | null): ForecastData {
  const activeTarget = target?.active_target ?? target?.baseline ?? 90000

  const data: ForecastData = {
    totalPipelineValue: 0,
    weightedForecast:   0,
    closedWonValue:     0,
    closedLostValue:    0,
    winRate:            0,
    dealCount:          deals.length,
    dealsByStage:       {},
    dealsByBucket:      {},
    remainingToTarget:  0,
    targetProgress:     0,
    forecastProgress:   0,
    activeTarget,
    mustWinDeals:       [],
  }

  for (const deal of deals) {
    const value    = Number(deal.estimated_value)
    const weighted = value * (deal.probability / 100)

    // By stage
    if (!data.dealsByStage[deal.stage]) {
      data.dealsByStage[deal.stage] = { count: 0, value: 0, weighted: 0 }
    }
    data.dealsByStage[deal.stage].count++
    data.dealsByStage[deal.stage].value    += value
    data.dealsByStage[deal.stage].weighted += weighted

    // By bucket
    if (!data.dealsByBucket[deal.bucket]) {
      data.dealsByBucket[deal.bucket] = { count: 0, value: 0 }
    }
    data.dealsByBucket[deal.bucket].count++
    data.dealsByBucket[deal.bucket].value += value

    // Totals
    if (ACTIVE_STAGES.includes(deal.stage as typeof ACTIVE_STAGES[number])) {
      data.totalPipelineValue += value
      data.weightedForecast   += weighted
    }
    if (deal.stage === 'closed_won')  data.closedWonValue  += value
    if (deal.stage === 'closed_lost') data.closedLostValue += value
  }

  // Win rate
  const closedTotal = data.closedWonValue + data.closedLostValue
  data.winRate = closedTotal > 0
    ? Math.round((data.closedWonValue / closedTotal) * 100)
    : 0

  // Target progress
  data.remainingToTarget = Math.max(0, activeTarget - data.closedWonValue)
  data.targetProgress    = activeTarget > 0
    ? Math.min(Math.round((data.closedWonValue / activeTarget) * 100), 150)
    : 0

  // Forecast progress (closed won + weighted pipeline)
  const totalWithForecast = data.closedWonValue + data.weightedForecast
  data.forecastProgress = activeTarget > 0
    ? Math.min(Math.round((totalWithForecast / activeTarget) * 100), 150)
    : 0

  // Must-win deals: sorted by weighted value, enough to fill the gap
  let gap = data.remainingToTarget
  const mustWin: Deal[] = []
  const activeDeals = deals
    .filter(d => ACTIVE_STAGES.includes(d.stage as typeof ACTIVE_STAGES[number]))
    .sort((a, b) => {
      const wa = Number(a.estimated_value) * (a.probability / 100)
      const wb = Number(b.estimated_value) * (b.probability / 100)
      return wb - wa
    })

  for (const deal of activeDeals) {
    if (gap <= 0) break
    mustWin.push(deal)
    gap -= Number(deal.estimated_value)
  }
  data.mustWinDeals = mustWin

  return data
}

export function getTargetTierProgress(closedWon: number, target: Target | null) {
  const b = target?.baseline  ?? 90000
  const g = target?.good      ?? 108000
  const e = target?.excellent ?? 130000

  return {
    toBaseline:  { pct: Math.min(Math.round((closedWon / b) * 100), 100), value: b },
    toGood:      { pct: Math.min(Math.round((closedWon / g) * 100), 100), value: g },
    toExcellent: { pct: Math.min(Math.round((closedWon / e) * 100), 100), value: e },
    tier: closedWon >= e ? 'excellent' : closedWon >= g ? 'good' : closedWon >= b ? 'baseline' : 'below',
  } as const
}

export function getStaleDeals(deals: Deal[]): Deal[] {
  return deals.filter(d =>
    ACTIVE_STAGES.includes(d.stage as typeof ACTIVE_STAGES[number]) &&
    getDaysAgo(d.last_updated_at) >= STALE_DEAL_DAYS
  )
}
