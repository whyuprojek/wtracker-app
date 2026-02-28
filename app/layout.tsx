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
  manifest: '/manifest.json', // Memanggil file PWA yang kita buat tadi
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