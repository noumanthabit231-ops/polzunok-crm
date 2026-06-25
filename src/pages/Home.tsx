import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchEstablishments,
  fetchPayments,
  computeEstablishmentStatus,
  deleteEstablishment,
} from '../api'
import type { Establishment, Payment, EstablishmentWithStatus } from '../types'
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

  const getStatusColor = (item: EstablishmentWithStatus) => {
    if (!item.isActive) return 'bg-stone-300'
    if (item.progressPercent < 60) return 'bg-emerald-500'
    if (item.progressPercent < 85) return 'bg-amber-400'
    return 'bg-red-500'
  }

  const getStatusText = (item: EstablishmentWithStatus) => {
    if (!item.isActive) return 'Нет активной подписки'
    return `${item.daysElapsed} д. прошло · ${item.daysLeft} д. осталось`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-amber-900">Заведения</h1>
        <Link
          to="/add"
          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-all no-underline"
        >
          <span className="text-lg leading-none">+</span>
          <span>Добавить</span>
        </Link>
      </div>

      {loading && (
        <div className="text-center py-10 text-stone-500">Загрузка...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-stone-500 mb-4">
            Пока нет ни одного заведения
          </p>
          <Link
            to="/add"
            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-medium"
          >
            + Добавить заведение
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-bold text-lg text-stone-800">
                    {item.name}
                  </h2>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-stone-400 hover:text-red-500 transition-colors text-lg leading-none p-1"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="h-3 bg-amber-50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getStatusColor(item)}`}
                      style={{ width: `${Math.max(2, item.progressPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">{getStatusText(item)}</span>
                  {item.activePayment && (
                    <span className="font-medium text-amber-700">
                      {item.progressPercent}%
                    </span>
                  )}
                </div>

                {item.activePayment && (
                  <div className="mt-2 text-xs text-stone-400">
                    {format(parseISO(item.activePayment.start_date), 'd MMM', { locale: ru })} —{' '}
                    {format(parseISO(item.activePayment.end_date), 'd MMM yyyy', { locale: ru })}
                    {' · '}
                    {item.activePayment.amount.toLocaleString('ru-RU')} ₸
                  </div>
                )}
              </div>

              <Link
                to={`/history/${item.id}`}
                className="block text-center py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium transition-colors border-t border-amber-100 no-underline"
              >
                История оплат →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
