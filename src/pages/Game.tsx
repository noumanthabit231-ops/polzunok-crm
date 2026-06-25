import { useState, useEffect, useRef, useCallback } from 'react'

const GAME_DURATION = 30
const WIDTH = 680
let actualW = WIDTH
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

      const CAR_H = 32

      for (const c of arr) {
        let ny = c.y + c.speed
        const cw = c.width

        // AABB overlap check: car vs basket
        const carLeft = c.x
        const carRight = c.x + cw
        const carTop = ny
        const carBottom = ny + CAR_H

        const baskLeft = bx
        const baskRight = bx + BASKET_W
        const baskTop = HEIGHT - BASKET_H
        const baskBottom = HEIGHT

        const overlapX = carRight > baskLeft && carLeft < baskRight
        const overlapY = carBottom > baskTop && carTop < baskBottom

        if (overlapX && overlapY) {
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
      const textW = Math.max(70, name.length * 8)
      const speed = 0.7 + Math.random() * 0.5 + (GAME_DURATION - timeLeft) * 0.025
      const aw = Math.max(WIDTH, actualW)

      idRef.current++
      arr.push({
        id: idRef.current,
        x: Math.max(2, Math.random() * (aw - textW - 6)),
        y: -50,
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

  // Measure actual container width
  useEffect(() => {
    if (containerRef.current) {
      actualW = Math.max(300, containerRef.current.clientWidth)
    }
  }, [])

  const names = allNames
  const hasNames = names.length > 0

  return (
    <div style={{ marginTop: 32, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(210, 15%, 30%)' }}>
          🏎️ Паркуй клиентов
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
        {/* Falling cars */}
        {items.map(c => (
          <div key={c.id} style={{
            position: 'absolute', left: c.x, top: c.y, pointerEvents: 'none',
            transition: 'none',
          }}>
            {/* Car body */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '8px 8px 4px 4px',
              border: '1.5px solid hsl(210, 20%, 78%)',
              padding: '5px 10px 3px',
              fontSize: FONT_SIZE,
              fontWeight: 600,
              color: 'hsl(210, 15%, 20%)',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', gap: 5,
              position: 'relative',
            }}>
              {/* Car roof bump */}
              <div style={{
                position: 'absolute', top: -7, left: '50%', marginLeft: -10,
                width: 20, height: 8,
                background: '#f8fafc',
                border: '1.5px solid hsl(210, 20%, 78%)',
                borderBottom: 'none',
                borderRadius: '6px 6px 0 0',
              }} />
              <span style={{ fontSize: 11 }}>🚗</span>
              <span>{truncate(c.name, 14)}</span>
            </div>
            {/* Wheels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 6px', marginTop: -1 }}>
              <div style={{
                width: 10, height: 6, borderRadius: '0 0 5px 5px',
                background: '#334155', border: '1px solid #1e293b',
              }} />
              <div style={{
                width: 10, height: 6, borderRadius: '0 0 5px 5px',
                background: '#334155', border: '1px solid #1e293b',
              }} />
            </div>
          </div>
        ))}

        {/* Parking */}
        <div ref={basketRef} style={{
          position: 'absolute', bottom: 4, left: 0, pointerEvents: 'none',
          transform: `translateX(${basketX.current}px)`,
          transition: 'none',
        }}>
          <div style={{
            background: 'hsl(210, 60%, 50%)',
            borderRadius: '6px 6px 3px 3px',
            padding: '6px 14px',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            position: 'relative',
          }}>
            🅿️ Парковка
          </div>
          {/* Parking lines */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginTop: 2,
          }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                width: 14, height: 4, background: 'white',
                border: '1px solid hsl(210, 15%, 80%)', borderRadius: 1,
              }} />
            ))}
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
            <div style={{ fontSize: 36 }}>🏎️🅿️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'hsl(210,15%,30%)' }}>
              {hasNames ? 'Лови машинки с названиями!' : 'Сначала добавь заведения'}
            </div>
            <div style={{ fontSize: 12, color: 'hsl(210,8%,55%)', textAlign: 'center', lineHeight: 1.4 }}>
              {hasNames
                ? 'Наведи парковку на машинку — заезжает к тебе'
                : 'На главной добавь заведения — поедут машинки'}
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
