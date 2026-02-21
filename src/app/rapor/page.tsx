'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember, Task, Project } from '@/lib/types'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Rapor() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [tm, t, p] = await Promise.all([
        supabase.from('team').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('projects').select('*'),
      ])
      if (tm.data) setTeam(tm.data)
      if (t.data) setTasks(t.data)
      if (p.data) setProjects(p.data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />

  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
  const todoTasks = tasks.filter(t => t.status === 'todo').length
  const highPriority = tasks.filter(t => t.priority === 'high').length
  const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const categories = tasks.reduce<Record<string, { total: number; done: number }>>((acc, t) => {
    const cat = t.category || 'Genel'
    if (!acc[cat]) acc[cat] = { total: 0, done: 0 }
    acc[cat].total++
    if (t.status === 'done') acc[cat].done++
    return acc
  }, {})

  function getMemberPerformance(memberId: number) {
    const memberTasks = tasks.filter(t => t.assignee === memberId)
    const total = memberTasks.length
    const done = memberTasks.filter(t => t.status === 'done').length
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-outfit font-bold text-2xl text-white">Rapor</h2>
        <p className="text-sm text-white/60 mt-1">Performans ve istatistikler</p>
      </div>

      {/* Person Performance */}
      <div className="glass p-5">
        <h3 className="font-outfit font-semibold text-sm text-white mb-4">Kisi Bazli Performans</h3>
        <div className="space-y-4">
          {team.map(member => {
            const perf = getMemberPerformance(member.id)
            return (
              <div key={member.id} className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ background: member.color }}
                >
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-white">{member.name}</span>
                      <span className="text-[10px] text-white/60 ml-2">{member.role}</span>
                    </div>
                    <span className="text-sm font-semibold text-gold">{perf.pct}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${perf.pct}%`, background: member.color }}
                    />
                  </div>
                  <p className="text-[10px] text-white/60 mt-1">{perf.done} / {perf.total} gorev tamamlandi</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category Stats - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 text-center">
          <p className="text-3xl font-outfit font-bold text-gold">{totalTasks}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Toplam Gorev</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-3xl font-outfit font-bold" style={{ color: '#22C55E' }}>{doneTasks}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Tamamlanan</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-3xl font-outfit font-bold" style={{ color: '#3B82F6' }}>{inProgressTasks}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Devam Eden</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-3xl font-outfit font-bold" style={{ color: '#EF4444' }}>{highPriority}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Yuksek Oncelik</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass p-5">
        <h3 className="font-outfit font-semibold text-sm text-white mb-4">Kategori Bazli Istatistikler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categories).map(([cat, data]) => {
            const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0
            return (
              <div key={cat} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{cat}</span>
                  <span className="text-xs text-gold font-semibold">{pct}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div className="h-full gold-gradient rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-white/60">{data.done}/{data.total} tamamlandi</p>
              </div>
            )
          })}
          {Object.keys(categories).length === 0 && (
            <p className="text-sm text-[#9CA3AF] col-span-full">Kategori verisi yok</p>
          )}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="glass p-5">
        <h3 className="font-outfit font-semibold text-sm text-white mb-4">Haftalik Ozet</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Genel Tamamlanma Orani */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-[#9CA3AF] mb-2">Genel Tamamlanma Orani</p>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="3"
                    strokeDasharray={`${overallPct}, 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gold">{overallPct}%</span>
              </div>
              <div>
                <p className="text-lg font-outfit font-bold text-white">{doneTasks}</p>
                <p className="text-[10px] text-white/60">gorev tamamlandi</p>
              </div>
            </div>
          </div>

          {/* Aktif Projeler */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-[#9CA3AF] mb-2">Aktif Projeler</p>
            <p className="text-2xl font-outfit font-bold" style={{ color: '#3B82F6' }}>
              {projects.filter(p => p.status === 'in-progress').length}
            </p>
            <p className="text-[10px] text-white/60 mt-1">{projects.length} toplam projeden</p>
          </div>

          {/* Bekleyen Gorevler */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-[#9CA3AF] mb-2">Bekleyen Gorevler</p>
            <p className="text-2xl font-outfit font-bold" style={{ color: '#FBBF24' }}>{todoTasks}</p>
            <p className="text-[10px] text-white/60 mt-1">{highPriority} yuksek oncelikli</p>
          </div>
        </div>
      </div>
    </div>
  )
}
