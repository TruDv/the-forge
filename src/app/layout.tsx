import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import FooterWrapper from '@/components/FooterWrapper'
import PushManager from '@/components/PushManager'
import MobileTabs from '@/components/MobileTabs' // <--- Added the new component

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
        {/* Initialize Notifications (Invisible) */}
        <PushManager /> 

        {/* Navigation */}
        <NavbarWrapper />
        
        {/* Main Content 
          Added 'pb-20' on mobile to prevent the Bottom Nav from covering content.
          'md:pb-0' removes that padding on desktop screens.
        */}
<main className="w-full flex-grow pb-safe-area md:pb-0">
  {children}
</main>

        {/* Footer (Now automatically hidden on mobile via internal logic) */}
        <FooterWrapper /> 

        {/* Mobile Tab Bar (Visible only on mobile via 'md:hidden' inside the component) */}
        <MobileTabs />
      </body>
    </html>
  )
}