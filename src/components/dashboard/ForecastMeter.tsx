import { formatRM } from '@/lib/utils'
import type { ForecastData } from '@/types/app.types'

interface ForecastMeterProps {
  forecast: ForecastData
}

export function ForecastMeter({ forecast }: ForecastMeterProps) {
  const {
    closedWonValue, weightedForecast, activeTarget,
    targetProgress, forecastProgress, remainingToTarget
  } = forecast

  const forecastTotal = closedWonValue + weightedForecast

  return (
    <div className="window-chrome">
      <div className="window-title-bar">
        <span className="window-dot" />
        <span className="window-dot" />
        <span className="window-dot-filled" />
        <span className="label-caps text-[#8C8C8C] text-[11px] ml-2">FORECAST METER</span>
      </div>

      <div className="bg-[#111] p-4 flex flex-col gap-4">
        {/* Target bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="label-caps text-[#8C8C8C] text-[10px]">CLOSED WON / TARGET</span>
            <span className="label-caps text-white text-[11px]">{targetProgress}%</span>
          </div>
          <div className="progress-track h-3">
            <div
              className="progress-fill h-full bg-[#22C55E]"
              style={{ width: `${Math.min(targetProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="label-caps text-[10px] text-[#22C55E]">{formatRM(closedWonValue)}</span>
            <span className="label-caps text-[10px] text-[#8C8C8C]">{formatRM(activeTarget)}</span>
          </div>
        </div>

        {/* Forecast bar (closed + weighted) */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="label-caps text-[#8C8C8C] text-[10px]">FORECAST (WON + WEIGHTED)</span>
            <span className="label-caps text-[#2D2DFF] text-[11px]">{forecastProgress}%</span>
          </div>
          <div className="progress-track h-3 relative">
            {/* Closed won segment */}
            <div
              className="progress-fill h-full bg-[#22C55E] absolute left-0 top-0"
              style={{ width: `${Math.min(targetProgress, 100)}%` }}
            />
            {/* Weighted forecast segment */}
            <div
              className="progress-fill h-full bg-[#2D2DFF] absolute top-0"
              style={{
                left:  `${Math.min(targetProgress, 100)}%`,
                width: `${Math.min(forecastProgress - targetProgress, 100 - Math.min(targetProgress, 100))}%`,
                opacity: 0.7,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="label-caps text-[10px] text-[#2D2DFF]">{formatRM(forecastTotal)}</span>
            <span className="label-caps text-[10px] text-[#8C8C8C]">REMAINING: {formatRM(remainingToTarget)}</span>
          </div>
        </div>

        {/* Weighted forecast detail */}
        <div className="border-t border-[#222] pt-3 grid grid-cols-2 gap-3">
          <div>
            <span className="label-caps text-[#8C8C8C] text-[10px] block mb-0.5">WEIGHTED PIPELINE</span>
            <span className="font-display text-[#2D2DFF] text-xl">{formatRM(weightedForecast)}</span>
          </div>
          <div>
            <span className="label-caps text-[#8C8C8C] text-[10px] block mb-0.5">TO TARGET</span>
            <span className={`font-display text-xl ${remainingToTarget === 0 ? 'text-[#22C55E]' : 'text-white'}`}>
              {remainingToTarget === 0 ? '✓ HIT' : formatRM(remainingToTarget)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
