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
    { label: 'Yapılacak', value: todoCount, color: '#FBBF24', bg: 'bg-yellow-50' },
    { label: 'Devam Ediyor', value: progressCount, color: '#60A5FA', bg: 'bg-blue-50' },
    { label: 'Tamamlanan', value: doneCount, color: '#34D399', bg: 'bg-green-50' },
    { label: 'Acil', value: urgentCount, color: '#F87171', bg: 'bg-red-50' },
  ]

  const totalTasks = tasks.length
  const weeklyProgress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0

  function getMember(id: number) {
    return team.find(m => m.id === id)
  }

  const statusLabel: Record<string, string> = { 'todo': 'Yapılacak', 'in-progress': 'Devam Ediyor', 'done': 'Tamamlandı' }
  const statusColor: Record<string, string> = { 'todo': 'bg-status-todo/20 text-yellow-700', 'in-progress': 'bg-status-progress/20 text-blue-700', 'done': 'bg-status-done/20 text-green-700' }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-outfit font-bold text-2xl text-text-primary">Genel Bakış</h2>
        <p className="text-sm text-text-secondary mt-1">Takım performansı ve güncel durum</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-5 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">{s.label}</p>
                <p className="text-3xl font-outfit font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center`}>
                <div className="w-4 h-4 rounded-full" style={{ background: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <h3 className="font-outfit font-semibold text-sm mb-3">Haftalık İlerleme</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-4 bg-cream-dark rounded-full overflow-hidden">
            <div
              className="h-full gold-gradient rounded-full transition-all duration-700"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gold">{weeklyProgress}%</span>
        </div>
        <p className="text-xs text-text-secondary mt-2">{doneCount} / {totalTasks} görev tamamlandı</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="font-outfit font-semibold text-sm mb-4">Son Görevler</h3>
          <div className="space-y-3">
            {tasks.slice(0, 6).map((task) => {
              const member = getMember(task.assignee)
              return (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-black/[0.04] last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {member && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: member.color }}>
                        {member.avatar}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary truncate">{task.title}</p>
                      <p className="text-[10px] text-text-secondary">{member?.name}</p>
                    </div>
                  </div>
                  <span className={`status-badge shrink-0 ml-2 ${statusColor[task.status]}`}>
                    {statusLabel[task.status]}
                  </span>
                </div>
              )
            })}
            {tasks.length === 0 && <p className="text-sm text-text-secondary">Henüz görev yok</p>}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-outfit font-semibold text-sm mb-4">Yaklaşan Etkinlikler</h3>
          <div className="space-y-3">
            {events.map((ev) => {
              const dayDiff = Math.ceil((new Date(ev.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const dayLabel = dayDiff === 0 ? 'Bugün' : dayDiff === 1 ? 'Yarın' : `${dayDiff} gün`
              return (
                <div key={ev.id} className="flex items-center justify-between py-2 border-b border-black/[0.04] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: ev.color || '#C9A84C' }} />
                    <div>
                      <p className="text-sm text-text-primary">{ev.title}</p>
                      <p className="text-[10px] text-text-secondary">{ev.type} · {ev.event_time}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gold font-medium shrink-0">{dayLabel}</span>
                </div>
              )
            })}
            {events.length === 0 && <p className="text-sm text-text-secondary">Yaklaşan etkinlik yok</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
