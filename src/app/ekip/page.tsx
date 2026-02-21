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

  const statusLabel: Record<string, string> = { 'todo': 'Yapılacak', 'in-progress': 'Devam Ediyor', 'done': 'Tamamlandı' }
  const statusBadge: Record<string, string> = {
    'todo': 'bg-status-todo/20 text-status-todo',
    'in-progress': 'bg-status-progress/20 text-status-progress',
    'done': 'bg-status-done/20 text-status-done',
  }
  const priorityIcon: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' }

  /* ─── DETAIL VIEW ─── */
  if (selected) {
    const stats = getMemberStats(selected.id)
    const memberTasks = tasks.filter(t => t.assignee === selected.id)
    const memberProjects = projects.filter(p => p.members?.includes(selected.id))
    const memberEvents = events.filter(e => e.members?.includes(selected.id))
    const memberDocs = docs.filter(d => d.uploaded_by === selected.id)

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Ekibe Dön
        </button>

        {/* Header card with gold banner */}
        <div className="glass overflow-hidden">
          <div className="h-32 gold-gradient" />
          <div className="px-6 pb-6 -mt-12">
            <div className="flex items-end gap-4">
              <div
                className="w-24 h-24 rounded-2xl border-4 border-dark flex items-center justify-center text-4xl shrink-0 shadow-lg"
                style={{ background: selected.color }}
              >
                {selected.avatar}
              </div>
              <div className="pb-1">
                <h2 className="font-outfit font-bold text-2xl text-white">{selected.name}</h2>
                <p className="text-sm text-white/60">{selected.role}</p>
                <p className="text-xs text-white/40">{selected.email}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {selected.expertise?.map((exp, i) => (
                <span key={i} className="px-3 py-1 bg-gold/10 text-gold text-xs rounded-full">{exp}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Görev', value: stats.total, color: '#C9A84C' },
            { label: 'Tamamlanan', value: stats.done, color: '#22C55E' },
            { label: 'Projeler', value: stats.projects, color: '#3B82F6' },
            { label: 'Tamamlanma %', value: `${stats.pct}%`, color: '#C9A84C' },
          ].map(s => (
            <div key={s.label} className="glass p-5 text-center">
              <p className="text-2xl font-outfit font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-white/60 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Two-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Tasks */}
          <div className="glass p-5">
            <h3 className="font-outfit font-semibold text-sm text-white mb-4">
              Tüm Görevler ({memberTasks.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {memberTasks.map(task => (
                <div key={task.id} className="glass flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs shrink-0">{priorityIcon[task.priority]}</span>
                    <span className="text-sm text-white truncate">{task.title}</span>
                  </div>
                  <span className={`status-badge text-[10px] shrink-0 ml-3 ${statusBadge[task.status]}`}>
                    {statusLabel[task.status]}
                  </span>
                </div>
              ))}
              {memberTasks.length === 0 && (
                <p className="text-xs text-white/40 text-center py-4">Görev yok</p>
              )}
            </div>
          </div>

          {/* Right: Projects, Events, Documents */}
          <div className="space-y-6">
            {/* Projects */}
            <div className="glass p-5">
              <h3 className="font-outfit font-semibold text-sm text-white mb-4">
                Projeler ({memberProjects.length})
              </h3>
              <div className="space-y-2">
                {memberProjects.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                      <span className="text-sm text-white truncate">{p.title}</span>
                    </div>
                    <span className="text-xs text-gold font-medium shrink-0 ml-3">{p.progress}%</span>
                  </div>
                ))}
                {memberProjects.length === 0 && (
                  <p className="text-xs text-white/40 text-center py-4">Proje yok</p>
                )}
              </div>
            </div>

            {/* Events */}
            <div className="glass p-5">
              <h3 className="font-outfit font-semibold text-sm text-white mb-4">
                Etkinlikler ({memberEvents.length})
              </h3>
              <div className="space-y-2">
                {memberEvents.slice(0, 5).map(ev => (
                  <div key={ev.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ev.color }} />
                      <span className="text-sm text-white truncate">{ev.title}</span>
                    </div>
                    <span className="text-[10px] text-white/40 shrink-0 ml-3">
                      {new Date(ev.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
                {memberEvents.length === 0 && (
                  <p className="text-xs text-white/40 text-center py-4">Etkinlik yok</p>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="glass p-5">
              <h3 className="font-outfit font-semibold text-sm text-white mb-4">
                Belgeler ({memberDocs.length})
              </h3>
              <div className="space-y-2">
                {memberDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
                    <span className="text-sm shrink-0">📄</span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gold hover:underline truncate"
                    >
                      {doc.name}
                    </a>
                  </div>
                ))}
                {memberDocs.length === 0 && (
                  <p className="text-xs text-white/40 text-center py-4">Belge yok</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─── GRID VIEW (default) ─── */
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="font-outfit font-bold text-2xl text-white">Ekip</h2>
        <p className="text-sm text-white/60 mt-1">{team.length} takım üyesi</p>
      </div>

      {/* 2x2 member grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {team.map((member) => {
          const stats = getMemberStats(member.id)
          return (
            <div
              key={member.id}
              className="glass glass-hover p-6 cursor-pointer transition-all duration-300 hover:border-white/20"
              onClick={() => setSelectedId(member.id)}
            >
              {/* Avatar + info */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: member.color }}
                >
                  {member.avatar}
                </div>
                <div className="min-w-0">
                  <h3 className="font-outfit font-semibold text-lg text-white">{member.name}</h3>
                  <p className="text-sm text-white/60">{member.role}</p>
                  <p className="text-xs text-white/40">{member.email}</p>
                </div>
              </div>

              {/* Expertise tags */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {member.expertise?.map((exp, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gold/10 text-gold text-[10px] rounded-full">
                    {exp}
                  </span>
                ))}
              </div>

              {/* Stats row: 3 mini cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-white/5 rounded-xl py-2.5">
                  <p className="text-lg font-outfit font-bold text-white">{stats.total}</p>
                  <p className="text-[10px] text-white/60">Görev</p>
                </div>
                <div className="text-center bg-white/5 rounded-xl py-2.5">
                  <p className="text-lg font-outfit font-bold text-status-done">{stats.done}</p>
                  <p className="text-[10px] text-white/60">Biten</p>
                </div>
                <div className="text-center bg-white/5 rounded-xl py-2.5">
                  <p className="text-lg font-outfit font-bold text-status-progress">{stats.projects}</p>
                  <p className="text-[10px] text-white/60">Proje</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/60">Tamamlanma</span>
                  <span className="text-xs font-semibold text-gold">{stats.pct}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full gold-gradient rounded-full transition-all duration-500"
                    style={{ width: `${stats.pct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
