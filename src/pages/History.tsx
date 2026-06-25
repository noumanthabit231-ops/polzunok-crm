import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  fetchEstablishments,
  fetchPayments,
  createPayment,
  computeEstablishmentStatus,
} from '../api'
import type { EstablishmentWithStatus } from '../types'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function History() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<EstablishmentWithStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New payment form
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const establishments = await fetchEstablishments()
      const est = establishments.find((e) => e.id === id)
      if (!est) {
        setError('Заведение не найдено')
        return
      }
      const payments = await fetchPayments(id)
      setItem(computeEstablishmentStatus(est, payments))
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !amount || !startDate || !endDate) {
      setError('Заполните все поля')
      return
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('Дата окончания должна быть позже даты начала')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await createPayment(id, Number(amount), startDate, endDate)
      setShowForm(false)
      setAmount('')
      setStartDate(new Date().toISOString().split('T')[0])
      setEndDate('')
      loadData()
    } catch (e: any) {
      setError(e.message || 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-10 text-stone-500">Загрузка...</div>
  }

  if (error || !item) {
    return (
      <div>
        <Link to="/" className="text-amber-700 text-sm mb-4 inline-block">
          ← Назад
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error || 'Заведение не найдено'}
        </div>
      </div>
    )
  }

  const sortedPayments = [...item.payments].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )

  return (
    <div>
      <Link to="/" className="text-amber-700 text-sm mb-4 inline-block hover:text-amber-800">
        ← Назад
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5 mb-4">
        <h1 className="text-2xl font-bold text-stone-800 mb-2">{item.name}</h1>

        {item.isActive ? (
          <div>
            <div className="h-4 bg-amber-50 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${
                  item.progressPercent < 60
                    ? 'bg-emerald-500'
                    : item.progressPercent < 85
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
                style={{ width: `${item.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">
                День <strong>{item.daysElapsed}</strong> из{' '}
                <strong>{item.daysTotal}</strong>
              </span>
              <span className="font-bold text-amber-700">
                {item.progressPercent}%
              </span>
            </div>
            <div className="text-sm text-stone-500 mt-1">
              Осталось: <strong>{item.daysLeft}</strong> д.
            </div>
          </div>
        ) : (
          <div className="text-stone-500 text-sm">
            Нет активной подписки
          </div>
        )}
      </div>

      {/* History */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-amber-900">История оплат</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          <span>Платёж</span>
        </button>
      </div>

      {/* Add payment form */}
      {showForm && (
        <form
          onSubmit={handleAddPayment}
          className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 mb-4 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              Сумма (₸)
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Начало
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Окончание
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                disabled={saving}
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-medium py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Сохранение...
              </>
            ) : (
              'Добавить платёж'
            )}
          </button>
        </form>
      )}

      {/* Payment list */}
      {sortedPayments.length === 0 ? (
        <div className="text-center py-10 text-stone-400 text-sm">
          Нет платежей
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedPayments.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-xl border p-4 flex items-center justify-between ${
                item.activePayment && item.activePayment.id === p.id
                  ? 'border-amber-400 ring-1 ring-amber-300'
                  : 'border-amber-100'
              }`}
            >
              <div>
                <div className="font-medium text-stone-800">
                  {format(parseISO(p.start_date), 'd MMM yyyy', { locale: ru })}
                  {' — '}
                  {format(parseISO(p.end_date), 'd MMM yyyy', { locale: ru })}
                </div>
                <div className="text-sm text-stone-500 mt-0.5">
                  Сумма: <strong>{p.amount.toLocaleString('ru-RU')} ₸</strong>
                  {item.activePayment && item.activePayment.id === p.id && (
                    <span className="ml-2 text-amber-600 font-medium">
                      · Активен
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-stone-400 text-right whitespace-nowrap">
                {p.id === sortedPayments[0]?.id && (
                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-medium">
                    Последний
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
