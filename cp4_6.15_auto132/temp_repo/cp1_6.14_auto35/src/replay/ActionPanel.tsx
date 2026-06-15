import { useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipForward, SkipBack, FastForward, Clock, Shield, Heart, Zap, Swords, Sparkles, Package } from 'lucide-react'
import { useReplayStore } from '@/store/useReplayStore'
import type { UnitState, ActionRecord } from '@/types/replay'

const SPEEDS = [1, 2, 4, 8]

function HpBar({ unit, prevHp }: { unit: UnitState; prevHp: number | undefined }) {
  const pct = Math.max(0, (unit.hp / unit.maxHp) * 100)
  const diff = prevHp !== undefined ? unit.hp - prevHp : 0
  const hasChanged = prevHp !== undefined && diff !== 0
  const animClass = hasChanged ? (diff < 0 ? 'hp-bar-damage' : 'hp-bar-heal') : ''
  const trailWidth = prevHp !== undefined ? Math.max(0, (prevHp / unit.maxHp) * 100) : pct
  const shieldPct = unit.maxShield > 0 ? (unit.shield / unit.maxShield) * 100 : 0

  return (
    <div className="space-y-0.5">
      <div className="relative h-3 w-full overflow-hidden rounded-sm bg-dungeon-border">
        <div className="hp-bar-trail absolute inset-y-0 left-0 rounded-sm bg-red-400/30 transition-all duration-700" style={{ width: trailWidth }} />
        <div className={`absolute inset-y-0 left-0 rounded-sm bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300 ${animClass}`} style={{ width: pct }} />
      </div>
      {unit.maxShield > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-sm bg-dungeon-border">
          <div className="h-full rounded-sm bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-300" style={{ width: shieldPct }} />
        </div>
      )}
      <div className="flex items-center justify-between text-[10px] text-dungeon-text-muted">
        <span className="flex items-center gap-1"><Heart className="h-2.5 w-2.5" />{unit.hp}/{unit.maxHp}</span>
        {unit.maxShield > 0 && <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" />{unit.shield}</span>}
      </div>
    </div>
  )
}

const ACTION_ICONS: Record<ActionRecord['type'], React.ReactNode> = {
  move: <Zap className="h-3 w-3 text-yellow-400" />,
  attack: <Swords className="h-3 w-3 text-red-400" />,
  spell: <Sparkles className="h-3 w-3 text-purple-400" />,
  item: <Package className="h-3 w-3 text-green-400" />,
}

export default function ActionPanel() {
  const { currentFrame, currentFrameIndex, totalFrames, isPlaying, playbackSpeed,
    setIsPlaying, stepForward, stepBackward, setPlaybackSpeed, setCurrentFrameIndex } = useReplayStore()
  const prevHpMap = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (!currentFrame) return
    const next = new Map(prevHpMap.current)
    currentFrame.units.forEach(u => next.set(u.id, u.hp))
    prevHpMap.current = next
  }, [currentFrame])

  const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrameIndex(Number(e.target.value))
  }, [setCurrentFrameIndex])

  if (!currentFrame) return <div className="flex h-full items-center justify-center text-dungeon-text-muted">No replay loaded</div>

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <aside className="flex h-full flex-col gap-3 overflow-y-auto bg-dungeon-panel p-3 scrollbar-dark md:w-72 lg:w-80">
      <div className="flex items-center gap-2 text-xs text-dungeon-text-muted">
        <Clock className="h-3.5 w-3.5" />
        <span>{fmt(currentFrame.timestamp)}</span>
        <span className="ml-auto">Frame {currentFrameIndex + 1}/{totalFrames}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={stepBackward} className="rounded p-1.5 text-dungeon-text hover:bg-dungeon-border"><SkipBack className="h-4 w-4" /></button>
        <button onClick={() => setIsPlaying(!isPlaying)} className="rounded bg-dungeon-accent/20 p-1.5 text-dungeon-accent hover:bg-dungeon-accent/30">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button onClick={stepForward} className="rounded p-1.5 text-dungeon-text hover:bg-dungeon-border"><SkipForward className="h-4 w-4" /></button>
        <div className="relative ml-auto flex items-center gap-1">
          <FastForward className="h-3.5 w-3.5 text-dungeon-text-muted" />
          <select value={playbackSpeed} onChange={e => setPlaybackSpeed(Number(e.target.value))}
            className="appearance-none rounded bg-dungeon-border px-1.5 py-0.5 text-xs text-dungeon-text outline-none">
            {SPEEDS.map(s => <option key={s} value={s}>{s}x</option>)}
          </select>
        </div>
      </div>

      <input type="range" min={0} max={Math.max(totalFrames - 1, 0)} value={currentFrameIndex}
        onChange={onSeek} className="h-1 w-full cursor-pointer accent-dungeon-accent" />

      <div className="mt-1 space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-dungeon-text-muted">Units</h3>
        {currentFrame.units.map(u => (
          <div key={u.id} className="rounded border border-dungeon-border bg-dungeon-bg/50 p-2">
            <div className="mb-1 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${u.team === 'player' ? 'bg-cyan-400' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-dungeon-text">{u.name}</span>
              <span className="ml-auto flex items-center gap-0.5 text-[10px] text-yellow-400"><Zap className="h-2.5 w-2.5" />{u.actionPoints}</span>
            </div>
            <HpBar unit={u} prevHp={prevHpMap.current.get(u.id)} />
          </div>
        ))}
      </div>

      {currentFrame.actions.length > 0 && (
        <div className="mt-1 space-y-1.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-dungeon-text-muted">Actions</h3>
          {currentFrame.actions.map((a, i) => (
            <div key={i} className="flex items-start gap-1.5 rounded bg-dungeon-bg/30 px-2 py-1 text-[11px] text-dungeon-text">
              {ACTION_ICONS[a.type]}
              <span>{a.description}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
