import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Battlefield } from './components/Battlefield'
import { PlayerPanel } from './components/PlayerPanel'
import { gameSocket } from './socket/gameSocket'
import type { GameState, Position, SkillEffectEvent, SkillType } from './types/game'
import { GRID_SIZE } from './types/game'

function useGameState() {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [myPlayerId, setMyPlayerId] = useState<1 | 2 | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [skillEffects, setSkillEffects] = useState<SkillEffectEvent[]>([])
  const [flash, setFlash] = useState(false)
  const [winnerAnim, setWinnerAnim] = useState(false)
  const winnerShown = useRef(false)

  useEffect(() => {
    gameSocket.connect()

    const onJoined = (data: { roomId: string; playerId: 1 | 2 }) => {
      setRoomId(data.roomId)
      setMyPlayerId(data.playerId)
      setWaiting(false)
    }
    const onWait = () => setWaiting(true)
    const onState = (s: GameState) => {
      if (!s.players[0] || !s.players[1]) return
      setGameState({
        ...s,
        players: [s.players[0]!, s.players[1]!],
      } as GameState)

      if (s.winner !== null && !winnerShown.current) {
        winnerShown.current = true
        setWinnerAnim(true)
      } else if (s.winner === null) {
        winnerShown.current = false
        setWinnerAnim(false)
      }
    }
    const onSkill = (e: SkillEffectEvent) => {
      setSkillEffects((prev) => [...prev, e])
    }

    gameSocket.on('joinedRoom', onJoined)
    gameSocket.on('waitingForMatch', onWait)
    gameSocket.on('gameState', onState)
    gameSocket.on('skillEffect', onSkill)

    return () => {
      gameSocket.off('joinedRoom', onJoined)
      gameSocket.off('waitingForMatch', onWait)
      gameSocket.off('gameState', onState)
      gameSocket.off('skillEffect', onSkill)
    }
  }, [])

  return {
    roomId,
    myPlayerId,
    gameState,
    waiting,
    skillEffects,
    setSkillEffects,
    flash,
    setFlash,
    winnerAnim,
    setGameState,
  }
}

const getHighlightCells = (
  skill: SkillType | null,
  pos: Position | null,
  gs: GameState | null
): Position[] | null => {
  if (!skill || !gs || !pos) return null
  const result: Position[] = []
  if (skill === 'fireball') {
    result.push(pos)
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    for (const [dr, dc] of dirs) {
      const r = pos.row + dr
      const c = pos.col + dc
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) result.push({ row: r, col: c })
    }
  } else if (skill === 'iceshield') {
    const me = gs.currentTurn
    const p = gs.players.find((x) => x.id === me)
    if (p) result.push({ ...p.position })
  } else if (skill === 'lightning') {
    for (let c = 0; c < GRID_SIZE; c++) result.push({ row: pos.row, col: c })
    for (let r = 0; r < GRID_SIZE; r++) {
      if (r !== pos.row) result.push({ row: r, col: pos.col })
    }
  }
  return result
}

