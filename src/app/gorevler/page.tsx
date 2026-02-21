'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, TeamMember, Project } from '@/lib/types'
import LoadingSpinner from '@/components/LoadingSpinner'

type ViewMode = 'kanban' | 'list'

const STATUS_ORDER: Task['status'][] = ['todo', 'in-progress', 'done']

const COLUMNS = [
  { key: 'todo', label: 'Yapilacak', color: '#FBBF24', bgClass: 'bg-status-todo' },
  { key: 'in-progress', label: 'Devam Ediyor', color: '#3B82F6', bgClass: 'bg-status-progress' },
  { key: 'done', label: 'Tamamlandi', color: '#22C55E', bgClass: 'bg-status-done' },
  { key: 'overdue', label: 'Gecikmis', color: '#EF4444', bgClass: 'bg-status-urgent' },
] as const

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: 'Yuksek', color: '#EF4444', bg: 'bg-priority-high/20 text-red-400' },
  medium: { label: 'Orta',   color: '#F59E0B', bg: 'bg-priority-medium/20 text-yellow-400' },
  low:    { label: 'Dusuk',  color: '#22C55E', bg: 'bg-priority-low/20 text-green-400' },
}

const statusLabel: Record<string, string> = { 'todo': 'Yapilacak', 'in-progress': 'Devam Ediyor', 'done': 'Tamamlandi' }
const statusColor: Record<string, string> = {
  'todo': 'bg-status-todo/20 text-yellow-400',
  'in-progress': 'bg-status-progress/20 text-blue-400',
  'done': 'bg-status-done/20 text-green-400',
}

function getDaysRemaining(dueDate: string): { text: string; urgent: boolean; overdue: boolean } {
  if (!dueDate) return { text: '', urgent: false, overdue: false }
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { text: `${Math.abs(diff)} gun gecikti`, urgent: true, overdue: true }
  if (diff === 0) return { text: 'Bugun', urgent: true, overdue: false }
  if (diff === 1) return { text: 'Yarin', urgent: true, overdue: false }
  if (diff <= 3) return { text: `${diff} gun kaldi`, urgent: true, overdue: false }
  return { text: `${diff} gun kaldi`, urgent: false, overdue: false }
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(task.due_date)
  due.setHours(0, 0, 0, 0)
  return due.getTime() < now.getTime()
}

