import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'İGAM Dashboard',
  description: 'İltica ve Göç Araştırmaları Merkezi - Takım Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-cream min-h-screen">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6 pt-16 lg:pt-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
