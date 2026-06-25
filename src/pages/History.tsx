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
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const establishments = await fetchEstablishments()
      const est = establishments.find((e) => e.id === id)
      if (!est) { setError('Заведение не найдено'); return }
      const payments = await fetchPayments(id)
      setItem(computeEstablishmentStatus(est, payments))
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id])

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !amount || !startDate || !endDate) {
      setError('Заполните все поля'); return
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('Дата окончания должна быть позже даты начала'); return
    }
    setSaving(true); setError(null)
    try {
      await createPayment(id, Number(amount), startDate, endDate)
      setShowForm(false); setAmount('')
      setStartDate(new Date().toISOString().split('T')[0]); setEndDate('')
      loadData()
    } catch (e: any) {
      setError(e.message || 'Ошибка')
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0s' }} />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
        <p className="text-stone-400 text-sm">Загрузка...</p>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="animate-fadeIn">
        <Link to="/" className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-5 transition-colors group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Назад
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">{error || 'Заведение не найдено'}</div>
      </div>
    )
  }

  const sortedPayments = [...item.payments].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )

  return (
    <div className="animate-fadeIn">
      {/* Back */}
      <Link to="/" className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-5 transition-colors group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Назад
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100/80 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">{item.name}</h1>
            {item.activePayment && (
              <p className="text-sm text-stone-400 mt-1">
                {format(parseISO(item.activePayment.start_date), 'd MMMM yyyy', { locale: ru })} — {format(parseISO(item.activePayment.end_date), 'd MMMM yyyy', { locale: ru })}
              </p>
            )}
          </div>
          <span className="text-3xl">📅</span>
        </div>

        {item.isActive ? (
          <div className="bg-amber-50/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600">Прогресс подписки</span>
              <span className={`text-sm font-bold ${
                item.progressPercent < 50 ? 'text-emerald-600' :
                item.progressPercent < 75 ? 'text-amber-600' :
                item.progressPercent < 90 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {item.progressPercent}%
              </span>
            </div>
            <div className="h-3 bg-amber-100/80 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  item.progressPercent < 50 ? 'bg-emerald-500' :
                  item.progressPercent < 75 ? 'bg-amber-400' :
                  item.progressPercent < 90 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${item.progressPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-stone-700">{item.daysElapsed}</div>
                <div className="text-xs text-stone-400">Дней прошло</div>
              </div>
              <div>
                <div className="text-xl font-bold text-stone-700">{item.daysTotal}</div>
                <div className="text-xs text-stone-400">Всего дней</div>
              </div>
              <div>
                <div className="text-xl font-bold text-amber-600">{item.daysLeft}</div>
                <div className="text-xs text-stone-400">Осталось</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">⏸️</div>
            <p className="text-stone-500 text-sm">Нет активной подписки</p>
          </div>
        )}
      </div>

      {/* History section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-stone-800">История оплат</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {showForm ? 'Отмена' : 'Платёж'}
        </button>
      </div>

      {/* Add payment form */}
      {showForm && (
        <form onSubmit={handleAddPayment} className="bg-white rounded-2xl shadow-sm border border-amber-100/80 p-5 mb-5 space-y-4 animate-slideUp">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Сумма</label>
            <div className="relative">
              <input type="number" min="0" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 pr-12 border border-amber-200 rounded-xl bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-sm"
                disabled={saving} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₸</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Начало</label>
              <input type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-amber-200 rounded-xl bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-sm"
                disabled={saving} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Окончание</label>
              <input type="date" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-amber-200 rounded-xl bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-sm"
                disabled={saving} />
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs">{error}</div>
          )}
          <button type="submit" disabled={saving}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 disabled:from-amber-300 disabled:to-amber-300 text-white font-medium py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <><span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Сохранение...</>
            ) : 'Добавить платёж'}
          </button>
        </form>
      )}

      {/* Payment list */}
      {sortedPayments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">💸</div>
          <p className="text-stone-400 text-sm">Платежей пока нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sortedPayments.map((p, i) => {
            const isActive = item.activePayment?.id === p.id
            const isLast = i === 0
            return (
              <div key={p.id}
                className={`bg-white rounded-xl border p-4 flex items-center justify-between transition-all animate-slideUp ${
                  isActive
                    ? 'border-amber-400 shadow-sm ring-1 ring-amber-300/50'
                    : 'border-amber-100/60 hover:border-amber-200'
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                    isActive ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400'
                  }`}>
                    {isActive ? '✓' : '💳'}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-stone-700">
                      {format(parseISO(p.start_date), 'd MMM yyyy', { locale: ru })} — {format(parseISO(p.end_date), 'd MMM yyyy', { locale: ru })}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {p.amount.toLocaleString('ru-RU')} ₸
                      {isActive && <span className="ml-2 text-amber-600 font-medium">· Активен</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  {isLast && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">
                      Последний
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
