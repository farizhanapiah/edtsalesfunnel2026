'use client'

import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { WindowPanel } from '@/components/ui/WindowPanel'
import { DealForm } from '@/components/deals/DealForm'
import type { Deal } from '@/types/app.types'

export default function NewDealPage() {
  const router = useRouter()

  function handleSaved(deal: Deal) {
    router.push(`/deals/${deal.id}`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="NEW DEAL" subtitle="Create a new pipeline deal" />
      <div className="p-6 max-w-3xl">
        <WindowPanel title="DEAL.NEW.EXE" accent="blue">
          <DealForm onSaved={handleSaved} onCancel={() => router.back()} />
        </WindowPanel>
      </div>
    </div>
  )
}
