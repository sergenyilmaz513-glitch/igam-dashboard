'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember, Event, Task } from '@/lib/types'

export default function Header() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [now, setNow] = useState(new Date())
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function load() {
      const [t, e, tk] = await Promise.all([
        supabase.from('team').select('*'),
        supabase.from('events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date').limit(5),
        supabase.from('tasks').select('*').neq('status', 'done').order('due_date').limit(5),
      ])
      if (t.data) setTeam(t.data)
      if (e.data) setEvents(e.data)
      if (tk.data) setTasks(tk.data)
    }
    load()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function daysUntil(dateStr: string) {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Bugün'
    if (diff === 1) return 'Yarın'
    if (diff < 0) return `${Math.abs(diff)} gün geçti`
    return `${diff} gün`
  }

  const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const notifCount = events.length + tasks.length

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <span className="text-sm text-white/40">{dateStr} · {timeStr}</span>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {team.slice(0, 4).map((m) => (
            <div key={m.id} className="w-8 h-8 rounded-full border-2 border-dark flex items-center justify-center text-sm" style={{ background: m.color }}>
              {m.avatar}
            </div>
          ))}
        </div>
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <span className="text-base">🔔</span>
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-status-urgent text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {notifCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 glass-strong shadow-2xl p-4 z-50">
              <h3 className="font-outfit font-semibold text-sm mb-3 text-white">Bildirimler</h3>
              {events.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Yaklaşan Etkinlikler</p>
                  {events.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: ev.color || '#C9A84C' }} />
                        <span className="text-xs text-white/80">{ev.title}</span>
                      </div>
                      <span className="text-[10px] text-gold font-medium">{daysUntil(ev.event_date)}</span>
                    </div>
                  ))}
                </div>
              )}
              {tasks.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Bekleyen Görevler</p>
                  {tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-xs text-white/80 truncate mr-2">{t.title}</span>
                      {t.due_date && (
                        <span className="text-[10px] text-status-urgent font-medium shrink-0">{daysUntil(t.due_date)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {notifCount === 0 && <p className="text-xs text-white/40">Bildirim yok</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
