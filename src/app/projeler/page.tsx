'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Project, Task, Document, TeamMember } from '@/lib/types'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Projeler() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [docs, setDocs] = useState<Document[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDocForm, setShowDocForm] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', status: 'todo', color: '#C9A84C', members: [] as number[], progress: 0, start_date: '', end_date: '' })
  const [docForm, setDocForm] = useState({ name: '', type: 'link', category: '', url: '', uploaded_by: 0 })

  useEffect(() => {
    loadData().then(() => setLoading(false))
  }, [])

  async function loadData() {
    const [p, t, d, tm] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*'),
      supabase.from('documents').select('*'),
      supabase.from('team').select('*'),
    ])
    if (p.data) setProjects(p.data)
    if (t.data) setTasks(t.data)
    if (d.data) setDocs(d.data)
    if (tm.data) setTeam(tm.data)
  }

  function getMember(id: number) {
    return team.find(m => m.id === id)
  }

  async function addProject(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('projects').insert([form])
    setForm({ title: '', description: '', status: 'todo', color: '#C9A84C', members: [], progress: 0, start_date: '', end_date: '' })
    setShowForm(false)
    loadData()
  }

  async function addDocument(e: React.FormEvent, projectId: number) {
    e.preventDefault()
    await supabase.from('documents').insert([{ ...docForm, project_id: projectId }])
    setDocForm({ name: '', type: 'link', category: '', url: '', uploaded_by: 0 })
    setShowDocForm(null)
    loadData()
  }

  async function deleteDocument(id: number) {
    await supabase.from('documents').delete().eq('id', id)
    loadData()
  }

  function toggleMember(id: number) {
    setForm(f => ({
      ...f,
      members: f.members.includes(id) ? f.members.filter(m => m !== id) : [...f.members, id]
    }))
  }

  const statusLabel: Record<string, string> = { 'todo': 'Yapılacak', 'in-progress': 'Devam Ediyor', 'done': 'Tamamlandı' }
  const statusColor: Record<string, string> = { 'todo': 'bg-status-todo/20 text-yellow-700', 'in-progress': 'bg-status-progress/20 text-blue-700', 'done': 'bg-status-done/20 text-green-700' }

  function timelineWidth(start: string, end: string) {
    if (!start || !end) return { left: '0%', width: '100%' }
    const now = Date.now()
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    const total = e - s
    if (total <= 0) return { left: '0%', width: '100%' }
    const elapsed = Math.min(Math.max((now - s) / total, 0), 1)
    return { width: '100%', background: `linear-gradient(90deg, #C9A84C ${elapsed * 100}%, #EDE9E0 ${elapsed * 100}%)` }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-outfit font-bold text-2xl text-text-primary">Projeler</h2>
          <p className="text-sm text-text-secondary mt-1">{projects.length} aktif proje</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 gold-gradient text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          + Yeni Proje
        </button>
      </div>

      {showForm && (
        <form onSubmit={addProject} className="glass-card p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Proje adı" required className="px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
              <option value="todo">Yapılacak</option>
              <option value="in-progress">Devam Ediyor</option>
              <option value="done">Tamamlandı</option>
            </select>
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Açıklama" rows={2} className="w-full px-4 py-2.5 bg-cream rounded-xl border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-gold/30" />
          <div>
            <p className="text-xs text-text-secondary mb-2">Ekip Üyeleri</p>
            <div className="flex gap-2">
              {team.map(m => (
                <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors ${form.members.includes(m.id) ? 'bg-gold/20 text-gold' : 'bg-cream text-text-secondary'}`}>
                  <span>{m.avatar}</span> {m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary">İlerleme: {form.progress}%</label>
            <input type="range" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: parseInt(e.target.value) })} className="flex-1 accent-gold" />
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-8 h-8 rounded-lg border-0 cursor-pointer" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 gold-gradient text-white rounded-xl text-sm font-medium">Ekle</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-cream rounded-xl text-sm text-text-secondary">İptal</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const projectTasks = tasks.filter(t => t.project_id === project.id)
          const projectDocs = docs.filter(d => d.project_id === project.id)
          const isExpanded = expandedId === project.id
          return (
            <div key={project.id} className={`glass-card overflow-hidden transition-all duration-300 ${isExpanded ? 'md:col-span-2' : ''}`}>
              <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : project.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
                    <h3 className="font-outfit font-semibold text-base">{project.title}</h3>
                  </div>
                  <span className={`status-badge ${statusColor[project.status]}`}>{statusLabel[project.status]}</span>
                </div>
                <p className="text-sm text-text-secondary mb-4 line-clamp-2">{project.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-text-secondary">İlerleme</span>
                  <span className="text-xs font-semibold text-gold">{project.progress}%</span>
                </div>
                <div className="h-2 bg-cream-dark rounded-full overflow-hidden mb-4">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${project.progress}%`, background: project.color }} />
                </div>
                {project.start_date && project.end_date && (
                  <div className="h-1.5 rounded-full overflow-hidden mb-4" style={timelineWidth(project.start_date, project.end_date)} />
                )}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {project.members?.map((mid) => {
                      const m = getMember(mid)
                      return m ? (
                        <div key={mid} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs" style={{ background: m.color }}>
                          {m.avatar}
                        </div>
                      ) : null
                    })}
                  </div>
                  <span className="text-[10px] text-text-secondary">
                    {project.start_date && new Date(project.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`}
                  </span>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-black/[0.06] p-5 bg-cream/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-outfit font-semibold text-sm mb-3">Görevler ({projectTasks.length})</h4>
                      <div className="space-y-2">
                        {projectTasks.map(task => {
                          const m = getMember(task.assignee)
                          return (
                            <div key={task.id} className="flex items-center justify-between bg-white/50 rounded-xl px-3 py-2">
                              <div className="flex items-center gap-2">
                                {m && <span className="text-sm">{m.avatar}</span>}
                                <span className="text-sm">{task.title}</span>
                              </div>
                              <span className={`status-badge text-[10px] ${statusColor[task.status]}`}>{statusLabel[task.status]}</span>
                            </div>
                          )
                        })}
                        {projectTasks.length === 0 && <p className="text-xs text-text-secondary">Görev yok</p>}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-outfit font-semibold text-sm">Belgeler ({projectDocs.length})</h4>
                        <button onClick={(e) => { e.stopPropagation(); setShowDocForm(showDocForm === project.id ? null : project.id) }} className="text-xs text-gold hover:underline">+ Belge Ekle</button>
                      </div>
                      {showDocForm === project.id && (
                        <form onSubmit={(e) => addDocument(e, project.id)} className="bg-white/50 rounded-xl p-3 mb-3 space-y-2" onClick={e => e.stopPropagation()}>
                          <input value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} placeholder="Belge adı" required className="w-full px-3 py-2 bg-cream rounded-lg border border-black/[0.06] text-xs focus:outline-none focus:ring-2 focus:ring-gold/30" />
                          <input value={docForm.url} onChange={e => setDocForm({ ...docForm, url: e.target.value })} placeholder="URL veya dosya yolu" required className="w-full px-3 py-2 bg-cream rounded-lg border border-black/[0.06] text-xs focus:outline-none focus:ring-2 focus:ring-gold/30" />
                          <div className="grid grid-cols-2 gap-2">
                            <select value={docForm.category} onChange={e => setDocForm({ ...docForm, category: e.target.value })} className="px-3 py-2 bg-cream rounded-lg border border-black/[0.06] text-xs focus:outline-none">
                              <option value="">Kategori seç</option>
                              <option value="rapor">Rapor</option>
                              <option value="sunum">Sunum</option>
                              <option value="analiz">Analiz</option>
                              <option value="diger">Diğer</option>
                            </select>
                            <select value={docForm.uploaded_by} onChange={e => setDocForm({ ...docForm, uploaded_by: parseInt(e.target.value) })} className="px-3 py-2 bg-cream rounded-lg border border-black/[0.06] text-xs focus:outline-none">
                              <option value={0}>Yükleyen seç</option>
                              {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                          </div>
                          <button type="submit" className="px-3 py-1.5 gold-gradient text-white rounded-lg text-xs">Ekle</button>
                        </form>
                      )}
                      <div className="space-y-2">
                        {projectDocs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between bg-white/50 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">📄</span>
                              <div>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gold hover:underline">{doc.name}</a>
                                <p className="text-[10px] text-text-secondary">{doc.category} · {getMember(doc.uploaded_by)?.name}</p>
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id) }} className="text-text-secondary hover:text-status-urgent text-sm transition-colors">✕</button>
                          </div>
                        ))}
                        {projectDocs.length === 0 && <p className="text-xs text-text-secondary">Belge yok</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {projects.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-text-secondary">Henüz proje eklenmemiş</p>
        </div>
      )}
    </div>
  )
}
