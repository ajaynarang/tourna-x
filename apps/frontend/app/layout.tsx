import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { RootLayoutClient } from './layout-client'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

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
    <html lang="en" className="dark">
      <body className={inter.variable}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}
