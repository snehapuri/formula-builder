import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Formula Builder Tool',
  description: 'Drug pricing calculations using dynamic formula configurations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} dark:bg-slate-900 min-h-screen`}>
        <main className="min-h-screen">
          <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-xl font-bold text-primary dark:text-blue-400">Formula Builder</h1>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <a href="/" className="border-transparent text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-slate-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Dashboard
                    </a>
                    <a href="/upload" className="border-transparent text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-slate-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Upload Data
                    </a>
                    <a href="/formulas" className="border-transparent text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-slate-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Formula Builder
                    </a>
                    <a href="/calculate" className="border-transparent text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-slate-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Calculate
                    </a>
                    <a href="/reports" className="border-transparent text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-slate-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Reports
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
} 