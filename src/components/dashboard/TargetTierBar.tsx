import { cn } from '@/lib/utils'
import { formatRM } from '@/lib/utils'
import type { Target } from '@/types/app.types'
import { getTargetTierProgress } from '@/lib/forecasting'

interface TargetTierBarProps {
  closedWon: number
  target:    Target | null
}

export function TargetTierBar({ closedWon, target }: TargetTierBarProps) {
  const progress = getTargetTierProgress(closedWon, target)

  const tiers = [
    { key: 'baseline',  label: 'BASELINE', color: '#8C8C8C', value: target?.baseline  ?? 90000,  pct: progress.toBaseline.pct },
    { key: 'good',      label: 'GOOD',     color: '#2D2DFF', value: target?.good      ?? 108000, pct: progress.toGood.pct },
    { key: 'excellent', label: 'EXCELLENT',color: '#22C55E', value: target?.excellent ?? 130000, pct: progress.toExcellent.pct },
  ]

  return (
    <div className="window-chrome">
      <div className="window-title-bar-blue">
        <span className="window-dot" />
        <span className="window-dot" />
        <span className="window-dot-filled" />
        <span className="label-caps text-white text-[11px] ml-2">TARGET TIERS</span>
        <span className="label-caps text-white/60 text-[10px] ml-auto">
          TIER: {progress.tier.toUpperCase()}
        </span>
      </div>

      <div className="bg-[#111] p-4 flex flex-col gap-4">
        {tiers.map(tier => (
          <div key={tier.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[10px]" style={{ color: tier.color }}>
                {tier.label}
              </span>
              <div className="flex items-center gap-3">
                <span className="label-caps text-[#8C8C8C] text-[10px]">
                  {formatRM(tier.value)}
                </span>
                <span
                  className="label-caps text-[11px] font-semibold w-10 text-right"
                  style={{ color: tier.color }}
                >
                  {tier.pct}%
                </span>
              </div>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width:           `${Math.min(tier.pct, 100)}%`,
                  backgroundColor: tier.color,
                }}
              />
            </div>
          </div>
        ))}

        {/* Current closed won reference */}
        <div className="border-t border-[#222] pt-3 flex items-center justify-between">
          <span className="label-caps text-[#8C8C8C] text-[10px]">CLOSED WON MTD</span>
          <span className="font-display text-white text-lg">{formatRM(closedWon)}</span>
        </div>
      </div>
    </div>
  )
}
