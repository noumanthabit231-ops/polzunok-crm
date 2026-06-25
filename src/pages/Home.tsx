import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchEstablishments,
  fetchPayments,
  computeEstablishmentStatus,
  deleteEstablishment,
} from '../api'
import type { EstablishmentWithStatus } from '../types'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function Home() {
  const [items, setItems] = useState<EstablishmentWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const establishments = await fetchEstablishments()
      const withPayments = await Promise.all(
        establishments.map(async (est) => {
          const payments = await fetchPayments(est.id)
          return computeEstablishmentStatus(est, payments)
        })
      )
      setItems(withPayments)
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить «${name}» и все её платежи?`)) return
    try {
      await deleteEstablishment(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (e: any) {
      alert('Ошибка: ' + e.message)
    }
  }

  const getBarColor = (pct: number) => {
    if (pct < 50) return 'bg-emerald-500'
    if (pct < 75) return 'bg-amber-400'
    if (pct < 90) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getBadgeColor = (pct: number) => {
    if (pct < 50) return 'bg-emerald-100 text-emerald-700'
    if (pct < 75) return 'bg-amber-100 text-amber-700'
    if (pct < 90) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="animate-fadeIn">
      {/* Stats header */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/70 backdrop-blur rounded-2xl p-3.5 text-center border border-amber-100/50 shadow-sm">
            <div className="text-2xl font-bold text-amber-700">{items.length}</div>
            <div className="text-xs text-stone-500 mt-0.5">Заведений</div>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-2xl p-3.5 text-center border border-amber-100/50 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600">
              {items.filter((i) => i.isActive).length}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">Активных</div>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-2xl p-3.5 text-center border border-amber-100/50 shadow-sm">
            <div className="text-2xl font-bold text-red-500">
              {items.filter((i) => !i.isActive).length}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">Истекло</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
          <p className="text-stone-400 text-sm">Загрузка...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 animate-slideUp">
          <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center text-4xl mb-5 shadow-sm">
            📋
          </div>
          <h2 className="text-xl font-bold text-stone-700 mb-2">Пока пусто</h2>
          <p className="text-stone-400 text-sm mb-6">Добавьте первое заведение</p>
          <Link
            to="/add"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all active:scale-95 no-underline"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Добавить заведение
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl shadow-sm border border-amber-100/80 overflow-hidden hover:shadow-md transition-all animate-slideUp`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* Card header */}
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg text-stone-800 truncate">
                      {item.name}
                    </h2>
                    {item.activePayment && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-stone-400">
                          {format(parseISO(item.activePayment.start_date), 'd MMM', { locale: ru })} — {format(parseISO(item.activePayment.end_date), 'd MMM yyyy', { locale: ru })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {item.isActive ? (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${getBadgeColor(item.progressPercent)}`}>
                        {item.daysElapsed}/{item.daysTotal} дн
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-500">
                        Истекла
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-stone-300 hover:text-red-500 transition-colors p-1 -mr-1"
                      title="Удалить"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress */}
                {item.isActive && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-400 mb-1.5">
                      <span>Прогресс</span>
                      <span className="font-semibold text-stone-600">{item.progressPercent}%</span>
                    </div>
                    <div className="h-2.5 bg-amber-50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(item.progressPercent)}`}
                        style={{ width: `${Math.max(2, item.progressPercent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-stone-400">
                        День {item.daysElapsed}
                      </span>
                      <span className="text-xs font-medium text-stone-500">
                        {item.daysLeft > 0 ? `Осталось ${item.daysLeft} дн.` : 'Последний день'}
                      </span>
                    </div>
                  </div>
                )}

                {!item.isActive && (
                  <div className="text-sm text-stone-400 italic">
                    Нет активной подписки
                  </div>
                )}
              </div>

              {/* Divider + history link */}
              <Link
                to={`/history/${item.id}`}
                className="flex items-center justify-between px-5 py-3 bg-amber-50/60 hover:bg-amber-100/60 border-t border-amber-100/80 text-sm font-medium text-amber-700 transition-colors no-underline group"
              >
                <span>История оплат</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
