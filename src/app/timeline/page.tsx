'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Project } from '@/lib/types'
import LoadingSpinner from '@/components/LoadingSpinner'

const MONTHS = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara']
const YEAR = 2026
const YEAR_START = new Date(YEAR, 0, 1).getTime()
const YEAR_END = new Date(YEAR + 1, 0, 1).getTime()
const TOTAL_MS = YEAR_END - YEAR_START

function dateToPct(date: string | number): number {
  const ms = typeof date === 'number' ? date : new Date(date).getTime()
  return ((ms - YEAR_START) / TOTAL_MS) * 100
}

export default function Timeline() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .order('start_date')
      .then(({ data }) => {
        if (data) setProjects(data)
        setLoading(false)
      })
  }, [])

  function getBarPosition(start: string, end: string) {
    const s = Math.max(new Date(start).getTime(), YEAR_START)
    const e = Math.min(new Date(end).getTime(), YEAR_END)
    const left = dateToPct(s)
    const right = dateToPct(e)
    const width = right - left
    return { left: `${Math.max(left, 0)}%`, width: `${Math.max(width, 0.5)}%` }
  }

  const todayPct = dateToPct(Date.now())
  const showToday = todayPct >= 0 && todayPct <= 100

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-outfit font-bold text-2xl text-white">Timeline</h2>
        <p className="text-sm text-white/60 mt-1">2026 Proje Zaman Cizelgesi</p>
      </div>

      {/* Glass Container */}
      <div className="glass p-5 overflow-x-auto">
        <div style={{ minWidth: 900 }}>
          {/* Month Headers */}
          <div className="flex border-b border-white/10 pb-3 mb-4 pl-48">
            {MONTHS.map((m, i) => (
              <div
                key={i}
                className="flex-1 text-center text-xs text-white/60 font-medium select-none"
              >
                {m}
              </div>
            ))}
          </div>

          {/* Gantt Rows */}
          <div className="relative space-y-3">
            {/* Monthly vertical grid lines */}
            <div className="absolute inset-0 pl-48 pointer-events-none">
              {MONTHS.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-white/5"
                  style={{ left: `${(i / 12) * 100}%` }}
                />
              ))}
              {/* Closing line for December */}
              <div
                className="absolute top-0 bottom-0 border-l border-white/5"
                style={{ left: '100%' }}
              />
            </div>

            {/* Today line */}
            {showToday && (
              <div
                className="absolute top-0 bottom-0 z-10 pointer-events-none"
                style={{ left: `calc(192px + (100% - 192px) * ${todayPct / 100})` }}
              >
                <div className="absolute inset-y-0 w-px gold-gradient" />
                <div
                  className="absolute -top-6 left-1/2 -translate-x-1/2 px-2.5 py-1 gold-gradient text-white text-[10px] font-semibold rounded-full whitespace-nowrap shadow-lg"
                  style={{ boxShadow: '0 0 12px rgba(201,168,76,0.4)' }}
                >
                  Bugun
                </div>
              </div>
            )}

            {/* Project rows */}
            {projects.map((project) => {
              if (!project.start_date || !project.end_date) return null
              const bar = getBarPosition(project.start_date, project.end_date)

              return (
                <div key={project.id} className="flex items-center h-12 group">
                  {/* Project name */}
                  <div className="w-48 shrink-0 pr-4">
                    <p className="text-sm text-white font-medium truncate">
                      {project.title}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {new Date(project.start_date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      -{' '}
                      {new Date(project.end_date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative h-9">
                    <div
                      className="absolute h-full rounded-lg overflow-hidden transition-all duration-300 group-hover:scale-y-110 group-hover:shadow-lg"
                      style={{
                        ...bar,
                        backgroundColor: project.color + '20',
                        border: `1px solid ${project.color}30`,
                      }}
                    >
                      {/* Progress fill */}
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{
                          width: `${project.progress}%`,
                          background: `linear-gradient(90deg, ${project.color}CC, ${project.color})`,
                        }}
                      />
                      {/* Progress label */}
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Empty state */}
            {projects.length === 0 && (
              <div className="text-center py-16 text-white/40 text-sm">
                Proje zaman cizelgesi icin proje ekleyin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
