import { formatRM } from '@/lib/utils'
import { STAGES, COLUMN_ORDER } from '@/lib/constants'

interface PipelineSnapshotProps {
  dealsByStage: Record<string, { count: number; value: number; weighted: number }>
}

export function PipelineSnapshot({ dealsByStage }: PipelineSnapshotProps) {
  return (
    <div className="window-chrome">
      <div className="window-title-bar">
        <span className="window-dot" />
        <span className="window-dot" />
        <span className="window-dot-filled" />
        <span className="label-caps text-[#8C8C8C] text-[11px] ml-2">PIPELINE BY STAGE</span>
      </div>

      <div className="bg-[#111]">
        {COLUMN_ORDER.map((stageKey, i) => {
          const stage = STAGES[stageKey]
          const data  = dealsByStage[stageKey] ?? { count: 0, value: 0, weighted: 0 }
          return (
            <div key={stageKey}>
              {i > 0 && <div className="border-t border-[#222]" />}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-6 flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span
                    className="label-caps text-[11px]"
                    style={{ color: stage.color }}
                  >
                    {stage.label}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <span className="label-caps text-[#8C8C8C] text-[9px] block">DEALS</span>
                    <span className="text-white text-sm font-semibold">{data.count}</span>
                  </div>
                  <div>
                    <span className="label-caps text-[#8C8C8C] text-[9px] block">VALUE</span>
                    <span className="text-white text-sm font-semibold">{formatRM(data.value, true)}</span>
                  </div>
                  <div>
                    <span className="label-caps text-[#8C8C8C] text-[9px] block">WEIGHTED</span>
                    <span className="text-[#2D2DFF] text-sm font-semibold">{formatRM(data.weighted, true)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
