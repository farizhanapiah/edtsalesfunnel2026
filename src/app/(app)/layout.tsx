import { Sidebar } from '@/components/layout/Sidebar'
import { AIAssistant } from '@/components/ai/AIAssistant'

// All app pages are auth-gated and need live data — never statically pre-render
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <AIAssistant />
    </div>
  )
}
