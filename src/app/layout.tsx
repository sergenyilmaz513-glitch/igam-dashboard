import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import './globals.css'

const NavBar = dynamic(() => import('@/components/Sidebar'), { ssr: false })
const Header = dynamic(() => import('@/components/Header'), { ssr: false })

export const metadata: Metadata = {
  title: 'İGAM Dashboard',
  description: 'İltica ve Göç Araştırmaları Merkezi - Takım Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen">
        <NavBar />
        <Header />
        <main className="px-4 lg:px-6 pb-6">
          {children}
        </main>
      </body>
    </html>
  )
}
