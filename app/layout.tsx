import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'La incr Factory 🏭',
  description: 'Une collection d\'incremental games farfelus.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold">
              <a href="/" className="hover:text-blue-400 transition-colors">
                🏭 la incr factory
              </a>
            </h1>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto p-4">
          {children}
        </main>
        
        <footer className="bg-gray-800 border-t border-gray-700 p-4 mt-8">
          <div className="max-w-6xl mx-auto text-center text-gray-400">
            <h3>la incr factory &larr; vers la lune 🌒 &rarr; par <a href="https://me.nech.pl" className='hover:text-blue-400 underline'>PLN</a> &lt;3 </h3>
          </div>
        </footer>
      </body>
    </html>
  )
}