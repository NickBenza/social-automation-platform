import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Social Automation Platform',
  description: 'AI-powered social media community engagement',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}