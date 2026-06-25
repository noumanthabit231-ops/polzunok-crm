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

const accent = 'hsl(210, 60%, 50%)'

function ProgressRing({ pct, daysElapsed, daysTotal, daysLeft }: {
  pct: number; daysElapsed: number; daysTotal: number; daysLeft: number
}) {
  const r = 36; const circ = 2 * Math.PI * r
  const color = pct < 60 ? 'hsl(160, 60%, 45%)' :
    pct < 80 ? 'hsl(38, 80%, 50%)' :
    pct < 92 ? 'hsl(25, 80%, 50%)' : 'hsl(0, 65%, 55%)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(210, 15%, 92%)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x="40" y="42" textAnchor="middle" dominantBaseline="central"
          fontSize="18" fontWeight="700" fill="hsl(210, 15%, 20%)">{pct}%</text>
      </svg>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'hsl(210, 15%, 20%)' }}>{daysLeft} <span style={{ fontSize: 14, fontWeight: 400, color: 'hsl(210, 8%, 55%)' }}>дн</span></div>
        <div style={{ fontSize: 12, color: 'hsl(210, 8%, 55%)', marginTop: 2 }}>день {daysElapsed} из {daysTotal}</div>
      </div>
    </div>
  )
}

export default function History() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<EstablishmentWithStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!id) return
    try {
      setLoading(true); setError(null)
      const ests = await fetchEstablishments()
      const e = ests.find(x => x.id === id)
      if (!e) { setError('Не найдено'); return }
      const p = await fetchPayments(id)
      setItem(computeEstablishmentStatus(e, p))
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !amount || !startDate || !endDate) { setError('Заполните поля'); return }
    if (new Date(endDate) <= new Date(startDate)) { setError('Дата конца должна быть позже'); return }
    setSaving(true); setError(null)
    try {
      await createPayment(id, Number(amount), startDate, endDate)
      setShowForm(false); setAmount('')
      setStartDate(new Date().toISOString().split('T')[0]); setEndDate('')
      load()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '60px 0' }}>
      {[0, 1, 2].map(i => <div key={i} className="dot-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />)}
    </div>
  )

  if (error || !item) return (
    <div className="animate-fadeIn">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'hsl(210,10%,50%)', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Назад
      </Link>
      <div style={{ background: 'hsl(0,65%,93%)', color: 'hsl(0,65%,45%)', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>{error}</div>
    </div>
  )

  const sorted = [...item.payments].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

  return (
    <div className="animate-fadeIn">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'hsl(210,10%,50%)', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Назад
      </Link>

      {/* Hero */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid hsl(210,15%,92%)', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(210,15%,20%)', margin: 0 }}>{item.name}</h1>
            {item.activePayment && (
              <p style={{ fontSize: 13, color: 'hsl(210,8%,55%)', marginTop: 4, margin: '4px 0 0' }}>
                {format(parseISO(item.activePayment.start_date), 'd MMMM yyyy', { locale: ru })} — {format(parseISO(item.activePayment.end_date), 'd MMMM yyyy', { locale: ru })}
              </p>
            )}
          </div>
        </div>

        {item.isActive ? (
          <ProgressRing pct={item.progressPercent} daysElapsed={item.daysElapsed} daysTotal={item.daysTotal} daysLeft={item.daysLeft} />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'hsl(210,8%,55%)', fontSize: 14 }}>
            Нет активной подписки
          </div>
        )}
      </div>

      {/* Payments header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'hsl(210,15%,30%)', margin: 0 }}>
          Платежи <span style={{ fontWeight: 400, color: 'hsl(210,8%,55%)' }}>({sorted.length})</span>
        </h2>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: showForm ? 'hsl(210,15%,92%)' : accent, color: showForm ? 'hsl(210,15%,30%)' : 'white',
          border: 'none', borderRadius: 8, padding: '8px 14px',
          fontWeight: 500, fontSize: 12, cursor: 'pointer',
          transition: 'all 0.15s', fontFamily: 'inherit',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showForm ? 'Отмена' : 'Платёж'}
        </button>
      </div>

      {/* Add payment form */}
      {showForm && (
        <form onSubmit={handleAdd} className="animate-slideUp" style={{
          background: 'white', borderRadius: 12, border: '1px solid hsl(210,15%,92%)',
          padding: 20, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16,
        }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'hsl(210,10%,45%)', display: 'block', marginBottom: 5 }}>Сумма</label>
            <div style={{ position: 'relative' }}>
              <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', paddingRight: 30, fontSize: 13,
                  border: '1px solid hsl(210,15%,88%)', borderRadius: 8, outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = '0 0 0 3px hsla(210,60%,50%,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'hsl(210,15%,88%)'; e.target.style.boxShadow = 'none' }}
                disabled={saving} />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(210,8%,55%)', fontSize: 12 }}>₸</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: 'hsl(210,10%,45%)', display: 'block', marginBottom: 5 }}>Начало</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: 13,
                  border: '1px solid hsl(210,15%,88%)', borderRadius: 8, outline: 'none', fontFamily: 'inherit' }}
                disabled={saving} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: 'hsl(210,10%,45%)', display: 'block', marginBottom: 5 }}>Окончание</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: 13,
                  border: '1px solid hsl(210,15%,88%)', borderRadius: 8, outline: 'none', fontFamily: 'inherit' }}
                disabled={saving} />
            </div>
          </div>
          {error && <div style={{ background: 'hsl(0,65%,93%)', color: 'hsl(0,65%,45%)', padding: '8px 12px', borderRadius: 8, fontSize: 11 }}>{error}</div>}
          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: saving ? 'hsl(210,15%,80%)' : accent,
            color: 'white', fontWeight: 600, fontSize: 12, cursor: saving ? 'default' : 'pointer',
            fontFamily: 'inherit',
          }}>
            {saving ? 'Сохранение...' : 'Добавить платёж'}
          </button>
        </form>
      )}

      {/* Payment list */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'hsl(210,8%,55%)', fontSize: 13 }}>Нет платежей</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((p, i) => {
            const isActive = item.activePayment?.id === p.id
            return (
              <div key={p.id} className="animate-slideUp" style={{
                animationDelay: `${i * 0.04}s`,
                background: 'white', borderRadius: 10,
                border: `1px solid ${isActive ? 'hsl(210,60%,85%)' : 'hsl(210,15%,92%)'}`,
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: isActive ? '0 0 0 2px hsla(210,60%,50%,0.08)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: isActive ? 'hsl(210,60%,95%)' : 'hsl(210,15%,95%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: isActive ? accent : 'hsl(210,8%,55%)',
                  flexShrink: 0,
                }}>
                  {isActive ? '✓' : '💳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, color: 'hsl(210,15%,25%)' }}>
                    {format(parseISO(p.start_date), 'd MMM yyyy', { locale: ru })} — {format(parseISO(p.end_date), 'd MMM yyyy', { locale: ru })}
                  </div>
                  <div style={{ fontSize: 12, color: 'hsl(210,8%,55%)', marginTop: 2 }}>
                    {p.amount.toLocaleString('ru-RU')} ₸
                    {isActive && <span style={{ color: accent, fontWeight: 500, marginLeft: 6 }}>· Сейчас</span>}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {i === 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, background: 'hsl(210,60%,95%)', color: accent, padding: '3px 8px', borderRadius: 6 }}>
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