export default function App() {
  const {
    roomId,
    myPlayerId,
    gameState,
    waiting,
    skillEffects,
    setSkillEffects,
    flash,
    setFlash,
    winnerAnim,
  } = useGameState()

  const [mode, setMode] = useState<'menu' | 'local' | 'online'>('menu')
  const [localPlayerTurn, setLocalPlayerTurn] = useState<1 | 2>(1)
  const [localSkill, setLocalSkill] = useState<SkillType | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null)
  const [hoverTarget, setHoverTarget] = useState<Position | null>(null)
  const [localState, setLocalState] = useState<GameState | null>(null)

  const flashTimerRef = useRef<number | null>(null)
  const triggerFlash = useCallback(() => {
    setFlash(true)
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    flashTimerRef.current = window.setTimeout(() => setFlash(false), 180)
  }, [setFlash])

  useEffect(() => {
    if (mode !== 'local') return
    const init: GameState = {
      roomId: 'LOCAL',
      currentTurn: 1,
      turnPhase: 'move',
      turnTimer: 5,
      players: [
        {
          id: 1,
          name: '玩家1',
          hp: 100,
          maxHp: 100,
          position: { row: 0, col: 0 },
          cooldowns: { fireball: 0, iceshield: 0, lightning: 0 },
          hasIceShield: false,
        },
        {
          id: 2,
          name: '玩家2',
          hp: 100,
          maxHp: 100,
          position: { row: 4, col: 4 },
          cooldowns: { fireball: 0, iceshield: 0, lightning: 0 },
          hasIceShield: false,
        },
      ],
      gridState: Array.from({ length: 5 }, () => Array(5).fill(null)),
      winner: null,
    }
    setLocalState(init)
    setLocalPlayerTurn(1)
    setLocalSkill(null)
    setSelectedSkill(null)
  }, [mode])

  useEffect(() => {
    if (mode !== 'local' || !localState || localState.winner !== null) return
    const timer = setInterval(() => {
      setLocalState((prev) => {
        if (!prev || prev.winner !== null) return prev
        const next = { ...prev, turnTimer: prev.turnTimer - 1 }
        if (next.turnTimer <= 0) {
          const skip = prev.currentTurn
          const p = next.players.map((x) => ({ ...x, cooldowns: { ...x.cooldowns } }))
          const sp = p.find((x) => x.id === skip)!
          ;(Object.keys(sp.cooldowns) as SkillType[]).forEach((k) => {
            if (sp.cooldowns[k] > 0) sp.cooldowns[k]--
          })
          const nt = (skip === 1 ? 2 : 1) as 1 | 2
          return {
            ...next,
            currentTurn: nt,
            turnTimer: 5,
            turnPhase: 'move',
            players: p as [typeof p[0], typeof p[1]],
          }
        }
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [mode, localState, localState?.winner])

  const activeGs = mode === 'online' ? gameState : localState
  const actualTurn = mode === 'online' ? (myPlayerId ?? 1) : localPlayerTurn

  useEffect(() => {
    if (!activeGs) return
    setLocalPlayerTurn(activeGs.currentTurn)
  }, [activeGs?.currentTurn])

  const highlightCells = useMemo(() => {
    const skill = mode === 'online' ? selectedSkill : localSkill
    const gs = activeGs
    if (!gs) return null
    if (skill === 'iceshield') {
      const me = gs.currentTurn
      const p = gs.players.find((x) => x.id === me)
      if (!p) return null
      return [{ ...p.position }]
    }
    if (skill && hoverTarget) return getHighlightCells(skill, hoverTarget, gs)
    return null
  }, [selectedSkill, localSkill, hoverTarget, activeGs, mode])

  const startLocalGame = () => setMode('local')
  const startOnlineGame = () => {
    setMode('online')
    gameSocket.joinRoom(`玩家${Math.floor(Math.random() * 100)}`)
  }

  const isAdjacent = (a: Position, b: Position) =>
    Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1

  const canMoveTo = (gs: GameState, pid: 1 | 2, target: Position) => {
    if (target.row < 0 || target.row >= 5 || target.col < 0 || target.col >= 5) return false
    const p = gs.players.find((x) => x.id === pid)!
    if (!isAdjacent(p.position, target)) return false
    const other = gs.players.find((x) => x.id !== pid)
    if (other && other.position.row === target.row && other.position.col === target.col) return false
    return true
  }

  const doMove = (gs: GameState, pid: 1 | 2, target: Position): GameState => {
    const players = gs.players.map((p) => ({ ...p }))
    const p = players.find((x) => x.id === pid)!
    p.position = { ...target }
    return { ...gs, players: players as [typeof players[0], typeof players[1]], turnPhase: 'skill' }
  }

  const applyLocalSkill = (
    gs: GameState,
    pid: 1 | 2,
    skill: SkillType,
    target: Position
  ): GameState => {
    const players = gs.players.map((p) => ({ ...p, cooldowns: { ...p.cooldowns } }))
    const caster = players.find((x) => x.id === pid)!
    const enemy = players.find((x) => x.id !== pid)!
    const grid = gs.gridState.map((row) => [...row])

    const affected: Position[] = []
    if (skill === 'fireball') {
      affected.push(target)
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        const r = target.row + dr
        const c = target.col + dc
        if (r >= 0 && r < 5 && c >= 0 && c < 5) affected.push({ row: r, col: c })
      }
      for (const a of affected) grid[a.row][a.col] = 'fire'
      if (affected.some((a) => a.row === enemy.position.row && a.col === enemy.position.col)) {
        let dmg = 25
        if (enemy.hasIceShield) {
          dmg = Math.floor(dmg * 0.5)
          enemy.hasIceShield = false
        }
        enemy.hp = Math.max(0, enemy.hp - dmg)
      }
      caster.cooldowns.fireball = 2
    } else if (skill === 'iceshield') {
      grid[caster.position.row][caster.position.col] = 'ice'
      caster.hasIceShield = true
      affected.push({ ...caster.position })
      caster.cooldowns.iceshield = 3
    } else if (skill === 'lightning') {
      const useRow = Math.random() > 0.5
      if (useRow) for (let c = 0; c < 5; c++) affected.push({ row: target.row, col: c })
      else for (let r = 0; r < 5; r++) affected.push({ row: r, col: target.col })
      for (const a of affected) grid[a.row][a.col] = 'lightning'
      if (affected.some((a) => a.row === enemy.position.row && a.col === enemy.position.col)) {
        let dmg = 35
        if (enemy.hasIceShield) {
          dmg = Math.floor(dmg * 0.5)
          enemy.hasIceShield = false
        }
        enemy.hp = Math.max(0, enemy.hp - dmg)
      }
      caster.cooldowns.lightning = 3
    }

    const cooldownMap: Record<SkillType, 'fireball' | 'iceshield' | 'lightning'> = {
      fireball: 'fireball',
      iceshield: 'iceshield',
      lightning: 'lightning',
    }
    const cdKey = cooldownMap[skill]
    for (const pp of players) {
      if (pp.id !== pid) continue
      for (const k of Object.keys(pp.cooldowns) as SkillType[]) {
        if (k !== cdKey && pp.cooldowns[k] > 0) pp.cooldowns[k]--
      }
    }

    let winner: null | 1 | 2 = null
    if (caster.hp <= 0) winner = enemy.id as 1 | 2
    else if (enemy.hp <= 0) winner = caster.id as 1 | 2

    const next = (pid === 1 ? 2 : 1) as 1 | 2
    return {
      ...gs,
      players: players as [typeof players[0], typeof players[1]],
      gridState: grid,
      currentTurn: winner ? gs.currentTurn : next,
      turnTimer: 5,
      turnPhase: 'move',
      winner,
    }
  }

  const handleCellClick = (cell: Position) => {
    if (!activeGs) return

    if (mode === 'online') {
      if (!roomId || !myPlayerId) return
      if (activeGs.currentTurn !== myPlayerId) return
      if (activeGs.winner !== null) return

      if (selectedSkill) {
        gameSocket.castSkill(roomId, myPlayerId, selectedSkill, cell)
        setSelectedSkill(null)
      } else {
        gameSocket.move(roomId, myPlayerId, cell)
      }
      return
    }

    if (mode === 'local') {
      if (activeGs.winner !== null) return
      const pid = activeGs.currentTurn
      if (localSkill) {
        setSkillEffects((prev: SkillEffectEvent[]) => [
          ...prev,
          { skillType: localSkill, targetCell: cell, playerId: pid, timestamp: Date.now() },
        ])
        if (localSkill === 'lightning') triggerFlash()
        setLocalState((gs) => (gs ? applyLocalSkill(gs, pid, localSkill, cell) : gs))
        setLocalSkill(null)
      } else {
        if (canMoveTo(activeGs, pid, cell)) {
          setLocalState((gs) => (gs ? doMove(gs, pid, cell) : gs))
        }
      }
    }
  }

  const handleSelectSkill = (pid: 1 | 2) => (skill: SkillType | null) => {
    if (!activeGs) return
    if (activeGs.currentTurn !== pid) return
    if (mode === 'online') {
      if (pid !== myPlayerId) return
      setSelectedSkill(skill)
    } else {
      setLocalSkill(skill)
    }
  }

  const handleEndTurn = () => {
    if (!activeGs || activeGs.winner !== null) return
    const pid = activeGs.currentTurn
    if (mode === 'online') {
      if (!roomId || !myPlayerId || pid !== myPlayerId) return
      gameSocket.endTurn(roomId, myPlayerId)
      setSelectedSkill(null)
    } else {
      setLocalState((gs) => {
        if (!gs) return gs
        const players = gs.players.map((p) => ({ ...p, cooldowns: { ...p.cooldowns } }))
        const sp = players.find((x) => x.id === pid)!
        ;(Object.keys(sp.cooldowns) as SkillType[]).forEach((k) => {
          if (sp.cooldowns[k] > 0) sp.cooldowns[k]--
        })
        const nt = (pid === 1 ? 2 : 1) as 1 | 2
        return {
          ...gs,
          players: players as [typeof players[0], typeof players[1]],
          currentTurn: nt,
          turnTimer: 5,
          turnPhase: 'move',
        }
      })
      setLocalSkill(null)
    }
  }

  const handleRestart = () => {
    if (mode === 'online' && roomId) {
      gameSocket.restartGame(roomId)
    } else if (mode === 'local') {
      setLocalState({
        roomId: 'LOCAL',
        currentTurn: 1,
        turnPhase: 'move',
        turnTimer: 5,
        players: [
          {
            id: 1,
            name: '玩家1',
            hp: 100,
            maxHp: 100,
            position: { row: 0, col: 0 },
            cooldowns: { fireball: 0, iceshield: 0, lightning: 0 },
            hasIceShield: false,
          },
          {
            id: 2,
            name: '玩家2',
            hp: 100,
            maxHp: 100,
            position: { row: 4, col: 4 },
            cooldowns: { fireball: 0, iceshield: 0, lightning: 0 },
            hasIceShield: false,
          },
        ],
        gridState: Array.from({ length: 5 }, () => Array(5).fill(null)),
        winner: null,
      })
      setLocalSkill(null)
    }
  }

  const winner = activeGs?.winner ?? null
  const roomReady = !!activeGs?.players[0] && !!activeGs?.players[1]
  const currentP1 = activeGs?.players[0]
  const currentP2 = activeGs?.players[1]

  return (
    <div
      className="w-full h-full min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 20% 10%, rgba(59,130,246,0.18), transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(139,92,246,0.18), transparent 50%), #0F172A',
        minWidth: 1024,
        minHeight: 700,
      }}
    >
      {flash && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.55)', zIndex: 9999 }}
        />
      )}

      {mode === 'menu' ? (
        <div className="flex flex-col items-center gap-10 p-10 rounded-3xl" style={{ background: '#1E293B', boxShadow: '0 0 60px rgba(59,130,246,0.25)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="text-7xl">⚔️✨🔮</div>
            <h1 className="text-5xl font-black tracking-wider" style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA,#F472B6)', WebkitBackgroundClip: 'text', color: 'transparent', fontFamily: 'Orbitron, sans-serif' }}>
              魔法能量对决
            </h1>
            <div className="text-slate-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              策略深度 · 华丽特效 · 双人对战
            </div>
          </div>
          <div className="flex gap-5">
            <button
              onClick={startLocalGame}
              className="text-white text-lg font-bold"
              style={{
                padding: '14px 40px',
                borderRadius: 12,
                background: 'linear-gradient(180deg,#3B82F6,#1D4ED8)',
                border: '1px solid #60A5FA',
                cursor: 'pointer',
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: 1,
                boxShadow: '0 6px 20px rgba(37,99,235,0.6)',
                transform: 'translateY(0)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(37,99,235,0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.6)'
              }}
            >
              🎮 本地双人对战
            </button>
            <button
              onClick={startOnlineGame}
              className="text-white text-lg font-bold"
              style={{
                padding: '14px 40px',
                borderRadius: 12,
                background: 'linear-gradient(180deg,#8B5CF6,#6D28D9)',
                border: '1px solid #A78BFA',
                cursor: 'pointer',
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: 1,
                boxShadow: '0 6px 20px rgba(139,92,246,0.6)',
                transform: 'translateY(0)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(139,92,246,0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(139,92,246,0.6)'
              }}
            >
              🌐 在线匹配对战
            </button>
          </div>
          <div className="text-sm text-slate-500 max-w-md text-center leading-relaxed" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            回合制战斗：每回合先移动到相邻格，再选择技能（火球/冰盾/闪电）和目标，5秒内完成操作！
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 p-6" style={{ minWidth: 1024 }}>
          <div
            className="text-xl font-bold px-6 py-2 rounded-full"
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              color: activeGs?.currentTurn === 1 ? '#FCA5A5' : '#93C5FD',
              animation: 'pulseAnim 1.5s ease-in-out infinite',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: 2,
              boxShadow: `0 0 20px ${activeGs?.currentTurn === 1 ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
            }}
          >
            回合倒计时 {activeGs?.turnTimer ?? 5}s · 玩家{actualTurn} 的回合
            {mode === 'online' && myPlayerId && ` · 你是玩家${myPlayerId}`}
            {waiting && ' · 匹配中...'}
          </div>

          <div className="flex items-center gap-8">
            {currentP1 && (
              <PlayerPanel
                player={currentP1}
                isCurrentTurn={activeGs?.currentTurn === 1}
                turnTimer={activeGs?.turnTimer ?? 5}
                selectedSkill={mode === 'online' ? selectedSkill : localSkill}
                onSelectSkill={handleSelectSkill(1)}
                onEndTurn={handleEndTurn}
                side="left"
                roomReady={roomReady}
              />
            )}
            <div
              className="flex flex-col items-center gap-3"
              onMouseLeave={() => setHoverTarget(null)}
            >
              <Battlefield
                gameState={activeGs}
                myPlayerId={mode === 'online' ? (myPlayerId ?? 1) : (activeGs?.currentTurn ?? 1)}
                onCellClick={handleCellClick}
                highlightCells={highlightCells}
                skillEffects={skillEffects}
                onFlashScreen={triggerFlash}
                winner={winner}
                showWinnerAnim={winnerAnim}
              />
              <div className="text-xs text-slate-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {mode === 'local'
                  ? `【玩家${actualTurn}操作】`
                  : ''}
                {activeGs?.turnPhase === 'move' && !localSkill && !selectedSkill
                  ? '点击相邻格移动 →'
                  : (localSkill || selectedSkill)
                  ? `释放 ${(localSkill || selectedSkill) === 'fireball' ? '火球' : (localSkill || selectedSkill) === 'iceshield' ? '冰盾' : '闪电'}：选择目标格`
                  : '选择技能 →'}
              </div>
            </div>
            {currentP2 && (
              <PlayerPanel
                player={currentP2}
                isCurrentTurn={activeGs?.currentTurn === 2}
                turnTimer={activeGs?.turnTimer ?? 5}
                selectedSkill={mode === 'online' ? selectedSkill : localSkill}
                onSelectSkill={handleSelectSkill(2)}
                onEndTurn={handleEndTurn}
                side="right"
                roomReady={roomReady}
              />
            )}
          </div>

          {winner !== null && (
            <div
              className="fixed inset-0 flex flex-col items-center justify-center z-50"
              style={{
                background: 'rgba(15,23,42,0.85)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div
                className="flex flex-col items-center gap-6 p-10 rounded-3xl"
                style={{
                  background: '#1E293B',
                  boxShadow: `0 0 60px ${winner === 1 ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}`,
                  border: `2px solid ${winner === 1 ? '#EF4444' : '#3B82F6'}`,
                }}
              >
                <div className="text-7xl" style={{ animation: 'winnerBlink 0.5s ease-in-out infinite' }}>
                  {winner === 1 ? '🧙‍♂️🏆' : '🏆🧙'}
                </div>
                <div
                  className="text-4xl font-black tracking-wider"
                  style={{
                    fontFamily: 'Orbitron, sans-serif',
                    color: winner === 1 ? '#FCA5A5' : '#93C5FD',
                    textShadow: `0 0 20px ${winner === 1 ? '#EF4444' : '#3B82F6'}`,
                  }}
                >
                  玩家 {winner} 获胜！
                </div>
                <button
                  onClick={handleRestart}
                  className="text-white text-xl font-bold"
                  style={{
                    padding: '14px 48px',
                    borderRadius: 12,
                    background: 'linear-gradient(180deg,#10B981,#059669)',
                    border: '1px solid #34D399',
                    cursor: 'pointer',
                    fontFamily: 'Rajdhani, sans-serif',
                    boxShadow: '0 6px 20px rgba(16,185,129,0.5)',
                  }}
                >
                  🔄 重新开始
                </button>
                <button
                  onClick={() => {
                    setMode('menu')
                    setLocalState(null)
                    setLocalSkill(null)
                    setSelectedSkill(null)
                  }}
                  className="text-slate-300 text-sm"
                  style={{
                    padding: '6px 20px',
                    background: 'transparent',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'Rajdhani, sans-serif',
                  }}
                >
                  返回主菜单
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes pulseAnim {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes winnerBlink {
          0%, 100% { filter: brightness(1); transform: scale(1); }
          50% { filter: brightness(1.5); transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
