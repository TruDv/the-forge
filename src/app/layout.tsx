import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import FooterWrapper from '@/components/FooterWrapper'
import PushManager from '@/components/PushManager'
import Script from 'next/script' // <--- 1. IMPORT THIS

import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: 'resizes-content',
}

export const metadata = {
  title: 'The Forge | Community',
  description: 'A space for fellowship, prayer, and growth.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* <--- 2. ADD THIS SCRIPT TAG */}
        <Script 
          src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body className="bg-slate-50 min-h-screen font-sans antialiased flex flex-col">
        <PushManager />

        {/* This wrapper now controls both Top Nav and Bottom Tabs */}
        <NavbarWrapper />

        <main className="w-full flex-grow pb-safe-area md:pb-0 min-h-0">
          {children}
        </main>

        <FooterWrapper />
      </body>
    </html>
  )
}