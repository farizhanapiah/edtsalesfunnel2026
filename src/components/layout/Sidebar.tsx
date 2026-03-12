'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Kanban, CalendarCheck,
  Settings, LogOut, Zap
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',      label: 'DASHBOARD',  icon: LayoutDashboard },
  { href: '/board',          label: 'PIPELINE',   icon: Kanban },
  { href: '/weekly-review',  label: 'WEEKLY',     icon: CalendarCheck },
  { href: '/settings',       label: 'SETTINGS',   icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  return (
    <aside className="w-[220px] min-w-[220px] h-screen bg-[#0A0A0A] border-r border-white
      flex flex-col sticky top-0 overflow-hidden">

      {/* Logo section */}
      <div className="window-title-bar border-b border-white px-4" style={{ height: '56px', minHeight: '56px' }}>
        <span className="window-dot" />
        <span className="window-dot" />
        <span className="window-dot-filled" />
        <div className="ml-3">
          <Image
            src="/images/EDT-lockup-dark.svg"
            alt="EDT"
            width={100}
            height={23}
            priority
          />
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 pt-5 pb-2">
        <span className="label-caps text-[#8C8C8C] text-[10px]">Sales Funnel 2026</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors',
                'label-caps text-[12px] font-medium',
                active
                  ? 'bg-[#2D2DFF] text-white'
                  : 'text-[#8C8C8C] hover:text-white hover:bg-[#111]'
              )}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="border-t border-[#222] mx-4 mb-2" />

      {/* User info + sign out */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        {profile && (
          <div className="window-chrome-grey border border-[#222] p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={10} className="text-[#2D2DFF]" />
              <span className="label-caps text-[#8C8C8C] text-[10px]">{profile.role.toUpperCase()}</span>
            </div>
            <p className="text-white text-xs font-semibold truncate">{profile.name}</p>
            <p className="text-[#8C8C8C] text-[11px] truncate">{profile.email}</p>
          </div>
        )}

        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 text-[#8C8C8C]
            hover:text-red-400 hover:bg-[#111] transition-colors w-full label-caps text-[11px]"
        >
          <LogOut size={12} />
          SIGN OUT
        </button>
      </div>
    </aside>
  )
}
