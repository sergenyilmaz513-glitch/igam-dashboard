'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, TeamMember, Project } from '@/lib/types'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Gorevler() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', assignee: 0, status: 'todo', priority: 'medium', due_date: '', category: '', project_id: 0 })

  useEffect(() => {
    loadData().then(() => setLoading(false))

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setTasks(data) })
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
    const order: Task['status'][] = ['todo', 'in-progress', 'done']
    const idx = order.indexOf(task.status)
    const next = order[(idx + 1) % 3]
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    loadData()
  }

  async function deleteTask(id: number) {
    await supabase.from('tasks').delete().eq('id', id)
    loadData()
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    const insert: any = { ...form }
    if (insert.assignee === 0) delete insert.assignee
    if (insert.project_id === 0) delete insert.project_id
    await supabase.from('tasks').insert([insert])
    setForm({ title: '', assignee: 0, status: 'todo', priority: 'medium', due_date: '', category: '', project_id: 0 })
    setShowForm(false)
    loadData()
  }

  if (loading) return <LoadingSpinner />

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const filters = [
    { value: 'all', label: 'Tümü', count: tasks.length },
    { value: 'todo', label: 'Yapılacak', count: tasks.filter(t => t.status === 'todo').length },
    { value: 'in-progress', label: 'Devam Ediyor', count: tasks.filter(t => t.status === 'in-progress').length },
    { value: 'done', label: 'Tamamlandı', count: tasks.filter(t => t.status === 'done').length },
  ]

  const statusLabel: Record<string, string> = { 'todo': 'Yapılacak', 'in-progress': 'Devam Ediyor', 'done': 'Tamamlandı' }
  const statusColor: Record<string, string> = { 'todo': 'bg-status-todo/20 text-yellow-700', 'in-progress': 'bg-status-progress/20 text-blue-700', 'done': 'bg-status-done/20 text-green-700' }
  const priorityIcon: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' }
  const priorityLabel: Record<string, string> = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-outfit font-bold text-2xl text-text-primary">Görevler</h2>
          <p className="text-sm text-text-secondary mt-1">{tasks.length} toplam görev</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 gold-gradient text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          + Yeni Görev
        </button>
      </div>

      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value ? 'bg-gold/10 text-gold' : 'bg-white/65 text-text-secondary hover:bg-black/[0.03]'
            }`}
          >
            {f.label} <span className="ml-1 text-xs opacity-70">({f.count})</span>
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={addTask} className="glass-card p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Görev başlığı" required className="px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            <select value={form.assignee} onChange={e => setForm({ ...form, assignee: parseInt(e.target.value) })} className="px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
              <option value={0}>Kişi seç</option>
              {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
              <option value="high">Yüksek Öncelik</option>
              <option value="medium">Orta Öncelik</option>
              <option value="low">Düşük Öncelik</option>
            </select>
            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Kategori" className="px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: parseInt(e.target.value) })} className="px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
              <option value={0}>Proje seç (opsiyonel)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 gold-gradient text-white rounded-xl text-sm font-medium">Ekle</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-cream rounded-xl text-sm text-text-secondary">İptal</button>
          </div>
        </form>
      )}

      <div className="glass-card divide-y divide-black/[0.04]">
        {filteredTasks.map((task) => {
          const member = getMember(task.assignee)
          return (
            <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-cream/30 transition-colors">
              <button
                onClick={() => cycleStatus(task)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  task.status === 'done'
                    ? 'bg-status-done border-status-done text-white'
                    : task.status === 'in-progress'
                    ? 'border-status-progress bg-status-progress/20'
                    : 'border-gray-300'
                }`}
              >
                {task.status === 'done' && <span className="text-[10px]">✓</span>}
                {task.status === 'in-progress' && <span className="text-[8px] text-status-progress">●</span>}
              </button>
              {member && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: member.color }}>
                  {member.avatar}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.status === 'done' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {member && <span className="text-[10px] text-text-secondary">{member.name}</span>}
                  {task.due_date && <span className="text-[10px] text-text-secondary">· {new Date(task.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>}
                  {task.category && <span className="text-[10px] text-text-secondary">· {task.category}</span>}
                </div>
              </div>
              <span className="text-sm" title={priorityLabel[task.priority]}>{priorityIcon[task.priority]}</span>
              <span className={`status-badge text-[10px] ${statusColor[task.status]}`}>{statusLabel[task.status]}</span>
              <button onClick={() => deleteTask(task.id)} className="text-text-secondary hover:text-status-urgent text-sm transition-colors shrink-0">✕</button>
            </div>
          )
        })}
        {filteredTasks.length === 0 && (
          <div className="px-5 py-12 text-center text-text-secondary text-sm">
            {filter === 'all' ? 'Henüz görev eklenmemiş' : 'Bu filtrede görev yok'}
          </div>
        )}
      </div>
    </div>
  )
}
