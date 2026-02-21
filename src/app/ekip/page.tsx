'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember, Task, Project, Event, Document } from '@/lib/types'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Ekip() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [docs, setDocs] = useState<Document[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [tm, t, p, e, d] = await Promise.all([
        supabase.from('team').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('events').select('*'),
        supabase.from('documents').select('*'),
      ])
      if (tm.data) setTeam(tm.data)
      if (t.data) setTasks(t.data)
      if (p.data) setProjects(p.data)
      if (e.data) setEvents(e.data)
      if (d.data) setDocs(d.data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />

  function getMemberStats(id: number) {
    const memberTasks = tasks.filter(t => t.assignee === id)
    const total = memberTasks.length
    const done = memberTasks.filter(t => t.status === 'done').length
    const memberProjects = projects.filter(p => p.members?.includes(id))
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, projects: memberProjects.length, pct }
  }

  const selected = team.find(m => m.id === selectedId)

  if (selected) {
    const stats = getMemberStats(selected.id)
    const memberTasks = tasks.filter(t => t.assignee === selected.id)
    const memberProjects = projects.filter(p => p.members?.includes(selected.id))
    const memberEvents = events.filter(e => e.members?.includes(selected.id))
    const memberDocs = docs.filter(d => d.uploaded_by === selected.id)
    const statusLabel: Record<string, string> = { 'todo': 'Yapılacak', 'in-progress': 'Devam Ediyor', 'done': 'Tamamlandı' }
    const statusColor: Record<string, string> = { 'todo': 'bg-status-todo/20 text-yellow-700', 'in-progress': 'bg-status-progress/20 text-blue-700', 'done': 'bg-status-done/20 text-green-700' }
    const priorityIcon: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' }

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Ekibe Dön
        </button>

        {/* Header */}
        <div className="glass-card overflow-hidden">
          <div className="h-32 gold-gradient" />
          <div className="px-6 pb-6 -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl border-4 border-white flex items-center justify-center text-4xl" style={{ background: selected.color }}>
                {selected.avatar}
              </div>
              <div className="pb-1">
                <h2 className="font-outfit font-bold text-2xl">{selected.name}</h2>
                <p className="text-sm text-text-secondary">{selected.role}</p>
                <p className="text-xs text-text-secondary">{selected.email}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {selected.expertise?.map((exp, i) => (
                <span key={i} className="px-3 py-1 bg-gold/10 text-gold text-xs rounded-full">{exp}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Görev', value: stats.total, color: '#C9A84C' },
            { label: 'Tamamlanan', value: stats.done, color: '#34D399' },
            { label: 'Projeler', value: stats.projects, color: '#60A5FA' },
            { label: 'Tamamlanma', value: `${stats.pct}%`, color: '#C9A84C' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className="text-2xl font-outfit font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-text-secondary mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="font-outfit font-semibold text-sm mb-4">Tüm Görevler ({memberTasks.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {memberTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between bg-cream/50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{priorityIcon[task.priority]}</span>
                    <span className="text-sm">{task.title}</span>
                  </div>
                  <span className={`status-badge text-[10px] ${statusColor[task.status]}`}>{statusLabel[task.status]}</span>
                </div>
              ))}
              {memberTasks.length === 0 && <p className="text-xs text-text-secondary">Görev yok</p>}
            </div>
          </div>
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="font-outfit font-semibold text-sm mb-4">Projeler ({memberProjects.length})</h3>
              <div className="space-y-2">
                {memberProjects.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-cream/50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-sm">{p.title}</span>
                    </div>
                    <span className="text-xs text-gold font-medium">{p.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-outfit font-semibold text-sm mb-4">Etkinlikler ({memberEvents.length})</h3>
              <div className="space-y-2">
                {memberEvents.slice(0, 5).map(ev => (
                  <div key={ev.id} className="flex items-center justify-between bg-cream/50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: ev.color }} />
                      <span className="text-sm">{ev.title}</span>
                    </div>
                    <span className="text-[10px] text-text-secondary">{new Date(ev.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-outfit font-semibold text-sm mb-4">Belgeler ({memberDocs.length})</h3>
              <div className="space-y-2">
                {memberDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 bg-cream/50 rounded-xl px-3 py-2.5">
                    <span className="text-sm">📄</span>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gold hover:underline">{doc.name}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-outfit font-bold text-2xl text-text-primary">Ekip</h2>
        <p className="text-sm text-text-secondary mt-1">{team.length} takım üyesi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {team.map((member) => {
          const stats = getMemberStats(member.id)
          return (
            <div key={member.id} className="glass-card p-6 cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => setSelectedId(member.id)}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: member.color }}>
                  {member.avatar}
                </div>
                <div>
                  <h3 className="font-outfit font-semibold text-lg">{member.name}</h3>
                  <p className="text-sm text-text-secondary">{member.role}</p>
                  <p className="text-xs text-text-secondary">{member.email}</p>
                </div>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {member.expertise?.map((exp, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gold/10 text-gold text-[10px] rounded-full">{exp}</span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-cream rounded-xl py-2">
                  <p className="text-lg font-outfit font-bold text-text-primary">{stats.total}</p>
                  <p className="text-[10px] text-text-secondary">Görev</p>
                </div>
                <div className="text-center bg-cream rounded-xl py-2">
                  <p className="text-lg font-outfit font-bold text-status-done">{stats.done}</p>
                  <p className="text-[10px] text-text-secondary">Biten</p>
                </div>
                <div className="text-center bg-cream rounded-xl py-2">
                  <p className="text-lg font-outfit font-bold text-status-progress">{stats.projects}</p>
                  <p className="text-[10px] text-text-secondary">Proje</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary">Tamamlanma</span>
                  <span className="text-xs font-semibold text-gold">{stats.pct}%</span>
                </div>
                <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                  <div className="h-full gold-gradient rounded-full transition-all duration-500" style={{ width: `${stats.pct}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
