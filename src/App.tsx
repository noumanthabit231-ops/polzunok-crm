import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import History from './pages/History'
import AddEstablishment from './pages/AddEstablishment'

export default function App() {
  return (
    <div className="flex flex-col min-h-dvh">
      <header className="bg-amber-700 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <Link to="/" className="text-lg font-bold tracking-wide flex items-center gap-2 no-underline text-white">
          <span>📅</span>
          <span>Ползунок.CRM</span>
        </Link>
        <span className="text-amber-200 text-xs">подписки заведений</span>
      </header>

      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddEstablishment />} />
          <Route path="/history/:id" element={<History />} />
        </Routes>
      </main>

      <footer className="text-center text-xs text-stone-400 py-3 border-t border-amber-100">
        Ползунок.CRM — отслеживание подписок
      </footer>
    </div>
  )
}
