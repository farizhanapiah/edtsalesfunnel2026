import { formatRM } from '@/lib/utils'
import { BUCKETS, type BucketKey } from '@/lib/constants'

interface BucketBreakdownProps {
  dealsByBucket: Record<string, { count: number; value: number }>
}

export function BucketBreakdown({ dealsByBucket }: BucketBreakdownProps) {
  const buckets = (['small', 'medium', 'large'] as BucketKey[]).map(key => ({
    key,
    ...BUCKETS[key],
    count: dealsByBucket[key]?.count ?? 0,
    value: dealsByBucket[key]?.value ?? 0,
  }))

  const totalValue = buckets.reduce((s, b) => s + b.value, 0)

  return (
    <div className="window-chrome">
      <div className="window-title-bar">
        <span className="window-dot" />
        <span className="window-dot" />
        <span className="window-dot-filled" />
        <span className="label-caps text-[#8C8C8C] text-[11px] ml-2">MIX BY BUCKET</span>
      </div>

      <div className="bg-[#111]">
        {buckets.map((bucket, i) => {
          const pct = totalValue > 0 ? Math.round((bucket.value / totalValue) * 100) : 0
          return (
            <div key={bucket.key}>
              {i > 0 && <div className="border-t border-[#222]" />}
              <div className="p-4 flex items-center gap-4">
                {/* Colour indicator */}
                <div
                  className="w-2 h-10 flex-shrink-0"
                  style={{ backgroundColor: bucket.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="label-caps text-[11px] font-semibold"
                        style={{ color: bucket.color }}
                      >
                        {bucket.label}
                      </span>
                      <span className="label-caps text-[#8C8C8C] text-[10px]">{bucket.range}</span>
                    </div>
                    <span className="label-caps text-white text-[11px]">
                      {bucket.count} deal{bucket.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="progress-track flex-1 h-1.5">
                      <div
                        className="progress-fill h-full"
                        style={{ width: `${pct}%`, backgroundColor: bucket.color }}
                      />
                    </div>
                    <span className="label-caps text-[#8C8C8C] text-[10px] w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                  <span className="label-caps text-[#8C8C8C] text-[10px] mt-0.5 block">
                    {formatRM(bucket.value)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
