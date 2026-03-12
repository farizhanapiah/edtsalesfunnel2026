'use client'

import { Download } from 'lucide-react'

interface TopbarProps {
  title:       string
  subtitle?:   string
  actions?:    React.ReactNode
  showExport?: boolean
  exportHref?: string
}

export function Topbar({ title, subtitle, actions, showExport, exportHref }: TopbarProps) {
  return (
    <div className="h-14 min-h-14 bg-[#0A0A0A] border-b border-white flex items-center
      justify-between px-6 sticky top-0 z-20">
      {/* Left: title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-display text-white text-lg leading-none tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="label-caps text-[#8C8C8C] text-[10px] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {actions}
        {showExport && exportHref && (
          <a
            href={exportHref}
            download
            className="flex items-center gap-2 border border-[#333] text-[#8C8C8C]
              hover:border-white hover:text-white transition-colors px-3 py-2
              label-caps text-[11px]"
          >
            <Download size={12} />
            EXPORT CSV
          </a>
        )}
      </div>
    </div>
  )
}
