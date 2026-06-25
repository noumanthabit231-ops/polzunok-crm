import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import History from './pages/History'
import AddEstablishment from './pages/AddEstablishment'

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="flex flex-col min-h-dvh">
      <header style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid hsl(210, 15%, 90%)',
      }} className="px-4 py-3 sticky top-0 z-20">
        <div className="max-w-xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'hsl(210, 60%, 50%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'white', fontWeight: 600,
            }}>P</div>
            <span style={{ fontWeight: 600, fontSize: 15, color: 'hsl(210, 15%, 20%)', letterSpacing: '-0.3px' }}>
              Ползунок
            </span>
          </Link>
          {isHome && (
            <Link to="/add" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'hsl(210, 60%, 50%)', color: 'white',
              padding: '8px 16px', borderRadius: 8,
              fontWeight: 500, fontSize: 13,
              textDecoration: 'none', transition: 'all 0.15s',
            }}
              className="hover:bg-[hsl(210,60%,43%)] active:scale-[0.97]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Новое
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddEstablishment />} />
          <Route path="/history/:id" element={<History />} />
        </Routes>
      </main>
    </div>
  )
}
