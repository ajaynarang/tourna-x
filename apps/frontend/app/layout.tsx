import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { RootLayoutClient } from './layout-client'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Tourna-X - Tournament Management System',
  description: 'Modern tournament management system for badminton and tennis',
  // Only include manifest in production
  ...(process.env.NODE_ENV === 'production' && { manifest: '/manifest.json' }),
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        {/* PWA meta tags - only in production */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="Tourna-X" />
            <meta name="application-name" content="Tourna-X" />
            <meta name="msapplication-TileColor" content="#3b82f6" />
            <meta name="msapplication-config" content="/browserconfig.xml" />
            <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
          </>
        )}
      </head>
      <body className={inter.variable}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}