export default function Gorevler() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: '',
    assignee: 0,
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    due_date: '',
    category: '',
    project_id: 0,
  })

  useEffect(() => {
    loadData().then(() => setLoading(false))

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setTasks(data)
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadData() {
    const [t, tm, p] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('team').select('*'),
      supabase.from('projects').select('*'),
    ])
    if (t.data) setTasks(t.data)
    if (tm.data) setTeam(tm.data)
    if (p.data) setProjects(p.data)
  }

  function getMember(id: number) {
    return team.find(m => m.id === id)
  }

  async function cycleStatus(task: Task) {
    const idx = STATUS_ORDER.indexOf(task.status)
    const next = STATUS_ORDER[(idx + 1) % 3]
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    loadData()
  }

  async function deleteTask(id: number) {
    await supabase.from('tasks').delete().eq('id', id)
    loadData()
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    const insert: Record<string, unknown> = { ...form }
    if (insert.assignee === 0) delete insert.assignee
    if (insert.project_id === 0) delete insert.project_id
    await supabase.from('tasks').insert([insert])
    setForm({ title: '', assignee: 0, status: 'todo', priority: 'medium', due_date: '', category: '', project_id: 0 })
    setShowForm(false)
    loadData()
  }

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(q))
    }
    if (filterPriority !== 'all') {
      result = result.filter(t => t.priority === filterPriority)
    }
    return result
  }, [tasks, search, filterPriority])

  const columnData = useMemo(() => {
    const todoTasks = filteredTasks.filter(t => t.status === 'todo' && !isOverdue(t))
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress' && !isOverdue(t))
    const doneTasks = filteredTasks.filter(t => t.status === 'done')
    const overdueTasks = filteredTasks.filter(t => isOverdue(t))
    return {
      'todo': todoTasks,
      'in-progress': inProgressTasks,
      'done': doneTasks,
      'overdue': overdueTasks,
    }
  }, [filteredTasks])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-outfit font-bold text-2xl text-white">Gorevler</h2>
          <p className="text-sm text-white/60 mt-1">{tasks.length} toplam gorev</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Gorev ara..."
              className="dark-input pl-10 w-full sm:w-64"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="glass glass-hover px-3 py-2.5 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 glass p-2 min-w-[160px] z-50">
                <p className="text-[10px] text-white/40 uppercase tracking-wider px-2 py-1 mb-1">Oncelik Filtre</p>
                {[
                  { value: 'all', label: 'Tumu' },
                  { value: 'high', label: 'Yuksek' },
                  { value: 'medium', label: 'Orta' },
                  { value: 'low', label: 'Dusuk' },
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => { setFilterPriority(f.value); setShowFilterMenu(false) }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filterPriority === f.value ? 'text-gold bg-gold/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="glass flex p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded-[14px] text-xs font-medium transition-all ${
                viewMode === 'kanban' ? 'gold-gradient text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-[14px] text-xs font-medium transition-all ${
                viewMode === 'list' ? 'gold-gradient text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* New Task Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 gold-gradient text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Gorev
          </button>
        </div>
      </div>

      {/* NEW TASK FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="glass-strong relative w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-outfit font-semibold text-lg text-white">Yeni Gorev</h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={addTask} className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Baslik</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Gorev basligi"
                  required
                  className="dark-input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Atanan Kisi</label>
                  <select
                    value={form.assignee}
                    onChange={e => setForm({ ...form, assignee: parseInt(e.target.value) })}
                    className="dark-input w-full"
                  >
                    <option value={0}>Kisi sec</option>
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Oncelik</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value as Task['priority'] })}
                    className="dark-input w-full"
                  >
                    <option value="high">Yuksek</option>
                    <option value="medium">Orta</option>
                    <option value="low">Dusuk</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Son Tarih</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="dark-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Kategori</label>
                  <input
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="Kategori"
                    className="dark-input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Proje</label>
                <select
                  value={form.project_id}
                  onChange={e => setForm({ ...form, project_id: parseInt(e.target.value) })}
                  className="dark-input w-full"
                >
                  <option value={0}>Proje sec (opsiyonel)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 px-4 py-2.5 gold-gradient text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                  Gorev Ekle
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 glass text-white/60 text-sm hover:text-white transition-colors">
                  Iptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Filters Indicator */}
      {(filterPriority !== 'all' || search.trim()) && (
        <div className="flex items-center gap-2 flex-wrap">
          {search.trim() && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/60 border border-white/10">
              Arama: &quot;{search}&quot;
              <button onClick={() => setSearch('')} className="text-white/40 hover:text-white ml-1">&times;</button>
            </span>
          )}
          {filterPriority !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/60 border border-white/10">
              Oncelik: {priorityConfig[filterPriority]?.label}
              <button onClick={() => setFilterPriority('all')} className="text-white/40 hover:text-white ml-1">&times;</button>
            </span>
          )}
          <button
            onClick={() => { setSearch(''); setFilterPriority('all') }}
            className="text-xs text-gold hover:text-gold/80 transition-colors"
          >
            Temizle
          </button>
        </div>
      )}

      {/* =================== KANBAN VIEW =================== */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4 -mx-2 px-2">
          <div className="flex gap-4 min-w-[900px]">
            {COLUMNS.map(col => {
              const colTasks = columnData[col.key]
              return (
                <div key={col.key} className="flex-1 min-w-[250px]">
                  {/* Column Header */}
                  <div className="glass p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                        <h3 className="font-outfit font-semibold text-sm text-white">{col.label}</h3>
                      </div>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: col.color + '20', color: col.color }}
                      >
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Column Body */}
                  <div className="space-y-3 min-h-[200px]">
                    {colTasks.map(task => {
                      const member = getMember(task.assignee)
                      const daysInfo = getDaysRemaining(task.due_date)
                      const pConfig = priorityConfig[task.priority]
                      const project = projects.find(p => p.id === task.project_id)

                      return (
                        <div
                          key={task.id}
                          className="glass glass-hover p-4 space-y-3 group transition-all hover:border-white/20 cursor-default"
                        >
                          {/* Top row: checkbox + delete */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              {/* Status Checkbox */}
                              <button
                                onClick={() => cycleStatus(task)}
                                className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                                style={{
                                  borderColor: task.status === 'done' ? '#22C55E' : task.status === 'in-progress' ? '#3B82F6' : 'rgba(255,255,255,0.2)',
                                  backgroundColor: task.status === 'done' ? '#22C55E' : task.status === 'in-progress' ? 'rgba(59,130,246,0.2)' : 'transparent',
                                }}
                                title="Durumu degistir"
                              >
                                {task.status === 'done' && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                {task.status === 'in-progress' && (
                                  <div className="w-2 h-2 rounded-full bg-status-progress" />
                                )}
                              </button>
                              {/* Title */}
                              <p className={`text-sm font-medium leading-snug ${
                                task.status === 'done' ? 'line-through text-white/40' : 'text-white'
                              }`}>
                                {task.title}
                              </p>
                            </div>
                            {/* Delete */}
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all shrink-0"
                              title="Sil"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {/* Category / Project */}
                          {(task.category || project) && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {task.category && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-white/50 border border-white/5">
                                  {task.category}
                                </span>
                              )}
                              {project && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-white/50" style={{ backgroundColor: project.color + '20', borderColor: project.color + '30' }}>
                                  {project.title}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Due Date */}
                          {task.due_date && (
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" style={{ color: daysInfo.overdue ? '#EF4444' : daysInfo.urgent ? '#FBBF24' : 'rgba(255,255,255,0.3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-[11px]" style={{ color: daysInfo.overdue ? '#EF4444' : daysInfo.urgent ? '#FBBF24' : 'rgba(255,255,255,0.4)' }}>
                                {new Date(task.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                {' '}&middot;{' '}{daysInfo.text}
                              </span>
                            </div>
                          )}

                          {/* Bottom row: priority + assignee */}
                          <div className="flex items-center justify-between pt-1">
                            {/* Priority Badge */}
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ backgroundColor: pConfig.color + '20', color: pConfig.color }}
                            >
                              {pConfig.label}
                            </span>
                            {/* Assignee Avatar */}
                            {member && (
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] ring-2 ring-white/10"
                                  style={{ background: member.color }}
                                  title={member.name}
                                >
                                  {member.avatar}
                                </div>
                                <span className="text-[10px] text-white/40">{member.name.split(' ')[0]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {colTasks.length === 0 && (
                      <div className="glass p-6 text-center">
                        <p className="text-xs text-white/20">Gorev yok</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =================== LIST VIEW =================== */}
      {viewMode === 'list' && (
        <div className="glass overflow-hidden">
          {/* List Header */}
          <div className="grid grid-cols-[auto_1fr_100px_100px_100px_120px_40px] gap-4 px-5 py-3 border-b border-white/5">
            <div className="w-5" />
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Gorev</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Durum</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Oncelik</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Tarih</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Atanan</span>
            <div />
          </div>

          {/* List Rows */}
          {filteredTasks.map(task => {
            const member = getMember(task.assignee)
            const daysInfo = getDaysRemaining(task.due_date)
            const pConfig = priorityConfig[task.priority]

            return (
              <div
                key={task.id}
                className="grid grid-cols-[auto_1fr_100px_100px_100px_120px_40px] gap-4 px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group items-center"
              >
                {/* Checkbox */}
                <button
                  onClick={() => cycleStatus(task)}
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{
                    borderColor: task.status === 'done' ? '#22C55E' : task.status === 'in-progress' ? '#3B82F6' : 'rgba(255,255,255,0.2)',
                    backgroundColor: task.status === 'done' ? '#22C55E' : task.status === 'in-progress' ? 'rgba(59,130,246,0.2)' : 'transparent',
                  }}
                >
                  {task.status === 'done' && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {task.status === 'in-progress' && (
                    <div className="w-2 h-2 rounded-full bg-status-progress" />
                  )}
                </button>

                {/* Title + Category */}
                <div className="min-w-0">
                  <p className={`text-sm truncate ${task.status === 'done' ? 'line-through text-white/40' : 'text-white'}`}>
                    {task.title}
                  </p>
                  {task.category && (
                    <span className="text-[10px] text-white/30">{task.category}</span>
                  )}
                </div>

                {/* Status */}
                <span className={`status-badge text-center ${statusColor[task.status]}`}>
                  {statusLabel[task.status]}
                </span>

                {/* Priority */}
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-center"
                  style={{ backgroundColor: pConfig.color + '20', color: pConfig.color }}
                >
                  {pConfig.label}
                </span>

                {/* Date */}
                <div className="text-[11px]">
                  {task.due_date ? (
                    <div>
                      <p className="text-white/50">
                        {new Date(task.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </p>
                      <p style={{ color: daysInfo.overdue ? '#EF4444' : daysInfo.urgent ? '#FBBF24' : 'rgba(255,255,255,0.3)' }}>
                        {daysInfo.text}
                      </p>
                    </div>
                  ) : (
                    <span className="text-white/20">-</span>
                  )}
                </div>

                {/* Assignee */}
                {member ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0"
                      style={{ background: member.color }}
                    >
                      {member.avatar}
                    </div>
                    <span className="text-xs text-white/50 truncate">{member.name.split(' ')[0]}</span>
                  </div>
                ) : (
                  <span className="text-white/20 text-xs">-</span>
                )}

                {/* Delete */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                  title="Sil"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}

          {filteredTasks.length === 0 && (
            <div className="px-5 py-16 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-white/20">
                {search.trim() ? 'Arama sonucu bulunamadi' : 'Henuz gorev eklenmemis'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
