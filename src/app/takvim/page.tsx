'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Event, Task, TeamMember } from '@/lib/types'
import LoadingSpinner from '@/components/LoadingSpinner'

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const EVENT_TYPES = [
  { value: 'meeting', label: 'Toplantı', color: '#3B82F6' },
  { value: 'seminar', label: 'Seminer', color: '#C9A84C' },
  { value: 'deadline', label: 'Teslim', color: '#EF4444' },
  { value: 'fieldwork', label: 'Saha', color: '#22C55E' },
]

export default function Takvim() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', event_date: '', event_time: '', type: 'meeting', members: [] as number[], color: '#3B82F6' })

  useEffect(() => {
    async function load() {
      const [e, t, tm] = await Promise.all([
        supabase.from('events').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('team').select('*'),
      ])
      if (e.data) setEvents(e.data)
      if (t.data) setTasks(t.data)
      if (tm.data) setTeam(tm.data)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('calendar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        supabase.from('events').select('*').then(({ data }) => { if (data) setEvents(data) })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        supabase.from('tasks').select('*').then(({ data }) => { if (data) setTasks(data) })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }

  function getDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function getEventsForDay(day: number) {
    const ds = getDateStr(day)
    return events.filter(e => e.event_date === ds)
  }

  function getTasksForDay(day: number) {
    const ds = getDateStr(day)
    return tasks.filter(t => t.due_date === ds)
  }

  function toggleMember(id: number) {
    setForm(f => ({
      ...f,
      members: f.members.includes(id) ? f.members.filter(m => m !== id) : [...f.members, id]
    }))
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('events').insert([form])
    setForm({ title: '', event_date: '', event_time: '', type: 'meeting', members: [], color: '#3B82F6' })
    setShowForm(false)
    const { data } = await supabase.from('events').select('*')
    if (data) setEvents(data)
  }

  if (loading) return <LoadingSpinner />

  const today = new Date()
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

  const dayEvents = selectedDay ? events.filter(e => e.event_date === selectedDay) : []
  const dayTasks = selectedDay ? tasks.filter(t => t.due_date === selectedDay) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-outfit font-bold text-2xl text-white">Takvim</h2>
          <p className="text-sm text-white/60 mt-1">Etkinlikler ve teslim tarihleri</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 gold-gradient text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Etkinlik Ekle
        </button>
      </div>

      {/* Event Add Form */}
      {showForm && (
        <form onSubmit={addEvent} className="glass p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Etkinlik adı"
              required
              className="dark-input"
            />
            <select
              value={form.type}
              onChange={e => {
                const t = EVENT_TYPES.find(et => et.value === e.target.value)
                setForm({ ...form, type: e.target.value, color: t?.color || '#3B82F6' })
              }}
              className="dark-input"
            >
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.event_date}
              onChange={e => setForm({ ...form, event_date: e.target.value })}
              required
              className="dark-input"
            />
            <input
              type="time"
              value={form.event_time}
              onChange={e => setForm({ ...form, event_time: e.target.value })}
              className="dark-input"
            />
          </div>
          <div>
            <p className="text-xs text-white/60 mb-2">Katılımcılar</p>
            <div className="flex gap-2 flex-wrap">
              {team.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 border ${
                    form.members.includes(m.id)
                      ? 'bg-[#C9A84C]/20 text-gold border-[#C9A84C]/40'
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  <span>{m.avatar}</span> {m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 gold-gradient text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              Ekle
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:bg-white/[0.08] transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Main Area: Calendar + Detail Panel */}
      <div className="flex gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 glass p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-colors text-sm text-white/60"
            >
              ←
            </button>
            <h3 className="font-outfit font-semibold text-lg text-white">
              {MONTH_NAMES[month]} {year}
            </h3>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-colors text-sm text-white/60"
            >
              →
            </button>
          </div>

          {/* Day Name Headers */}
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs text-white/40 font-medium py-2">
                {d}
              </div>
            ))}

            {/* Empty Offset Cells */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20" />
            ))}

            {/* Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayStr = getDateStr(day)
              const de = getEventsForDay(day)
              const dt = getTasksForDay(day)
              const selected = selectedDay === dayStr

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(selected ? null : dayStr)}
                  className={`h-20 rounded-xl p-1.5 cursor-pointer transition-all duration-200 border ${
                    selected
                      ? 'border-[#C9A84C] bg-[#C9A84C]/10'
                      : 'border-transparent hover:bg-white/[0.05]'
                  } ${isToday(day) ? 'ring-2 ring-[#C9A84C]/30' : ''}`}
                >
                  <span className={`text-xs font-medium ${isToday(day) ? 'text-gold' : 'text-white'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {de.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        className="text-[8px] px-1 py-0.5 rounded truncate text-white font-medium"
                        style={{ background: ev.color }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dt.slice(0, 1).map(t => (
                      <div
                        key={t.id}
                        className="text-[8px] px-1 py-0.5 rounded truncate bg-[#EF4444]/20 text-[#EF4444]"
                      >
                        {t.title}
                      </div>
                    ))}
                    {(de.length + dt.length > 3) && (
                      <span className="text-[8px] text-white/40">+{de.length + dt.length - 3}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedDay && (
          <div className="w-80 glass p-5 shrink-0 self-start">
            <h3 className="font-outfit font-semibold text-sm text-white mb-4">
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>

            {/* Day Events */}
            {dayEvents.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Etkinlikler</p>
                {dayEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-2 py-2 border-b border-white/[0.06] last:border-0">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: ev.color }} />
                    <div>
                      <p className="text-sm font-medium text-white">{ev.title}</p>
                      <p className="text-[10px] text-white/40">
                        {EVENT_TYPES.find(t => t.value === ev.type)?.label} · {ev.event_time}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {ev.members?.map(mid => {
                          const m = team.find(t => t.id === mid)
                          return m ? (
                            <span key={mid} className="text-xs" title={m.name}>{m.avatar}</span>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Day Tasks */}
            {dayTasks.length > 0 && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Teslim Tarihleri</p>
                {dayTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 py-2 border-b border-white/[0.06] last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      t.priority === 'high'
                        ? 'bg-[#EF4444]'
                        : t.priority === 'medium'
                        ? 'bg-[#FBBF24]'
                        : 'bg-[#22C55E]'
                    }`} />
                    <span className="text-sm text-white">{t.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {dayEvents.length === 0 && dayTasks.length === 0 && (
              <p className="text-sm text-white/40">Bu günde etkinlik yok</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
