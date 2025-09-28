import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '../contexts/AuthContext'
import { Toaster } from '../components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: '灵感绿洲 - 创意协作平台',
  description: '唤醒团队的伟大想法，让创意在这里生根发芽',
  generator: 'Next.js',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
