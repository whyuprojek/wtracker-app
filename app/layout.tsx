import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google' // atau font yang kamu pakai
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Ini untuk ngasih tau warna atas (status bar) HP Android kamu
export const viewport: Viewport = {
  themeColor: '#5468ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'WTracker - Trading Journal',
  description: 'Track your trades and manage risk easily.',
  manifest: '/manifest.json',
  // Tambahkan baris di bawah ini:
  icons: {
    icon: '/icon-192x192.png',
    shortcut: '/icon-192x192.png',
    apple: '/icon-192x192.png', // Sangat penting buat iPhone/iPad
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