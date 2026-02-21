'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Message, TeamMember } from '@/lib/types'
import LoadingSpinner from '@/components/LoadingSpinner'

const CURRENT_USER_ID = 1

export default function Mesajlar() {
  const [messages, setMessages] = useState<Message[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [text, setText] = useState('')
  const [currentUser, setCurrentUser] = useState(CURRENT_USER_ID)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const [m, t] = await Promise.all([
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('team').select('*'),
      ])
      if (m.data) setMessages(m.data)
      if (t.data) setTeam(t.data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function getMember(id: number) {
    return team.find(m => m.id === id)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    await supabase.from('messages').insert([{ sender: currentUser, text: text.trim() }])
    setText('')
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
  }

  let lastDate = ''

  if (loading) return <LoadingSpinner />

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-outfit font-bold text-2xl text-text-primary">Mesajlar</h2>
          <p className="text-sm text-text-secondary mt-1">Takım sohbeti (gerçek zamanlı)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Gönderen:</span>
          <select
            value={currentUser}
            onChange={e => setCurrentUser(parseInt(e.target.value))}
            className="px-3 py-1.5 bg-white/65 rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
          >
            {team.map(m => (
              <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 glass-card p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => {
          const member = getMember(msg.sender)
          const isMe = msg.sender === currentUser
          const dateStr = formatDate(msg.created_at)
          let showDate = false
          if (dateStr !== lastDate) {
            showDate = true
            lastDate = dateStr
          }

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-cream-dark rounded-full text-[10px] text-text-secondary">{dateStr}</span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {member && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: member.color }}>
                    {member.avatar}
                  </div>
                )}
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && member && (
                    <p className="text-[10px] text-text-secondary mb-1 px-1">{member.name}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? 'gold-gradient text-white rounded-br-md'
                      : 'bg-white/80 text-text-primary rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] text-text-secondary mt-1 px-1 ${isMe ? 'text-right' : ''}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-text-secondary text-sm">
            Henüz mesaj yok. İlk mesajı gönderin!
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-3 mt-4">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Mesajınızı yazın..."
          className="flex-1 px-4 py-3 glass-card text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-6 py-3 gold-gradient text-white rounded-2xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Gönder
        </button>
      </form>
    </div>
  )
}
