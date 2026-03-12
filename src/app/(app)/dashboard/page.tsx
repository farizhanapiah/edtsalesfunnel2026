'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { KPICard } from '@/components/dashboard/KPICard'
import { TargetTierBar } from '@/components/dashboard/TargetTierBar'
import { ForecastMeter } from '@/components/dashboard/ForecastMeter'
import { BucketBreakdown } from '@/components/dashboard/BucketBreakdown'
import { PipelineSnapshot } from '@/components/dashboard/PipelineSnapshot'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { useDeals } from '@/hooks/useDeals'
import { useTargets } from '@/hooks/useTargets'
import { calculateForecast } from '@/lib/forecasting'
import { formatRM, getMonthKey } from '@/lib/utils'
import { TrendingUp, Target, DollarSign, Activity } from 'lucide-react'

export default function DashboardPage() {
  const [month, setMonth] = useState(getMonthKey())
  const { deals, loading } = useDeals({ month })
  const { target }         = useTargets(month)
  const forecast           = calculateForecast(deals, target)

  const exportHref = `/api/deals/export?month=${month}`

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="DASHBOARD"
        subtitle={`Pipeline overview · ${month.slice(0, 7)}`}
        showExport
        exportHref={exportHref}
        actions={
          <MonthSelector month={month} onChange={setMonth} />
        }
      />

      <div className="flex-1 p-6 pixel-grid-subtle">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <span className="label-caps text-[#8C8C8C]">LOADING PIPELINE DATA...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-[1400px]">

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="CLOSED WON MTD"
                value={formatRM(forecast.closedWonValue)}
                subtitle={`${forecast.dealsByStage['closed_won']?.count ?? 0} deals`}
                accent="green"
              />
              <KPICard
                title="REMAINING TO TARGET"
                value={forecast.remainingToTarget === 0 ? '✓ HIT' : formatRM(forecast.remainingToTarget)}
                subtitle={`Active target: ${formatRM(forecast.activeTarget)}`}
                accent={forecast.remainingToTarget === 0 ? 'green' : 'amber'}
              />
              <KPICard
                title="WEIGHTED FORECAST"
                value={formatRM(forecast.weightedForecast)}
                subtitle="Active pipeline (value × prob%)"
                accent="blue"
              />
              <KPICard
                title="TOTAL PIPELINE"
                value={formatRM(forecast.totalPipelineValue)}
                subtitle={`${(forecast.dealsByStage['leads']?.count ?? 0) + (forecast.dealsByStage['negotiation']?.count ?? 0)} active deals`}
                accent="grey"
              />
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="WIN RATE"
                value={`${forecast.winRate}%`}
                subtitle="Closed Won / Total Closed"
                accent={forecast.winRate >= 50 ? 'green' : 'amber'}
              />
              <KPICard
                title="TOTAL DEALS"
                value={String(forecast.dealCount)}
                subtitle="All stages this month"
                accent="grey"
              />
              <KPICard
                title="LEADS"
                value={String(forecast.dealsByStage['leads']?.count ?? 0)}
                subtitle={formatRM(forecast.dealsByStage['leads']?.value ?? 0)}
                accent="grey"
              />
              <KPICard
                title="NEGOTIATION"
                value={String(forecast.dealsByStage['negotiation']?.count ?? 0)}
                subtitle={formatRM(forecast.dealsByStage['negotiation']?.value ?? 0)}
                accent="blue"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Forecast meter — 2/3 width */}
              <div className="lg:col-span-2">
                <ForecastMeter forecast={forecast} />
              </div>

              {/* Target tiers — 1/3 width */}
              <div>
                <TargetTierBar closedWon={forecast.closedWonValue} target={target} />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PipelineSnapshot dealsByStage={forecast.dealsByStage} />
              <BucketBreakdown  dealsByBucket={forecast.dealsByBucket} />
            </div>

            {/* Must-Win Deals */}
            {forecast.mustWinDeals.length > 0 && forecast.remainingToTarget > 0 && (
              <div className="window-chrome">
                <div className="window-title-bar" style={{ backgroundColor: '#1a0000', borderColor: '#EF4444' }}>
                  <span className="window-dot" style={{ borderColor: '#EF4444' }} />
                  <span className="window-dot" style={{ borderColor: '#EF4444' }} />
                  <span className="window-dot-filled" style={{ backgroundColor: '#EF4444' }} />
                  <span className="label-caps text-[#EF4444] text-[11px] ml-2">
                    ⚡ MUST-WIN DEALS TO HIT TARGET
                  </span>
                </div>
                <div className="bg-[#0d0000]">
                  {forecast.mustWinDeals.map((deal, i) => (
                    <div
                      key={deal.id}
                      className={`px-4 py-3 flex items-center justify-between ${i > 0 ? 'border-t border-[#1a0000]' : ''}`}
                    >
                      <div>
                        <p className="text-white text-sm font-semibold">{deal.name}</p>
                        <p className="text-[#8C8C8C] text-xs">{deal.client_name}</p>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <span className="label-caps text-[9px] text-[#8C8C8C] block">VALUE</span>
                          <span className="text-white text-sm font-semibold">{formatRM(Number(deal.estimated_value))}</span>
                        </div>
                        <div>
                          <span className="label-caps text-[9px] text-[#8C8C8C] block">PROB</span>
                          <span className="text-[#2D2DFF] text-sm font-semibold">{deal.probability}%</span>
                        </div>
                        <div>
                          <span className="label-caps text-[9px] text-[#8C8C8C] block">STAGE</span>
                          <span className="text-white text-xs uppercase">{deal.stage.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
