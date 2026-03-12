'use client'

import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DealNote, Profile } from '@/types/app.types'

interface DealNotesProps {
  dealId: string
}

export function DealNotes({ dealId }: DealNotesProps) {
  const [notes, setNotes]     = useState<DealNote[]>([])
  const [content, setContent] = useState('')
  const [me, setMe]           = useState<Profile | null>(null)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setMe(profile)

      const { data } = await supabase
        .from('deal_notes')
        .select('*, author:profiles(id, name, email, role)')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })

      setNotes((data as DealNote[]) ?? [])
    }
    load()
  }, [dealId])

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || !me) return
    setSaving(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('deal_notes')
      .insert({ deal_id: dealId, content: content.trim(), author_id: me.id })
      .select('*, author:profiles(id, name, email, role)')
      .single()

    if (data) {
      setNotes(prev => [data as DealNote, ...prev])
      setContent('')
    }
    setSaving(false)
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString('en-MY', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Add note form */}
      <form onSubmit={addNote} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Add a note, meeting log, update..."
          className="flex-1 bg-[#111] border border-[#333] text-white px-3 py-2 text-sm
            placeholder:text-[#444] focus:border-[#2D2DFF] transition-colors"
        />
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="bg-[#2D2DFF] text-white px-3 py-2 hover:bg-[#0000CC] transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={14} />
        </button>
      </form>

      {/* Notes thread */}
      {notes.length === 0 ? (
        <p className="text-[#8C8C8C] text-xs label-caps py-4 text-center">NO NOTES YET</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map(note => (
            <div key={note.id} className="border-l-2 border-[#2D2DFF] pl-3 py-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-xs font-semibold">
                  {note.author?.name ?? 'Unknown'}
                </span>
                <span className="label-caps text-[#8C8C8C] text-[10px]">
                  {formatTime(note.created_at)}
                </span>
              </div>
              <p className="text-[#ccc] text-sm leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
