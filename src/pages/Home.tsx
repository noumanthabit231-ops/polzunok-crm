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
import Game from './Game'

const accent = 'hsl(210, 60%, 50%)'

function ProgressBar({ daysElapsed, daysTotal, daysLeft }: {
  daysElapsed: number; daysTotal: number; daysLeft: number
}) {
  const pct = Math.round((daysElapsed / daysTotal) * 100)
  const color = pct < 60 ? 'hsl(160, 60%, 45%)' :
    pct < 80 ? 'hsl(38, 80%, 50%)' :
    pct < 92 ? 'hsl(25, 80%, 50%)' : 'hsl(0, 65%, 55%)'

  const maxDots = Math.min(daysTotal, 60)
  const step = daysTotal / maxDots
  const filledDots = Math.round(daysElapsed / step)

  return (
    <div>
      <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 14 }}>
        {Array.from({ length: maxDots }).map((_, i) => {
          const isFilled = i < filledDots
          const isToday = i === Math.min(filledDots, maxDots - 1) && daysLeft > 0
          const isFirst = i === 0
          const isLast = i === maxDots - 1
          let dotColor = 'hsl(210, 15%, 88%)'
          let dotWidth = 6
          let dotHeight = 6
          let extra = {}

          if (isToday) {
            dotColor = color
            dotWidth = 10
            dotHeight = 10
            extra = {
              boxShadow: `0 0 0 3px ${color}33`,
              borderRadius: 5,
              transition: 'all 0.3s ease',
            }
          } else if (isFilled) {
            dotColor = color
          }

          if (isFirst || isLast) {
            dotWidth = isToday ? 10 : 8
            dotHeight = isToday ? 10 : 8
            extra = {
              ...extra,
              borderRadius: isFirst ? '4px 1px 1px 4px' : '1px 4px 4px 1px',
            }
          }

          return (
            <div
              key={i}
              title={`День ${Math.round(i * step + 1)}`}
              style={{
                flex: 1,
                height: dotHeight,
                maxWidth: dotWidth,
                background: dotColor,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                ...extra,
              }}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'hsl(210, 8%, 55%)' }}>
        <span style={{ fontWeight: 500, color: 'hsl(210, 10%, 40%)' }}>День {daysElapsed}</span>
        <span>{daysLeft > 0 ? `Осталось ${daysLeft} дн` : 'Последний день'}</span>
      </div>
    </div>
  )
}

export default function Home() {
  const [items, setItems] = useState<EstablishmentWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  const load = async () => {
    try {
      setLoading(true); setError(null)
      const ests = await fetchEstablishments()
      const withP = await Promise.all(ests.map(async (e) => {
        const p = await fetchPayments(e.id)
        return computeEstablishmentStatus(e, p)
      }))
      setItems(withP)
    } catch (e: any) { setError(e.message || 'Ошибка') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Удалить «${name}»?`)) return
    try { await deleteEstablishment(id); setItems(p => p.filter(i => i.id !== id)) }
    catch (e: any) { alert(e.message) }
  }

  return (
    <div className="animate-fadeIn">
      {/* Stats */}
      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { label: 'Всего', value: items.length, color: 'hsl(210, 15%, 20%)' },
            { label: 'Активно', value: items.filter(i => i.isActive).length, color: 'hsl(160, 60%, 40%)' },
            { label: 'Истекло', value: items.filter(i => !i.isActive).length, color: 'hsl(0, 65%, 50%)' },
          ].map((s, i) => (
            <div key={s.label} className="animate-slideUp" style={{
              flex: 1, background: 'white', borderRadius: 10, padding: '12px 8px',
              textAlign: 'center', border: '1px solid hsl(210, 15%, 92%)',
              animationDelay: `${i * 0.05}s`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'hsl(210, 8%, 55%)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {!loading && items.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(210, 8%, 60%)', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            style={{
              width: '100%', padding: '9px 14px 9px 34px', fontSize: 13,
              border: '1px solid hsl(210, 15%, 88%)', borderRadius: 8,
              background: 'white', outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = '0 0 0 2px hsla(210,60%,50%,0.12)' }}
            onBlur={e => { e.target.style.borderColor = 'hsl(210,15%,88%)'; e.target.style.boxShadow = 'none' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'hsl(210, 8%, 60%)', padding: 4,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '60px 0' }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="dot-pulse" style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'hsl(210, 60%, 50%)',
            }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: 'hsl(0, 65%, 93%)', color: 'hsl(0, 65%, 45%)', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="animate-scaleIn" style={{
          textAlign: 'center', paddingTop: 80,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>📋</div>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: 'hsl(210, 15%, 30%)', marginBottom: 6 }}>Нет заведений</h2>
          <p style={{ fontSize: 13, color: 'hsl(210, 8%, 55%)', marginBottom: 24 }}>Добавьте первое заведение</p>
          <Link to="/add" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: accent, color: 'white', padding: '10px 20px',
            borderRadius: 8, fontWeight: 500, fontSize: 13,
            textDecoration: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Добавить заведение
          </Link>
        </div>
      )}

      {/* List */}
      {!loading && filteredItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredItems.map((item, i) => (
            <div key={item.id} className="animate-slideUp" style={{
              animationDelay: `${i * 0.06}s`,
              background: 'white',
              borderRadius: 12,
              border: '1px solid hsl(210, 15%, 92%)',
              overflow: 'hidden',
              transition: 'box-shadow 0.15s',
            }}>
              {/* Body */}
              <div style={{ padding: '16px 18px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'hsl(210, 15%, 20%)' }}>{item.name}</div>
                    {item.activePayment && (
                      <div style={{ fontSize: 12, color: 'hsl(210, 8%, 55%)', marginTop: 2 }}>
                        {format(parseISO(item.activePayment.start_date), 'd MMM', { locale: ru })} — {format(parseISO(item.activePayment.end_date), 'd MMM yyyy', { locale: ru })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.isActive ? (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: item.progressPercent < 60 ? 'hsl(160, 60%, 92%)' :
                          item.progressPercent < 80 ? 'hsl(38, 80%, 92%)' : 'hsl(0, 65%, 93%)',
                        color: item.progressPercent < 60 ? 'hsl(160, 60%, 35%)' :
                          item.progressPercent < 80 ? 'hsl(38, 80%, 40%)' : 'hsl(0, 65%, 45%)',
                      }}>
                        {item.progressPercent}%
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'hsl(210, 8%, 60%)' }}>Истекла</span>
                    )}
                    <button onClick={() => handleDelete(item.id, item.name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(210, 8%, 75%)', padding: 2 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                        strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                </div>

                {item.isActive ? (
                  <ProgressBar
                    daysElapsed={item.daysElapsed}
                    daysTotal={item.daysTotal}
                    daysLeft={item.daysLeft}
                  />
                ) : (
                  <div style={{ fontSize: 13, color: 'hsl(210, 8%, 55%)' }}>Нет активной подписки</div>
                )}
              </div>

              {/* Footer */}
              <Link to={`/history/${item.id}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 18px', borderTop: '1px solid hsl(210, 15%, 92%)',
                fontSize: 13, color: 'hsl(210, 10%, 50%)', textDecoration: 'none',
                transition: 'background 0.15s',
              }}
                className="hover:bg-[hsl(210,15%,97%)]"
              >
                <span>История оплат</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
                  className="group-hover:translate-x-0.5 transition-transform">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length > 0 && search && filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: 40, color: 'hsl(210, 8%, 55%)', fontSize: 13 }}>
          Ничего не найдено
        </div>
      )}

      {/* 🎮 Game */}
      <Game />
    </div>
  )
}
