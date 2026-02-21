'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Project, Task, Document, TeamMember } from '@/lib/types'

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

  const statusLabel: Record<string, string> = { 'todo': 'Yapilacak', 'in-progress': 'Devam Ediyor', 'done': 'Tamamlandi' }
  const statusColor: Record<string, string> = {
    'todo': 'bg-[#FBBF24]/20 text-[#FBBF24]',
    'in-progress': 'bg-[#3B82F6]/20 text-[#3B82F6]',
    'done': 'bg-[#22C55E]/20 text-[#22C55E]'
  }
  const statusBarColor: Record<string, string> = {
    'todo': '#FBBF24',
    'in-progress': '#3B82F6',
    'done': '#22C55E'
  }

  function timelineWidth(start: string, end: string) {
    if (!start || !end) return { left: '0%', width: '100%' }
    const now = Date.now()
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    const total = e - s
    if (total <= 0) return { left: '0%', width: '100%' }
    const elapsed = Math.min(Math.max((now - s) / total, 0), 1)
    return { width: '100%', background: `linear-gradient(90deg, #C9A84C ${elapsed * 100}%, rgba(255,255,255,0.1) ${elapsed * 100}%)` }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-white">Projeler</h2>
          <p className="text-sm text-white/60 mt-1">{projects.length} aktif proje</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[#C9A84C]/20"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #B8963F)' }}
        >
          + Yeni Proje
        </button>
      </div>

      {/* New Project Form */}
      {showForm && (
        <form
          onSubmit={addProject}
          className="p-6 space-y-4"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
          }}
        >
          <h3 className="text-white font-semibold text-sm mb-2">Yeni Proje Olustur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Proje adi"
              required
              className="px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all appearance-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="todo" className="bg-[#1a1a2e] text-white">Yapilacak</option>
              <option value="in-progress" className="bg-[#1a1a2e] text-white">Devam Ediyor</option>
              <option value="done" className="bg-[#1a1a2e] text-white">Tamamlandi</option>
            </select>
            <input
              type="date"
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
              className="px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all [color-scheme:dark]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <input
              type="date"
              value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
              className="px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all [color-scheme:dark]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Aciklama"
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <div>
            <p className="text-xs text-white/60 mb-2">Ekip Uyeleri</p>
            <div className="flex flex-wrap gap-2">
              {team.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    form.members.includes(m.id)
                      ? 'bg-[#C9A84C]/20 text-[#C9A84C] ring-1 ring-[#C9A84C]/40'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span>{m.avatar}</span> {m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/60">Ilerleme: <span className="text-[#C9A84C] font-semibold">{form.progress}%</span></label>
            <input
              type="range"
              min="0"
              max="100"
              value={form.progress}
              onChange={e => setForm({ ...form, progress: parseInt(e.target.value) })}
              className="flex-1 accent-[#C9A84C] h-1.5"
            />
            <input
              type="color"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #B8963F)' }}
            >
              Ekle
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl text-sm text-white/60 bg-white/5 hover:bg-white/10 transition-all duration-200"
            >
              Iptal
            </button>
          </div>
        </form>
      )}

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const projectTasks = tasks.filter(t => t.project_id === project.id)
          const projectDocs = docs.filter(d => d.project_id === project.id)
          const isExpanded = expandedId === project.id
          const barColor = statusBarColor[project.status] || '#C9A84C'

          return (
            <div
              key={project.id}
              className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'md:col-span-2' : ''}`}
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
              }}
            >
              {/* Card Main Content */}
              <div
                className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
              >
                {/* Title + Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0 shadow-lg" style={{ background: project.color, boxShadow: `0 0 8px ${project.color}40` }} />
                    <h3 className="font-semibold text-base text-white">{project.title}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${statusColor[project.status]}`}>
                    {statusLabel[project.status]}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-white/60 mb-4 line-clamp-2">{project.description}</p>

                {/* Progress */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/60">Ilerleme</span>
                  <span className="text-xs font-semibold text-[#C9A84C]">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%`, background: barColor, boxShadow: `0 0 6px ${barColor}60` }}
                  />
                </div>

                {/* Timeline */}
                {project.start_date && project.end_date && (
                  <div className="h-1.5 rounded-full overflow-hidden mb-4" style={timelineWidth(project.start_date, project.end_date)} />
                )}

                {/* Members + Date */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {project.members?.map((mid) => {
                      const m = getMember(mid)
                      return m ? (
                        <div
                          key={mid}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                          style={{ background: m.color, border: '2px solid rgba(255,255,255,0.15)' }}
                          title={m.name}
                        >
                          {m.avatar}
                        </div>
                      ) : null
                    })}
                  </div>
                  <span className="text-[10px] text-white/40">
                    {project.start_date && new Date(project.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`}
                  </span>
                </div>
              </div>

              {/* Expanded Section */}
              {isExpanded && (
                <div className="p-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tasks */}
                    <div>
                      <h4 className="font-semibold text-sm text-white mb-3">Gorevler ({projectTasks.length})</h4>
                      <div className="space-y-2">
                        {projectTasks.map(task => {
                          const m = getMember(task.assignee)
                          return (
                            <div
                              key={task.id}
                              className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.05]"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                              <div className="flex items-center gap-2">
                                {m && <span className="text-sm">{m.avatar}</span>}
                                <span className="text-sm text-white">{task.title}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[task.status]}`}>
                                {statusLabel[task.status]}
                              </span>
                            </div>
                          )
                        })}
                        {projectTasks.length === 0 && <p className="text-xs text-white/40">Gorev yok</p>}
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-white">Belgeler ({projectDocs.length})</h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDocForm(showDocForm === project.id ? null : project.id) }}
                          className="text-xs text-[#C9A84C] hover:text-[#d4b35a] transition-colors"
                        >
                          + Belge Ekle
                        </button>
                      </div>

                      {/* Document Form */}
                      {showDocForm === project.id && (
                        <form
                          onSubmit={(e) => addDocument(e, project.id)}
                          className="rounded-xl p-4 mb-3 space-y-3"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            value={docForm.name}
                            onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                            placeholder="Belge adi"
                            required
                            className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          <input
                            value={docForm.url}
                            onChange={e => setDocForm({ ...docForm, url: e.target.value })}
                            placeholder="URL veya dosya yolu"
                            required
                            className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={docForm.category}
                              onChange={e => setDocForm({ ...docForm, category: e.target.value })}
                              className="px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all appearance-none"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                              <option value="" className="bg-[#1a1a2e] text-white">Kategori sec</option>
                              <option value="rapor" className="bg-[#1a1a2e] text-white">Rapor</option>
                              <option value="sunum" className="bg-[#1a1a2e] text-white">Sunum</option>
                              <option value="analiz" className="bg-[#1a1a2e] text-white">Analiz</option>
                              <option value="diger" className="bg-[#1a1a2e] text-white">Diger</option>
                            </select>
                            <select
                              value={docForm.uploaded_by}
                              onChange={e => setDocForm({ ...docForm, uploaded_by: parseInt(e.target.value) })}
                              className="px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all appearance-none"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                              <option value={0} className="bg-[#1a1a2e] text-white">Yukleyen sec</option>
                              {team.map(m => <option key={m.id} value={m.id} className="bg-[#1a1a2e] text-white">{m.name}</option>)}
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #C9A84C, #B8963F)' }}
                          >
                            Ekle
                          </button>
                        </form>
                      )}

                      {/* Document List */}
                      <div className="space-y-2">
                        {projectDocs.map(doc => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.05]"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm shrink-0">📄</span>
                              <div className="min-w-0">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#C9A84C] hover:text-[#d4b35a] transition-colors truncate block">
                                  {doc.name}
                                </a>
                                <p className="text-[10px] text-white/40">{doc.category} · {getMember(doc.uploaded_by)?.name}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id) }}
                              className="text-white/40 hover:text-red-400 text-sm transition-colors shrink-0 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {projectDocs.length === 0 && <p className="text-xs text-white/40">Belge yok</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div
          className="p-12 text-center"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
          }}
        >
          <p className="text-white/60">Henuz proje eklenmemis</p>
        </div>
      )}
    </div>
  )
}
