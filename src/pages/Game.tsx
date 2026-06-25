import { useState, useEffect, useRef, useCallback } from 'react'

const EMOJIS = ['👤', '👩', '👨', '🧑', '👱', '👴', '👵', '🧔']
const GAME_DURATION = 30 // seconds
const WIDTH = 680
const HEIGHT = 320
const BASKET_W = 80
const BASKET_H = 60
const CUSTOMER_SIZE = 28

interface Customer {
  id: number
  x: number
  y: number
  emoji: string
  speed: number
}

export default function Game() {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [playing, setPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const basketRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const basketX = useRef(WIDTH / 2 - BASKET_W / 2)
  const customersRef = useRef<Customer[]>([])
  const scoreRef = useRef(0)
  const frameRef = useRef<number>(0)
  const idCounter = useRef(0)
  const spawnInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [highScore, setHighScore] = useState(() => {
    try { return Number(localStorage.getItem('polzunok_game_high')) || 0 } catch { return 0 }
  })

  // Move basket with mouse
  const moveBasket = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    let x = clientX - r.left - BASKET_W / 2
    x = Math.max(0, Math.min(x, WIDTH - BASKET_W))
    basketX.current = x
    if (basketRef.current) {
      basketRef.current.style.transform = `translateX(${x}px)`
    }
  }, [])

  // Touch/mouse handlers
  const handlePointer = useCallback((e: React.PointerEvent) => {
    if (!playing || gameOver) return
    e.preventDefault()
    moveBasket(e.clientX)
  }, [playing, gameOver, moveBasket])

  // Game loop
  useEffect(() => {
    if (!playing || gameOver) return

    const loop = () => {
      const cs = customersRef.current
      const basket = basketX.current

      let scored = 0
      const alive: Customer[] = []

      for (const c of cs) {
        let newY = c.y + c.speed

        // Check collision with basket
        const cx = basket + BASKET_W / 2
        const cy = HEIGHT - BASKET_H / 2
        const dx = c.x - cx
        const dy = newY - cy

        if (newY >= HEIGHT - BASKET_H && Math.abs(dx) < 40 && Math.abs(dy) < 30) {
          scored++
          continue // caught!
        }

        if (newY > HEIGHT) continue // missed, gone

        alive.push({ ...c, y: newY })
      }

      if (scored > 0) {
        scoreRef.current += scored
        setScore(scoreRef.current)
      }

      customersRef.current = alive
      setCustomers([...alive])
      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [playing, gameOver])

  // Spawn customers
  useEffect(() => {
    if (!playing || gameOver) return

    spawnInterval.current = setInterval(() => {
      const cs = customersRef.current
      if (cs.length >= 20) return

      const speed = 0.8 + Math.random() * 0.6 + (GAME_DURATION - timeLeft) * 0.03
      idCounter.current++
      cs.push({
        id: idCounter.current,
        x: 20 + Math.random() * (WIDTH - 40),
        y: -CUSTOMER_SIZE,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        speed: Math.min(speed, 3.5),
      })
      customersRef.current = cs
      setCustomers([...cs])
    }, Math.max(300, 800 - (GAME_DURATION - timeLeft) * 15))

    return () => { if (spawnInterval.current) clearInterval(spawnInterval.current) }
  }, [playing, gameOver, timeLeft])

  // Timer
  useEffect(() => {
    if (!playing || gameOver) return
    if (timeLeft <= 0) {
      setGameOver(true)
      setPlaying(false)
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current)
        try { localStorage.setItem('polzunok_game_high', String(scoreRef.current)) } catch {}
      }
      return
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(t)
  }, [playing, gameOver, timeLeft, highScore])

  const startGame = () => {
    setScore(0)
    setTimeLeft(GAME_DURATION)
    setGameOver(false)
    setPlaying(true)
    setCustomers([])
    customersRef.current = []
    scoreRef.current = 0
    basketX.current = WIDTH / 2 - BASKET_W / 2
    if (basketRef.current) basketRef.current.style.transform = `translateX(${basketX.current}px)`
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(210, 15%, 30%)' }}>🎮 Лови клиентов</span>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'hsl(210, 8%, 55%)' }}>
          {!playing && !gameOver && <span>Рекорд: {highScore}</span>}
          {playing && <span>⏱ {timeLeft}с</span>}
          {playing && <span style={{ fontWeight: 600, color: 'hsl(210, 60%, 45%)' }}>👥 {score}</span>}
        </div>
      </div>

      <div ref={containerRef} onPointerMove={handlePointer} style={{
        position: 'relative', width: '100%', height: HEIGHT,
        background: 'linear-gradient(180deg, #f0f4f8 0%, #e2e8f0 100%)',
        borderRadius: 10, border: '1px solid hsl(210, 15%, 88%)',
        overflow: 'hidden', cursor: playing ? 'none' : 'default',
        userSelect: 'none', touchAction: 'none',
      }}>
        {/* Customers */}
        {customers.map(c => (
          <div key={c.id} style={{
            position: 'absolute', left: c.x - CUSTOMER_SIZE / 2, top: c.y,
            width: CUSTOMER_SIZE, height: CUSTOMER_SIZE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, transition: 'none', pointerEvents: 'none',
          }}>
            {c.emoji}
          </div>
        ))}

        {/* Basket */}
        <div ref={basketRef} style={{
          position: 'absolute', bottom: 0, left: 0,
          width: BASKET_W, height: BASKET_H,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36,
          transform: `translateX(${basketX.current}px)`,
          transition: playing ? 'none' : 'none',
          pointerEvents: 'none',
        }}>
          🏪
        </div>

        {/* Start overlay */}
        {!playing && !gameOver && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)',
          }}>
            <div style={{ fontSize: 40 }}>🏪👥</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'hsl(210,15%,30%)' }}>Лови клиентов в своё заведение!</div>
            <div style={{ fontSize: 12, color: 'hsl(210,8%,55%)', marginBottom: 4 }}>Веди мышкой / пальцем — собирай посетителей</div>
            <button onClick={startGame} style={{
              padding: '10px 24px', border: 'none', borderRadius: 8,
              background: 'hsl(210, 60%, 50%)', color: 'white',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}
              className="hover:bg-[hsl(210,60%,43%)] active:scale-[0.97]"
            >
              🎮 Играть 30 сек
            </button>
            {highScore > 0 && (
              <div style={{ fontSize: 11, color: 'hsl(210,8%,55%)', marginTop: 4 }}>
                Рекорд: {highScore} клиентов
              </div>
            )}
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(3px)',
          }}>
            <div style={{ fontSize: 40 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'hsl(210,15%,25%)' }}>
              {score} клиентов
            </div>
            <div style={{ fontSize: 12, color: 'hsl(210,8%,55%)' }}>
              {score >= highScore ? '🏆 Новый рекорд!' : `Рекорд: ${highScore}`}
            </div>
            <div style={{ fontSize: 11, color: 'hsl(210,8%,55%)', marginBottom: 6, textAlign: 'center', lineHeight: 1.4 }}>
              {score < 10 ? 'Ну такое... можно лучше!' :
               score < 25 ? 'Неплохо! Ещё немного практики.' :
               score < 50 ? '🔥 Хороший результат!' :
               score < 80 ? '🚀 Отличная работа!' :
               '💎 Легенда! Ты магнит для клиентов!'}
            </div>
            <button onClick={startGame} style={{
              padding: '10px 24px', border: 'none', borderRadius: 8,
              background: 'hsl(210, 60%, 50%)', color: 'white',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 0.15s',
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
