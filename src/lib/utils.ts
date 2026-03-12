import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRM(value: number, compact = false): string {
  if (compact) {
    if (value >= 1000000) return `RM${(value / 1000000).toFixed(1)}M`
    if (value >= 1000)    return `RM${(value / 1000).toFixed(0)}k`
  }
  return `RM${value.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}

export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

export function getMonthLabel(monthKey: string): string {
  const d = new Date(monthKey + 'T00:00:00')
  return d.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
}

export function getDaysAgo(dateStr: string): number {
  const now  = new Date()
  const then = new Date(dateStr)
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export function isDueSoon(dateStr: string | null | undefined, withinDays = 3): boolean {
  if (!dateStr) return false
  const due  = new Date(dateStr)
  const now  = new Date()
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= withinDays
}
