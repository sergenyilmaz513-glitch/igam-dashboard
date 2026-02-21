'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, Event, TeamMember, Project } from '@/lib/types'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Overview() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [t, e, tm, p] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date').limit(5),
        supabase.from('team').select('*'),
        supabase.from('projects').select('*'),
      ])
      if (t.data) setTasks(t.data)
      if (e.data) setEvents(e.data)
      if (tm.data) setTeam(tm.data)
      if (p.data) setProjects(p.data)
      setLoading(false)
    }
    load()

    // Realtime for tasks and events
    const channel = supabase
      .channel('overview-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setTasks(data) })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        supabase.from('events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date').limit(5).then(({ data }) => { if (data) setEvents(data) })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) return <LoadingSpinner />

  const todoCount = tasks.filter(t => t.status === 'todo').length
  const progressCount = tasks.filter(t => t.status === 'in-progress').length
  const doneCount = tasks.filter(t => t.status === 'done').length
  const urgentCount = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length

  const stats = [
    { label: 'Yapılacak', value: todoCount, color: '#FBBF24', icon: '📋' },
    { label: 'Devam Ediyor', value: progressCount, color: '#3B82F6', icon: '🔄' },
    { label: 'Tamamlanan', value: doneCount, color: '#22C55E', icon: '✓' },
    { label: 'Acil', value: urgentCount, color: '#EF4444', icon: '!' },
  ]

  const totalTasks = tasks.length
  const weeklyProgress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0

  function getMember(id: number) {
    return team.find(m => m.id === id)
  }

  const statusLabel: Record<string, string> = { 'todo': 'Yapılacak', 'in-progress': 'Devam Ediyor', 'done': 'Tamamlandı' }
  const statusColor: Record<string, string> = { 'todo': 'bg-status-todo/20 text-status-todo', 'in-progress': 'bg-status-progress/20 text-status-progress', 'done': 'bg-status-done/20 text-status-done' }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="font-outfit font-bold text-2xl text-white">Genel Bakış</h2>
        <p className="text-sm text-white/60 mt-1">Takım performansı ve güncel durum</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass p-5 hover:bg-white/[0.08] transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9CA3AF]">{s.label}</p>
                <p className="text-3xl font-outfit font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}
              >
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Haftalik Ilerleme */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-outfit font-semibold text-sm text-white">Haftalık İlerleme</h3>
          <span className="text-sm font-semibold text-gold">{weeklyProgress}%</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/[0.06]">
            <div
              className="h-full gold-gradient rounded-full transition-all duration-700"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-[#9CA3AF] mt-2">{doneCount} / {totalTasks} görev tamamlandı</p>
      </div>

      {/* Son Gorevler & Yaklasan Etkinlikler Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Gorevler */}
        <div className="glass p-5">
          <h3 className="font-outfit font-semibold text-sm text-white mb-4">Son Görevler</h3>
          <div className="space-y-1">
            {tasks.slice(0, 6).map((task) => {
              const member = getMember(task.assignee)
              return (
                <div key={task.id} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors border-b border-white/[0.06] last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {member && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: member.color }}>
                        {member.avatar}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{task.title}</p>
                      <p className="text-[10px] text-white/40">{member?.name}</p>
                    </div>
                  </div>
                  <span className={`status-badge shrink-0 ml-2 ${statusColor[task.status]}`}>
                    {statusLabel[task.status]}
                  </span>
                </div>
              )
            })}
            {tasks.length === 0 && <p className="text-sm text-[#9CA3AF]">Henüz görev yok</p>}
          </div>
        </div>

        {/* Yaklasan Etkinlikler */}
        <div className="glass p-5">
          <h3 className="font-outfit font-semibold text-sm text-white mb-4">Yaklaşan Etkinlikler</h3>
          <div className="space-y-1">
            {events.map((ev) => {
              const dayDiff = Math.ceil((new Date(ev.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const dayLabel = dayDiff === 0 ? 'Bugün' : dayDiff === 1 ? 'Yarın' : `${dayDiff} gün`
              return (
                <div key={ev.id} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors border-b border-white/[0.06] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: ev.color || '#C9A84C' }} />
                    <div>
                      <p className="text-sm text-white">{ev.title}</p>
                      <p className="text-[10px] text-white/40">{ev.type} · {ev.event_time}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gold font-medium shrink-0">{dayLabel}</span>
                </div>
              )
            })}
            {events.length === 0 && <p className="text-sm text-[#9CA3AF]">Yaklaşan etkinlik yok</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
