import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Incremental Games Factory',
  description: 'A collection of incremental and idle games',
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
                🏭 Incremental Games Factory
              </a>
            </h1>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto p-4">
          {children}
        </main>
        
        <footer className="bg-gray-800 border-t border-gray-700 p-4 mt-8">
          <div className="max-w-6xl mx-auto text-center text-gray-400">
            <p>Incremental Games Factory - Build, Idle, Progress</p>
          </div>
        </footer>
      </body>
    </html>
  )
}