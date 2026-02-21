'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Genel Bakış', href: '/', icon: '📊' },
  { name: 'Projeler', href: '/projeler', icon: '📁' },
  { name: 'Timeline', href: '/timeline', icon: '📅' },
  { name: 'Takvim', href: '/takvim', icon: '🗓️' },
  { name: 'Ekip', href: '/ekip', icon: '👥' },
  { name: 'Görevler', href: '/gorevler', icon: '✅' },
  { name: 'Mesajlar', href: '/mesajlar', icon: '💬' },
  { name: 'Rapor', href: '/rapor', icon: '📈' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl border border-black/[0.06] flex items-center justify-center shadow-sm"
      >
        <span className="text-lg">☰</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        fixed lg:relative inset-y-0 left-0 z-40
        w-64 bg-white/90 lg:bg-white/65 backdrop-blur-sm border-r border-black/[0.06]
        flex flex-col transition-all duration-300 shrink-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 flex items-center justify-between border-b border-black/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center text-white font-outfit font-bold text-sm shrink-0">
              İG
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-outfit font-bold text-sm text-text-primary">İGAM</h1>
                <p className="text-[10px] text-text-secondary leading-tight">İltica ve Göç Araştırmaları Merkezi</p>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-black/[0.03]"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gold/10 text-gold font-medium'
                    : 'text-text-secondary hover:bg-black/[0.03] hover:text-text-primary'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {!collapsed && <span>{tab.name}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-black/[0.06] hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-black/[0.03] transition-colors"
          >
            <span>{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Daralt</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
