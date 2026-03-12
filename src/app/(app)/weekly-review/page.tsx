'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { WindowPanel } from '@/components/ui/WindowPanel'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { BucketBadge, StageBadge } from '@/components/ui/Badge'
import { useDeals } from '@/hooks/useDeals'
import { useTargets } from '@/hooks/useTargets'
import { calculateForecast, getStaleDeals } from '@/lib/forecasting'
import { formatRM, formatDate, getMonthKey, isOverdue, getDaysAgo } from '@/lib/utils'
import { AlertCircle, CalendarX, TrendingUp, Target } from 'lucide-react'

export default function WeeklyReviewPage() {
  const [month, setMonth] = useState(getMonthKey())
  const { deals, loading } = useDeals({ month })
  const { target }         = useTargets(month)
  const forecast           = calculateForecast(deals, target)
  const staleDeals         = getStaleDeals(deals)

  // Closing this month — active deals with expected_close_date in selected month
  const closingThisMonth = deals.filter(d =>
    ['leads', 'negotiation'].includes(d.stage) &&
    d.expected_close_date &&
    d.expected_close_date.startsWith(month.slice(0, 7))
  ).sort((a, b) => Number(b.estimated_value) - Number(a.estimated_value))

  // Next actions due this week
  const now   = new Date()
  const week7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const actionsThisWeek = deals
    .filter(d => d.next_action_due && new Date(d.next_action_due) <= week7)
    .sort((a, b) => (a.next_action_due! > b.next_action_due! ? 1 : -1))

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="WEEKLY REVIEW"
        subtitle="Meeting-optimised pipeline view"
        showExport
        exportHref={`/api/deals/export?month=${month}`}
        actions={<MonthSelector month={month} onChange={setMonth} />}
      />

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <span className="label-caps text-[#8C8C8C]">LOADING...</span>
        </div>
      ) : (
        <div className="p-6 flex flex-col gap-6 max-w-[1400px]">

          {/* Summary strip */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'CLOSED WON',    value: formatRM(forecast.closedWonValue, true),   color: '#22C55E' },
              { label: 'TO TARGET',     value: forecast.remainingToTarget === 0 ? '✓ HIT' : formatRM(forecast.remainingToTarget, true), color: '#F59E0B' },
              { label: 'WEIGHTED FCST', value: formatRM(forecast.weightedForecast, true),  color: '#2D2DFF' },
              { label: 'WIN RATE',      value: `${forecast.winRate}%`,                     color: '#8C8C8C' },
              { label: 'STALE DEALS',   value: String(staleDeals.length),                  color: staleDeals.length > 0 ? '#EF4444' : '#8C8C8C' },
            ].map(({ label, value, color }) => (
              <div key={label} className="window-chrome bg-[#111] p-3">
                <span className="label-caps text-[#8C8C8C] text-[10px] block mb-1">{label}</span>
                <span className="font-display text-xl" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Must win / Closing this month */}
            <WindowPanel title="CLOSING THIS MONTH" accent="blue" noPadding>
              {closingThisMonth.length === 0 ? (
                <div className="p-6 text-center">
                  <span className="label-caps text-[#8C8C8C] text-[11px]">NO ACTIVE DEALS CLOSING THIS MONTH</span>
                </div>
              ) : (
                <div>
                  {closingThisMonth.map((deal, i) => {
                    const isMustWin = forecast.mustWinDeals.some(d => d.id === deal.id)
                    return (
                      <div key={deal.id}>
                        {i > 0 && <div className="border-t border-[#222]" />}
                        <div
                          className="p-4 flex items-start justify-between gap-4"
                          style={isMustWin ? { backgroundColor: '#0d0a00' } : {}}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {isMustWin && (
                                <span className="panel-label border border-[#F59E0B] text-[#F59E0B]" style={{ fontSize: '9px' }}>
                                  ⚡ MUST WIN
                                </span>
                              )}
                              <BucketBadge bucket={deal.bucket} />
                              <StageBadge  stage={deal.stage} />
                            </div>
                            <Link
                              href={`/deals/${deal.id}`}
                              className="text-white text-sm font-semibold hover:text-[#2D2DFF] transition-colors leading-tight block truncate"
                            >
                              {deal.name}
                            </Link>
                            <p className="text-[#8C8C8C] text-xs">{deal.client_name}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-display text-white text-base block">
                              {formatRM(Number(deal.estimated_value), true)}
                            </span>
                            <span className="label-caps text-[#2D2DFF] text-[11px]">{deal.probability}%</span>
                            {deal.expected_close_date && (
                              <span className="label-caps text-[#8C8C8C] text-[10px] block">
                                {formatDate(deal.expected_close_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </WindowPanel>

            {/* Actions due this week */}
            <WindowPanel title="ACTIONS DUE THIS WEEK" accent="black" noPadding>
              {actionsThisWeek.length === 0 ? (
                <div className="p-6 text-center">
                  <span className="label-caps text-[#8C8C8C] text-[11px]">NO ACTIONS DUE THIS WEEK</span>
                </div>
              ) : (
                <div>
                  {actionsThisWeek.map((deal, i) => {
                    const overdue = isOverdue(deal.next_action_due)
                    return (
                      <div key={deal.id}>
                        {i > 0 && <div className="border-t border-[#222]" />}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-1">
                            <Link
                              href={`/deals/${deal.id}`}
                              className="text-white text-sm font-semibold hover:text-[#2D2DFF] transition-colors truncate"
                            >
                              {deal.name}
                            </Link>
                            <span
                              className="label-caps text-[11px] flex-shrink-0 ml-2"
                              style={{ color: overdue ? '#EF4444' : '#F59E0B' }}
                            >
                              {overdue ? '⚠ OVERDUE' : formatDate(deal.next_action_due)}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CalendarX size={12} className="text-[#2D2DFF] flex-shrink-0 mt-0.5" />
                            <p className="text-[#8C8C8C] text-xs">{deal.next_action ?? '—'}</p>
                          </div>
                          <p className="label-caps text-[#8C8C8C] text-[10px] mt-1">{deal.client_name}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </WindowPanel>
          </div>

          {/* Stale deals */}
          {staleDeals.length > 0 && (
            <div className="window-chrome border-[#F59E0B]">
              <div className="window-title-bar" style={{ backgroundColor: '#1a0e00', borderColor: '#F59E0B' }}>
                <span className="window-dot" style={{ borderColor: '#F59E0B' }} />
                <span className="window-dot" style={{ borderColor: '#F59E0B' }} />
                <span className="window-dot-filled" style={{ backgroundColor: '#F59E0B' }} />
                <span className="label-caps text-[#F59E0B] text-[11px] ml-2">
                  ⚠ STALE DEALS — {staleDeals.length} DEAL{staleDeals.length !== 1 ? 'S' : ''} WITHOUT UPDATE IN 14+ DAYS
                </span>
              </div>
              <div className="bg-[#0d0800]">
                {staleDeals.map((deal, i) => (
                  <div key={deal.id}>
                    {i > 0 && <div className="border-t border-[#1a1000]" />}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <Link
                          href={`/deals/${deal.id}`}
                          className="text-white text-sm font-semibold hover:text-[#2D2DFF] transition-colors"
                        >
                          {deal.name}
                        </Link>
                        <p className="label-caps text-[#8C8C8C] text-[10px]">{deal.client_name}</p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="label-caps text-[9px] text-[#8C8C8C] block">LAST UPDATE</span>
                          <span className="text-[#F59E0B] text-xs font-semibold">
                            {getDaysAgo(deal.last_updated_at)}d AGO
                          </span>
                        </div>
                        <div>
                          <span className="label-caps text-[9px] text-[#8C8C8C] block">STAGE</span>
                          <span className="text-white text-xs uppercase">{deal.stage.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="label-caps text-[9px] text-[#8C8C8C] block">VALUE</span>
                          <span className="text-white text-xs">{formatRM(Number(deal.estimated_value), true)}</span>
                        </div>
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
  )
}
