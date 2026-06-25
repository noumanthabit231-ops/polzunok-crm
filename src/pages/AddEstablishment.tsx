import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEstablishment, createPayment } from '../api'

const accent = 'hsl(210, 60%, 50%)'

export default function AddEstablishment() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !amount || !startDate || !endDate) { setError('Заполните все поля'); return }
    if (new Date(endDate) <= new Date(startDate)) { setError('Дата окончания должна быть позже даты начала'); return }
    setSaving(true); setError(null)
    try {
      const est = await createEstablishment(name.trim())
      await createPayment(est.id, Number(amount), startDate, endDate)
      navigate('/')
    } catch (e: any) { setError(e.message || 'Ошибка') }
    finally { setSaving(false) }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    border: '1px solid hsl(210, 15%, 88%)', borderRadius: 8,
    background: 'white', outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  }

  return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate('/')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
        color: 'hsl(210, 10%, 50%)', fontSize: 13, padding: 0, marginBottom: 20,
        fontFamily: 'inherit',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Назад
      </button>

      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'hsl(210, 15%, 20%)', marginBottom: 4 }}>Новое заведение</h1>
      <p style={{ fontSize: 13, color: 'hsl(210, 8%, 55%)', marginBottom: 24 }}>Добавьте заведение и его первую подписку</p>

      <form onSubmit={handleSubmit} style={{
        background: 'white', borderRadius: 12, border: '1px solid hsl(210, 15%, 92%)',
        padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'hsl(210, 10%, 45%)', marginBottom: 6 }}>
            Название заведения
          </label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Ресторан «Очаг»"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = '0 0 0 3px hsla(210,60%,50%,0.12)' }}
            onBlur={e => { e.target.style.borderColor = 'hsl(210,15%,88%)'; e.target.style.boxShadow = 'none' }}
            disabled={saving} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'hsl(210, 10%, 45%)', marginBottom: 6 }}>
            Сумма оплаты
          </label>
          <div style={{ position: 'relative' }}>
            <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0" style={{ ...inputStyle, paddingRight: 32 }}
              onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = '0 0 0 3px hsla(210,60%,50%,0.12)' }}
              onBlur={e => { e.target.style.borderColor = 'hsl(210,15%,88%)'; e.target.style.boxShadow = 'none' }}
              disabled={saving} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(210, 8%, 55%)', fontSize: 13 }}>₸</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'hsl(210, 10%, 45%)', marginBottom: 6 }}>
              Начало
            </label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = '0 0 0 3px hsla(210,60%,50%,0.12)' }}
              onBlur={e => { e.target.style.borderColor = 'hsl(210,15%,88%)'; e.target.style.boxShadow = 'none' }}
              disabled={saving} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'hsl(210, 10%, 45%)', marginBottom: 6 }}>
              Окончание
            </label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = '0 0 0 3px hsla(210,60%,50%,0.12)' }}
              onBlur={e => { e.target.style.borderColor = 'hsl(210,15%,88%)'; e.target.style.boxShadow = 'none' }}
              disabled={saving} />
          </div>
        </div>

        {error && (
          <div style={{ background: 'hsl(0, 65%, 93%)', color: 'hsl(0, 65%, 45%)', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={saving} style={{
          width: '100%', padding: '12px 20px', borderRadius: 8, border: 'none',
          background: saving ? 'hsl(210, 15%, 80%)' : accent,
          color: 'white', fontWeight: 600, fontSize: 13, cursor: saving ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 0.15s', fontFamily: 'inherit',
        }}>
          {saving ? (
            <><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.6s linear infinite' }} />Сохранение...</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Создать
            </>
          )}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
