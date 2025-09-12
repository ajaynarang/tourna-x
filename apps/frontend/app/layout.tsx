import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import MobileNavigation from '@/components/layout/mobile-navigation'
import DesktopNavigation from '@/components/layout/desktop-navigation'
import MobileBottomNavigation from '@/components/layout/mobile-bottom-navigation'
import Providers from '@/components/providers'
// import ServiceWorkerRegistration from '@/components/service-worker-registration'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tourna-X - Tournament Management System',
  description: 'Modern tournament management system for badminton and tennis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <MobileNavigation />
            <DesktopNavigation />
            <main className="pb-20 lg:pb-0">{children}</main>
            <MobileBottomNavigation />
          </div>
        </Providers>
      </body>
    </html>
  )
}
