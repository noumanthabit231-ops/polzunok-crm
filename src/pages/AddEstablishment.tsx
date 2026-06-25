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
      await createPayment(
        est.id,
        Number(amount),
        startDate,
        endDate
      )
      navigate('/')
    } catch (e: any) {
      setError(e.message || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="text-amber-700 text-sm mb-4 hover:text-amber-800 transition-colors"
      >
        ← Назад
      </button>

      <h1 className="text-xl font-bold text-amber-900 mb-5">
        Добавить заведение
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5 space-y-4">
        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Название заведения
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Ресторан «Очаг»"
            className="w-full px-3.5 py-2.5 border border-amber-200 rounded-xl bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-sm"
            disabled={saving}
          />
        </div>

        {/* Сумма оплаты */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Сумма оплаты (₸)
          </label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full px-3.5 py-2.5 border border-amber-200 rounded-xl bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-sm"
            disabled={saving}
          />
        </div>

        {/* Даты */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Начало подписки
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-amber-200 rounded-xl bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-sm"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Окончание
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-amber-200 rounded-xl bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-sm"
              disabled={saving}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-amber-300 text-white font-medium py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Сохранение...
            </>
          ) : (
            '+ Сохранить'
          )}
        </button>
      </form>
    </div>
  )
}
