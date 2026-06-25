import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import History from './pages/History'
import AddEstablishment from './pages/AddEstablishment'

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-amber-200/50 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-lg shadow-sm group-hover:shadow-md transition-shadow">
              📅
            </div>
            <div>
              <span className="font-bold text-stone-800 text-lg tracking-tight">Ползунок</span>
              <span className="text-amber-600 font-bold text-lg tracking-tight">.CRM</span>
            </div>
          </Link>
          {isHome && (
            <Link
              to="/add"
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all active:scale-95 no-underline text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Новое</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddEstablishment />} />
          <Route path="/history/:id" element={<History />} />
        </Routes>
      </main>
    </div>
  )
}
