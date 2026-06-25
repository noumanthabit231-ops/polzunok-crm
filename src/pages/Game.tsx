import { useState, useEffect, useRef, useCallback } from 'react'

const GAME_DURATION = 30
const WIDTH = 680
const HEIGHT = 340
const BASKET_W = 90
const BASKET_H = 56
const FONT_SIZE = 11

interface FallingItem {
  id: number
  x: number
  y: number
  name: string
  speed: number
  width: number
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

export default function Game({ names: allNames }: { names: string[] }) {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [playing, setPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [items, setItems] = useState<FallingItem[]>([])
  const [highScore, setHighScore] = useState(() => {
    try { return Number(localStorage.getItem('polzunok_game_high2')) || 0 }
    catch { return 0 }
  })

  const basketRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const basketX = useRef(WIDTH / 2 - BASKET_W / 2)
  const itemsRef = useRef<FallingItem[]>([])
  const scoreRef = useRef(0)
  const frameRef = useRef(0)
  const idRef = useRef(0)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const namesRef = useRef(allNames)
  namesRef.current = allNames

  const move = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    let x = clientX - r.left - BASKET_W / 2
    x = Math.max(0, Math.min(x, WIDTH - BASKET_W))
    basketX.current = x
    if (basketRef.current) basketRef.current.style.transform = `translateX(${x}px)`
  }, [])

  const handlePointer = useCallback((e: React.PointerEvent) => {
    if (!playing || gameOver) return
    e.preventDefault()
    move(e.clientX)
  }, [playing, gameOver, move])

