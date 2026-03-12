'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRM, getMonthKey, getDaysAgo } from '@/lib/utils'
import { STALE_DEAL_DAYS, ACTIVE_STAGES } from '@/lib/constants'
import type { Deal, Target } from '@/types/app.types'

interface Message {
  role:    'user' | 'assistant'
  content: string
}

export function AIAssistant() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function buildContext() {
    const supabase    = createClient()
    const currentMonth = getMonthKey()

    const [{ data: deals }, { data: target }] = await Promise.all([
      supabase.from('deals').select('*, owner:profiles(name)'),
      supabase.from('targets').select('*').eq('month', currentMonth).single(),
    ])

    const d = (deals ?? []) as Deal[]

    const activeDeals = d.filter(x =>
      ACTIVE_STAGES.includes(x.stage as typeof ACTIVE_STAGES[number])
    )
    const wonDeals    = d.filter(x => x.stage === 'closed_won')
    const lostDeals   = d.filter(x => x.stage === 'closed_lost')
    const staleDeals  = activeDeals.filter(x =>
      getDaysAgo(x.last_updated_at) >= STALE_DEAL_DAYS
    )

    const weightedForecast = activeDeals.reduce(
      (sum, x) => sum + (Number(x.estimated_value) * x.probability / 100), 0
    )
    const closedWonValue = wonDeals.reduce((s, x) => s + Number(x.estimated_value), 0)

    const t = target as Target | null
    const activeTarget = t?.active_target ?? t?.baseline ?? 90000

    return {
      currentMonth,
      summary: {
        totalActiveDeals:  activeDeals.length,
        closedWonCount:    wonDeals.length,
        closedLostCount:   lostDeals.length,
        closedWonValue:    formatRM(closedWonValue),
        weightedForecast:  formatRM(weightedForecast),
        monthlyTarget:     formatRM(activeTarget),
        remainingToTarget: formatRM(Math.max(0, activeTarget - closedWonValue)),
        staleDealsCount:   staleDeals.length,
      },
      staleDeals: staleDeals.slice(0, 5).map(x => ({
        name:          x.name,
        client:        x.client_name,
        stage:         x.stage,
        daysSinceUpdate: getDaysAgo(x.last_updated_at),
        value:         formatRM(Number(x.estimated_value), true),
      })),
      topDeals: activeDeals
        .sort((a, b) =>
          (Number(b.estimated_value) * b.probability) -
          (Number(a.estimated_value) * a.probability)
        )
        .slice(0, 5)
        .map(x => ({
          name:        x.name,
          client:      x.client_name,
          stage:       x.stage,
          value:       formatRM(Number(x.estimated_value), true),
          probability: `${x.probability}%`,
          weighted:    formatRM(Number(x.estimated_value) * x.probability / 100, true),
          closeDate:   x.expected_close_date ?? 'Not set',
          owner:       (x as unknown as { owner?: { name: string } }).owner?.name ?? '—',
        })),
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    const context = await buildContext()

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: newMessages,
        context,
      }),
    })

    if (!res.ok || !res.body) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not reach AI. Check your API key.' }])
      setLoading(false)
      return
    }

    // Stream SSE response
    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let assistantMsg = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') break

        try {
          const { text } = JSON.parse(data)
          assistantMsg += text
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: assistantMsg }
            return updated
          })
        } catch {}
      }
    }
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function renderMessage(content: string) {
    const lines = content.split('\n')
    const elements = []
    let i = 0

    const fmt = (text: string) => text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#1a1a1a;padding:1px 4px;font-size:11px;border-radius:2px">$1</code>')

    while (i < lines.length) {
      const line = lines[i]

      // Table block
      if (line.startsWith('|')) {
        const tableLines: string[] = []
        while (i < lines.length && lines[i].startsWith('|')) {
          tableLines.push(lines[i])
          i++
        }
        const isSep = (l: string) => /^\|[\s\-:|]+\|$/.test(l.trim()) && !/[a-zA-Z0-9]/.test(l)
        const parseRow = (row: string) =>
          row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim())
        const header = tableLines[0]
        const dataRows = tableLines.slice(1).filter(l => !isSep(l))
        elements.push(
          <table key={`t${i}`} className="w-full text-xs border-collapse my-1.5">
            <thead>
              <tr>{parseRow(header).map((cell, j) => (
                <th key={j} className="text-left px-2 py-1 border-b border-[#333] text-[#8C8C8C] font-medium whitespace-nowrap"
                  dangerouslySetInnerHTML={{ __html: fmt(cell) }} />
              ))}</tr>
            </thead>
            <tbody>{dataRows.map((row, j) => (
              <tr key={j} style={{ background: j % 2 === 1 ? '#0f0f0f' : 'transparent' }}>
                {parseRow(row).map((cell, k) => (
                  <td key={k} className="px-2 py-1 border-b border-[#1a1a1a]"
                    dangerouslySetInnerHTML={{ __html: fmt(cell) }} />
                ))}
              </tr>
            ))}</tbody>
          </table>
        )
        continue
      }

      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        elements.push(<hr key={`hr${i}`} className="border-[#2a2a2a] my-2" />)
        i++; continue
      }

      // Headers
      const hm = line.match(/^(#{1,3}) (.+)/)
      if (hm) {
        const cls = hm[1].length === 1
          ? 'text-sm font-bold text-white mt-2 mb-1'
          : hm[1].length === 2
          ? 'text-sm font-semibold text-white mt-1.5 mb-0.5'
          : 'text-xs font-semibold text-[#8C8C8C] uppercase tracking-wide mt-1.5 mb-0.5'
        elements.push(
          <p key={`h${i}`} className={cls} dangerouslySetInnerHTML={{ __html: fmt(hm[2]) }} />
        )
        i++; continue
      }

      // Bullet list
      if (/^[-*] /.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^[-*] /.test(lines[i])) {
          items.push(lines[i].replace(/^[-*] /, ''))
          i++
        }
        elements.push(
          <ul key={`ul${i}`} className="text-sm pl-4 my-1 space-y-0.5 list-disc list-outside">
            {items.map((item, j) => (
              <li key={j} dangerouslySetInnerHTML={{ __html: fmt(item) }} />
            ))}
          </ul>
        )
        continue
      }

      // Numbered list
      if (/^\d+\. /.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\. /, ''))
          i++
        }
        elements.push(
          <ol key={`ol${i}`} className="text-sm pl-4 my-1 space-y-0.5 list-decimal list-outside">
            {items.map((item, j) => (
              <li key={j} dangerouslySetInnerHTML={{ __html: fmt(item) }} />
            ))}
          </ol>
        )
        continue
      }

      // Empty line
      if (line.trim() === '') {
        elements.push(<div key={`sp${i}`} className="h-1.5" />)
        i++; continue
      }

      // Regular paragraph
      elements.push(
        <p key={`p${i}`} className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: fmt(line) }} />
      )
      i++
    }

    return elements
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#2D2DFF] hover:bg-[#0000CC]
          flex items-center justify-center transition-colors"
        style={{ borderRadius: '50%' }}
        title="AI Sales Advisor"
      >
        {open ? <X size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 window-chrome flex flex-col"
          style={{ width: '400px', height: '520px' }}
        >
          {/* Title bar */}
          <div className="window-title-bar-blue flex-shrink-0">
            <span className="window-dot" />
            <span className="window-dot" />
            <span className="window-dot-filled" />
            <Zap size={11} className="text-white ml-2" />
            <span className="label-caps text-white text-[11px] ml-1.5">AI.ASSISTANT.EXE</span>
            <span className="label-caps text-white/50 text-[10px] ml-auto">claude-sonnet-4-6</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 bg-[#0A0A0A] flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex flex-col gap-3 py-4">
                <p className="text-[#8C8C8C] text-xs text-center label-caps">
                  EDT SALES AI — ASK ME ABOUT YOUR PIPELINE
                </p>
                {[
                  'Which deals should I close this week?',
                  'Analyse my pipeline health',
                  'How do I approach the Axiata deal?',
                  'What marketing can generate more leads?',
                ].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); }}
                    className="text-left border border-[#222] hover:border-[#2D2DFF] px-3 py-2
                      text-[#8C8C8C] hover:text-white text-xs transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="label-caps text-[#8C8C8C] text-[9px]">
                  {msg.role === 'user' ? 'YOU' : 'EDT AI →'}
                </span>
                <div
                  className="max-w-[90%] px-3 py-2.5 text-sm leading-relaxed"
                  style={{
                    backgroundColor: msg.role === 'user' ? '#2D2DFF' : '#111',
                    color:           '#fff',
                    border:          msg.role === 'user' ? 'none' : '1px solid #222',
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    {renderMessage(msg.content)}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-[#8C8C8C]">
                <Loader2 size={12} className="animate-spin" />
                <span className="label-caps text-[10px]">ANALYSING PIPELINE...</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-[#222] flex">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about deals, strategy, next steps..."
              rows={2}
              className="flex-1 bg-[#0A0A0A] text-white text-sm px-3 py-2.5
                placeholder:text-[#444] resize-none outline-none border-0"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="px-4 bg-[#2D2DFF] text-white hover:bg-[#0000CC]
                transition-colors disabled:opacity-40 border-l border-[#333] self-stretch"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
