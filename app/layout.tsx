import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Konfigurasi tampilan di HP (Warna Status Bar)
export const viewport: Viewport = {
  themeColor: '#5468ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// Metadata untuk SEO dan PWA (Ikon Aplikasi)
export const metadata: Metadata = {
  title: 'WTracker - Trading Journal',
  description: 'Track your trades and manage risk easily.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    shortcut: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WTracker',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  )
}