  // Game loop
  useEffect(() => {
    if (!playing || gameOver) return
    const loop = () => {
      const arr = itemsRef.current
      const bx = basketX.current
      let added = 0
      const alive: FallingItem[] = []

      for (const c of arr) {
        let ny = c.y + c.speed
        const cx = bx + BASKET_W / 2
        const cy = HEIGHT - BASKET_H / 2
        const dx = c.x - cx
        const dy = ny - cy

        if (ny >= HEIGHT - BASKET_H && Math.abs(dx) < 42 && Math.abs(dy) < 32) {
          added++
          continue
        }
        if (ny > HEIGHT) continue
        alive.push({ ...c, y: ny })
      }

      if (added > 0) {
        scoreRef.current += added
        setScore(scoreRef.current)
      }

      itemsRef.current = alive
      setItems([...alive])
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [playing, gameOver])

  // Spawn
  useEffect(() => {
    if (!playing || gameOver || allNames.length === 0) return

    spawnRef.current = setInterval(() => {
      const arr = itemsRef.current
      if (arr.length >= 15) return
      const names = namesRef.current
      if (names.length === 0) return

      const name = names[Math.floor(Math.random() * names.length)]
      const textW = Math.max(50, name.length * 7.5)
      const speed = 0.7 + Math.random() * 0.5 + (GAME_DURATION - timeLeft) * 0.025

      idRef.current++
      arr.push({
        id: idRef.current,
        x: 10 + Math.random() * (WIDTH - textW - 20),
        y: -28,
        name,
        speed: Math.min(speed, 3),
        width: textW,
      })
      itemsRef.current = arr
      setItems([...arr])
    }, Math.max(350, 900 - (GAME_DURATION - timeLeft) * 18))

    return () => { if (spawnRef.current) clearInterval(spawnRef.current) }
  }, [playing, gameOver, timeLeft, allNames.length])

  // Timer
  useEffect(() => {
    if (!playing || gameOver) return
    if (timeLeft <= 0) {
      setGameOver(true)
      setPlaying(false)
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current)
        try { localStorage.setItem('polzunok_game_high2', String(scoreRef.current)) } catch {}
      }
      return
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [playing, gameOver, timeLeft, highScore])

  const start = () => {
    setScore(0)
    setTimeLeft(GAME_DURATION)
    setGameOver(false)
    setPlaying(true)
    setItems([])
    itemsRef.current = []
    scoreRef.current = 0
    basketX.current = WIDTH / 2 - BASKET_W / 2
    if (basketRef.current) basketRef.current.style.transform = `translateX(${basketX.current}px)`
  }

  const names = allNames
  const hasNames = names.length > 0

  return (
    <div style={{ marginTop: 32, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(210, 15%, 30%)' }}>
          🏃 Догнать клиентов
        </span>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'hsl(210, 8%, 55%)' }}>
          {!playing && !gameOver && hasNames && <span>Рекорд: {highScore}</span>}
          {playing && <span>⏱ {timeLeft}с</span>}
          {playing && <span style={{ fontWeight: 600, color: 'hsl(210, 60%, 45%)' }}>👥 {score}</span>}
        </div>
      </div>

      <div ref={containerRef} onPointerMove={handlePointer} style={{
        position: 'relative', width: '100%', height: HEIGHT,
        borderRadius: 10, border: '1px solid hsl(210, 15%, 88%)',
        overflow: 'hidden', cursor: playing ? 'none' : 'default',
        userSelect: 'none', touchAction: 'none',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%)',
      }}>
        {/* Falling items */}
        {items.map(c => (
          <div key={c.id} style={{
            position: 'absolute', left: c.x, top: c.y, pointerEvents: 'none',
            transition: 'none',
          }}>
            <div style={{
              background: 'white',
              borderRadius: 6,
              border: '1px solid hsl(210, 15%, 88%)',
              padding: '4px 8px',
              fontSize: FONT_SIZE,
              fontWeight: 600,
              color: 'hsl(210, 15%, 25%)',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: 10 }}>🏪</span>
              {truncate(c.name, 14)}
            </div>
          </div>
        ))}

        {/* Basket */}
        <div ref={basketRef} style={{
          position: 'absolute', bottom: 4, left: 0, pointerEvents: 'none',
          transform: `translateX(${basketX.current}px)`,
          transition: 'none',
        }}>
          <div style={{
            background: 'hsl(210, 60%, 50%)',
            borderRadius: '12px 12px 6px 6px',
            padding: '6px 12px',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            🛒 Салон
          </div>
        </div>

        {/* Start overlay */}
        {!playing && !gameOver && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(2px)',
          }}>
            <div style={{ fontSize: 36 }}>🏪🏃</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'hsl(210,15%,30%)' }}>
              {hasNames ? 'Лови заведения!' : 'Сначала добавь заведения'}
            </div>
            <div style={{ fontSize: 12, color: 'hsl(210,8%,55%)', textAlign: 'center', lineHeight: 1.4 }}>
              {hasNames
                ? 'Собирай падающие названия заведений своей корзиной'
                : 'На главной добавь заведения — они будут падать здесь'}
            </div>
            {hasNames && (
              <button onClick={start} style={{
                padding: '10px 24px', border: 'none', borderRadius: 8,
                background: 'hsl(210, 60%, 50%)', color: 'white',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
                className="hover:bg-[hsl(210,60%,43%)] active:scale-[0.97]"
              >
                🎮 Играть 30 сек
              </button>
            )}
            {highScore > 0 && (
              <div style={{ fontSize: 11, color: 'hsl(210,8%,55%)', marginTop: 4 }}>
                Рекорд: {highScore}
              </div>
            )}
          </div>
        )}

        {/* Game over */}
        {gameOver && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(3px)',
          }}>
            <div style={{ fontSize: 36 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'hsl(210,15%,25%)' }}>
              {score} заведений
            </div>
            <div style={{ fontSize: 12, color: 'hsl(210,8%,55%)' }}>
              {score >= highScore ? '🏆 Новый рекорд!' : `Рекорд: ${highScore}`}
            </div>
            <div style={{ fontSize: 11, color: 'hsl(210,8%,55%)', marginBottom: 6, textAlign: 'center', lineHeight: 1.4 }}>
              {score === 0 ? 'Ни одного! 😅 Попробуй ещё.' :
               score < 5 ? 'Разминка! Можно лучше.' :
               score < 10 ? 'Неплохо! Руку набиваешь.' :
               score < 18 ? '🔥 Хорош! Ещё немного.' :
               score < 28 ? '🚀 Отлично! Ты в форме.' :
               '💎 Неудержимый!'}
            </div>
            <button onClick={start} style={{
              padding: '10px 24px', border: 'none', borderRadius: 8,
              background: 'hsl(210, 60%, 50%)', color: 'white',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
              className="hover:bg-[hsl(210,60%,43%)] active:scale-[0.97]"
            >
              🔄 Ещё раз
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
