import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import FooterWrapper from '@/components/FooterWrapper'
import PushManager from '@/components/PushManager'
// REMOVE: import MobileTabs from '@/components/MobileTabs' 

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
      <body className="bg-slate-50 min-h-screen font-sans antialiased flex flex-col">
        <PushManager /> 

        {/* This wrapper now controls both Top Nav and Bottom Tabs */}
        <NavbarWrapper />
        
        <main className="w-full flex-grow pb-safe-area md:pb-0">
          {children}
        </main>

        <FooterWrapper /> 

        {/* REMOVE: <MobileTabs /> */}
      </body>
    </html>
  )
}