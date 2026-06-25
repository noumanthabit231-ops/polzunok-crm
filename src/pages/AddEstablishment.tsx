import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEstablishment, createPayment } from '../api'

export default function AddEstablishment() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !amount || !startDate || !endDate) {
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
      const est = await createEstablishment(name.trim())
      await createPayment(est.id, Number(amount), startDate, endDate)
      navigate('/')
    } catch (e: any) {
      setError(e.message || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fadeIn">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-5 transition-colors group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Назад
      </button>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Новое заведение</h1>
        <p className="text-sm text-stone-400 mt-1">Добавьте заведение и его первую подписку</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-amber-100/80 p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Название заведения
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Ресторан «Очаг»"
            className="w-full px-4 py-3 border border-amber-200 rounded-xl bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-sm placeholder:text-stone-300"
            disabled={saving}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Сумма оплаты
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 pr-12 border border-amber-200 rounded-xl bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-sm placeholder:text-stone-300"
              disabled={saving}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">₸</span>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">
              Начало подписки
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-amber-200 rounded-xl bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-sm"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">
              Окончание
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-amber-200 rounded-xl bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all text-sm"
              disabled={saving}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 disabled:from-amber-300 disabled:to-amber-300 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
        >
          {saving ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Создать заведение
            </>
          )}
        </button>
      </form>
    </div>
  )
}
