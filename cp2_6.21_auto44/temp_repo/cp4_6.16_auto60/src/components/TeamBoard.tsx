/**
 * ============================================================
 *  TeamBoard - 小组积分面板组件
 * ============================================================
 *
 *  依赖关系：
 *    - 依赖: src/store.ts (读取小组数据、调用重排方法)
 *    - 依赖: src/types.ts (Team 类型)
 *    - 依赖: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (拖拽排序)
 *    - 依赖: react-confetti (纸屑庆祝动画)
 *
 *  数据流向：
 *    输入: 从 store 读取 teams 数组和 session 状态
 *    输出: 拖拽结束时调用 store.reorderTeams 更新顺序
 *    触发: 分数变化时播放数字滚动动画和纸屑效果
 *
 *  与其他组件的交互：
 *    - QuizPanel: 通过 store 共享小组数据，小组管理操作影响本组件展示
 *    - BuzzerPage: 抢答成功后，本组件显示抢答提示横幅和分数更新
 *    - ScoreLog: 与本组件共享得分数据，展示不同维度
 *
 *  交互方式：
 *    - 长按小组卡片可拖拽调整顺序
 *    - 抢答成功时左侧显示闪烁提示横幅
 *    - 分数变化时有数字滚动动画效果
 * ============================================================
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Confetti from 'react-confetti'
import { GripVertical } from 'lucide-react'
import { useQuizStore } from '../store'
import type { Team } from '../types'

interface SortableTeamCardProps {
  team: Team
  isBuzzed: boolean
  previousScore: number
}

const SortableTeamCard: React.FC<SortableTeamCardProps> = ({
  team,
  isBuzzed,
  previousScore,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: team.id })

  const [displayScore, setDisplayScore] = useState(team.score)
  const [showConfetti, setShowConfetti] = useState(false)
  const scoreAnimRef = useRef<number | null>(null)

  useEffect(() => {
    if (team.score !== previousScore && team.score > previousScore) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)

      const startValue = previousScore
      const endValue = team.score
      const duration = 800
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(startValue + (endValue - startValue) * easeOut)
        setDisplayScore(current)

        if (progress < 1) {
          scoreAnimRef.current = requestAnimationFrame(animate)
        }
      }

      scoreAnimRef.current = requestAnimationFrame(animate)

      return () => {
        clearTimeout(timer)
        if (scoreAnimRef.current) {
          cancelAnimationFrame(scoreAnimRef.current)
        }
      }
    } else {
      setDisplayScore(team.score)
    }
  }, [team.score, previousScore])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeftColor: team.color,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative flex-1 min-w-0 p-4 rounded-xl backdrop-blur-lg
        bg-white/10 border-l-4 transition-all duration-200
        ${isBuzzed ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent scale-105' : ''}
      `}
    >
      {showConfetti && (
        <Confetti
          width={200}
          height={100}
          numberOfPieces={50}
          gravity={0.3}
          colors={[team.color, '#ffffff', '#fbbf24']}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        />
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-white/40 hover:text-white/70 transition-colors p-1 -ml-1"
          >
            <GripVertical size={16} />
          </button>
          <h3 className="text-white font-bold text-lg truncate">{team.name}</h3>
        </div>
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: team.color }}
        />
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-white tabular-nums">
          {displayScore}
        </span>
        <span className="text-white/60 text-sm">分</span>
      </div>

      {isBuzzed && (
        <div
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-16 rounded-full animate-pulse"
          style={{ backgroundColor: team.color, boxShadow: `0 0 20px ${team.color}` }}
        />
      )}
    </div>
  )
}

const TeamBoard: React.FC = () => {
  const { teams, session, reorderTeams } = useQuizStore()

  const [previousScores, setPreviousScores] = useState<Record<string, number>>({})
  const prevScoresRef = useRef<Record<string, number>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const sortedTeams = [...teams].sort((a, b) => a.order - b.order)

  useEffect(() => {
    const newScores: Record<string, number> = {}
    teams.forEach((team) => {
      newScores[team.id] = prevScoresRef.current[team.id] ?? team.score
    })
    setPreviousScores(newScores)

    const currentScores: Record<string, number> = {}
    teams.forEach((team) => {
      currentScores[team.id] = team.score
    })
    prevScoresRef.current = currentScores
  }, [teams])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderTeams(String(active.id), String(over.id))
    }
  }

  const buzzedTeamId = session.buzzedTeamId

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedTeams.map((t) => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4">
            {sortedTeams.map((team) => (
              <SortableTeamCard
                key={team.id}
                team={team}
                isBuzzed={team.id === buzzedTeamId}
                previousScore={previousScores[team.id] ?? team.score}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default TeamBoard
