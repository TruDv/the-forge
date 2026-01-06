import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import FooterWrapper from '@/components/FooterWrapper' // <--- IMPORTANT: Import the Wrapper

export const metadata = {
  title: 'The Forge | Community',
  description: 'A space for fellowship, prayer, and growth.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-slate-50 min-h-screen font-sans antialiased flex flex-col">
        <NavbarWrapper />
        
        <main className="w-full flex-grow">
          {children}
        </main>

        {/* Use FooterWrapper here. It will decide whether to show the footer or not. */}
        <FooterWrapper /> 
      </body>
    </html>
  )
}