import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import FooterWrapper from '@/components/FooterWrapper'
import PushManager from '@/components/PushManager' // <--- Imported correctly at the top

export const metadata = {
  title: 'The Forge | Community',
  description: 'A space for fellowship, prayer, and growth.',
  manifest: '/manifest.json', // <--- Essential for the App Install feature
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-slate-50 min-h-screen font-sans antialiased flex flex-col">
        {/* Initialize Notifications (Invisible) */}
        <PushManager /> 

        {/* Navigation */}
        <NavbarWrapper />
        
        {/* Main Content */}
        <main className="w-full flex-grow">
          {children}
        </main>

        {/* Footer */}
        <FooterWrapper /> 
      </body>
    </html>
  )
}