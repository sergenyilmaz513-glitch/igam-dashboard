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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-outfit font-bold text-2xl text-white">Mesajlar</h2>
          <p className="text-sm text-white/60 mt-1">Takım sohbeti (gerçek zamanlı)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Gönderen:</span>
          <select
            value={currentUser}
            onChange={e => setCurrentUser(parseInt(e.target.value))}
            className="dark-input pr-8 cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.4)' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
          >
            {team.map(m => (
              <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Area */}
      <div className="glass flex-1 p-4 overflow-y-auto space-y-3 h-[calc(100vh-14rem)]">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-white/60 text-sm">
            Henüz mesaj yok. İlk mesajı gönderin!
          </div>
        )}

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
              {/* Date Separator */}
              {showDate && (
                <div className="flex items-center justify-center my-4">
                  <span className="px-4 py-1.5 bg-white/5 rounded-full text-[11px] text-white/60">{dateStr}</span>
                </div>
              )}

              {/* Message Bubble */}
              <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                {member && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border border-white/10"
                    style={{ background: member.color }}
                  >
                    {member.avatar}
                  </div>
                )}

                {/* Content */}
                <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name (received only) */}
                  {!isMe && member && (
                    <p className="text-[11px] text-white/60 mb-1 px-1">{member.name}</p>
                  )}

                  {/* Bubble */}
                  <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? 'gold-gradient text-white rounded-2xl rounded-br-md'
                      : 'bg-white/5 text-white/80 rounded-2xl rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Timestamp */}
                  <p className={`text-[10px] text-white/40 mt-1 px-1 ${isMe ? 'text-right' : ''}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="flex gap-3 mt-4">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Mesajınızı yazın..."
          className="dark-input flex-1 py-3"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-6 py-3 gold-gradient text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Gönder
        </button>
      </form>
    </div>
  )
}
