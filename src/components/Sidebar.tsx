'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Genel Bakış', href: '/' },
  { name: 'Projeler', href: '/projeler' },
  { name: 'Görevler', href: '/gorevler' },
  { name: 'Takvim', href: '/takvim' },
  { name: 'Timeline', href: '/timeline' },
  { name: 'Ekip', href: '/ekip' },
  { name: 'Mesajlar', href: '/mesajlar' },
  { name: 'Rapor', href: '/rapor' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="glass sticky top-0 z-50 mx-4 mt-4 mb-2 px-4 py-2 flex items-center justify-between" style={{ borderRadius: '16px' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 gold-gradient rounded-xl flex items-center justify-center text-white font-outfit font-bold text-xs">
          İG
        </div>
        <div className="hidden sm:block">
          <h1 className="font-outfit font-bold text-sm text-white leading-tight">İGAM</h1>
          <p className="text-[9px] text-white/40 leading-tight">İltica ve Göç Araştırmaları Merkezi</p>
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden lg:flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
                isActive
                  ? 'gold-gradient text-white font-medium shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              style={isActive ? { boxShadow: '0 0 15px rgba(201,168,76,0.3)' } : {}}
            >
              {tab.name}
            </Link>
          )
        })}
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Right side placeholder for alignment */}
      <div className="hidden lg:block w-9" />

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 mx-0 glass p-3 lg:hidden z-50" style={{ borderRadius: '16px' }}>
          <div className="grid grid-cols-2 gap-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm text-center transition-all ${
                    isActive
                      ? 'gold-gradient text-white font-medium'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
