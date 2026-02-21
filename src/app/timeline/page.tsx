'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Project } from '@/lib/types'
import LoadingSpinner from '@/components/LoadingSpinner'

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const YEAR = 2026
const YEAR_START = new Date(YEAR, 0, 1).getTime()
const YEAR_END = new Date(YEAR, 11, 31).getTime()
const TOTAL_DAYS = (YEAR_END - YEAR_START) / (1000 * 60 * 60 * 24)

export default function Timeline() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('projects').select('*').order('start_date').then(({ data }) => {
      if (data) setProjects(data)
      setLoading(false)
    })
  }, [])

  function getBarStyle(start: string, end: string) {
    const s = Math.max(new Date(start).getTime(), YEAR_START)
    const e = Math.min(new Date(end).getTime(), YEAR_END)
    const left = ((s - YEAR_START) / (1000 * 60 * 60 * 24)) / TOTAL_DAYS * 100
    const width = ((e - s) / (1000 * 60 * 60 * 24)) / TOTAL_DAYS * 100
    return { left: `${Math.max(left, 0)}%`, width: `${Math.max(width, 1)}%` }
  }

  const todayOffset = ((Date.now() - YEAR_START) / (1000 * 60 * 60 * 24)) / TOTAL_DAYS * 100

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-outfit font-bold text-2xl text-text-primary">Timeline</h2>
        <p className="text-sm text-text-secondary mt-1">2026 Proje Zaman Çizelgesi</p>
      </div>

      <div className="glass-card p-5 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Month headers */}
          <div className="flex border-b border-black/[0.06] pb-2 mb-4 pl-48">
            {MONTHS.map((m, i) => (
              <div key={i} className="flex-1 text-center text-xs text-text-secondary font-medium">
                {m}
              </div>
            ))}
          </div>

          {/* Projects */}
          <div className="relative space-y-3">
            {/* Today line */}
            {todayOffset >= 0 && todayOffset <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-gold z-10"
                style={{ left: `calc(192px + (100% - 192px) * ${todayOffset / 100})` }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gold text-white text-[9px] rounded-full whitespace-nowrap">
                  Bugün
                </div>
              </div>
            )}

            {/* Month grid lines */}
            <div className="absolute inset-0 pl-48 pointer-events-none">
              {MONTHS.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-black/[0.04]"
                  style={{ left: `${(i / 12) * 100}%` }}
                />
              ))}
            </div>

            {projects.map((project) => {
              if (!project.start_date || !project.end_date) return null
              const barStyle = getBarStyle(project.start_date, project.end_date)
              return (
                <div key={project.id} className="flex items-center h-10 group">
                  <div className="w-48 shrink-0 pr-4">
                    <p className="text-sm text-text-primary truncate font-medium">{project.title}</p>
                    <p className="text-[10px] text-text-secondary">
                      {new Date(project.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {new Date(project.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1 relative h-8">
                    <div
                      className="absolute h-full rounded-lg overflow-hidden transition-all duration-300 group-hover:shadow-md"
                      style={{ ...barStyle, background: project.color + '30' }}
                    >
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{ width: `${project.progress}%`, background: project.color }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-text-primary">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {projects.length === 0 && (
              <div className="text-center py-12 text-text-secondary text-sm">
                Proje zaman çizelgesi için proje ekleyin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
