import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EDT Sales Funnel 2026',
  description: 'EDT internal sales pipeline and monthly target tracker',
  icons: {
    icon: [
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon/favicon.ico', sizes: 'any' },
    ],
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/favicon/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#2D2DFF" />
      </head>
      <body className="bg-edt-black text-white antialiased">
        {children}
      </body>
    </html>
  )
}
