import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import FossilPiece from './FossilPiece'
import { FossilPieceData, FossilPreset, Rotation } from '../types'
import { getRandomFossil, getRandomRotation } from '../fossilPresets'
import { eventBus, EVENTS } from '../eventBus'

interface PuzzleBoardProps {
  onStateChange: (state: {
    pieces: FossilPieceData[]
    placedCount: number
    totalCount: number
    score: number
    mistakes: number
    isComplete: boolean
    elapsedTime: number
    currentFossil: FossilPreset | null
  }) => void
  restartTrigger: number
  hintTrigger: number
  rotateTrigger: number
  hintMode: boolean
  setHintMode: (v: boolean) => void
}

const BOARD_WIDTH = 760
const BOARD_HEIGHT = 640
const PIECE_SIZE = 140
const SNAP_THRESHOLD = 30
const MIN_DISTANCE_FROM_TARGET = 30

function generateStartPositions(pieces: Omit<FossilPieceData, 'currentX' | 'currentY' | 'startX' | 'startY' | 'rotation' | 'isPlaced' | 'isLocked'>[]): FossilPieceData[] {
  const positions: FossilPieceData[] = []
  const usedPositions: { x: number; y: number }[] = []

  pieces.forEach((piece) => {
    let attempts = 0
    let valid = false
    let x = 0
    let y = 0

    while (!valid && attempts < 200) {
      const margin = PIECE_SIZE / 2 + 15
      x = margin + Math.random() * (BOARD_WIDTH - 2 * margin)
      y = margin + Math.random() * (BOARD_HEIGHT - 2 * margin)

      const distToTarget = Math.hypot(x - piece.targetX, y - piece.targetY)
      if (distToTarget < MIN_DISTANCE_FROM_TARGET + PIECE_SIZE / 2) {
        attempts++
        continue
      }

      valid = true
      for (const used of usedPositions) {
        const dist = Math.hypot(x - used.x, y - used.y)
        if (dist < PIECE_SIZE + 10) {
          valid = false
          break
        }
      }
      attempts++
    }

    usedPositions.push({ x, y })
    positions.push({
      ...piece,
      currentX: x,
      currentY: y,
      startX: x,
      startY: y,
      rotation: getRandomRotation(),
      isPlaced: false,
      isLocked: false,
    })
  })

  return positions
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  onStateChange,
  restartTrigger,
  hintTrigger,
  rotateTrigger,
  hintMode,
  setHintMode,
}) => {
  const boardRef = useRef<HTMLDivElement>(null)
  const [pieces, setPieces] = useState<FossilPieceData[]>([])
  const [currentFossil, setCurrentFossil] = useState<FossilPreset | null>(null)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [draggingPieceId, setDraggingPieceId] = useState<string | null>(null)
  const [highlightedSlotId, setHighlightedSlotId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const initGame = useCallback(() => {
    const fossil = getRandomFossil()
    setCurrentFossil(fossil)
    const initialized = generateStartPositions(fossil.pieces)
    setPieces(initialized)
    setScore(0)
    setMistakes(0)
    setIsComplete(false)
    setHintMode(false)
    startTimeRef.current = null
    setElapsedTime(0)
  }, [setHintMode])

  useEffect(() => {
    initGame()
  }, [restartTrigger, initGame])

  useEffect(() => {
    if (hintTrigger > 0) {
      setHintMode(true)
      setTimeout(() => setHintMode(false), 3000)
    }
  }, [hintTrigger, setHintMode])

  useEffect(() => {
    if (rotateTrigger > 0 && pieces.length > 0) {
      setPieces((prev) =>
        prev.map((p) =>
          p.isPlaced && !p.isLocked
            ? p
            : {
                ...p,
                rotation: (((p.rotation + 90) % 360) as Rotation),
              }
        )
      )
    }
  }, [rotateTrigger])

  useEffect(() => {
    if (startTimeRef.current === null) return
    if (isComplete) return

    const timer = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [startTimeRef.current, isComplete])

  useEffect(() => {
    onStateChange({
      pieces,
      placedCount: pieces.filter((p) => p.isPlaced && p.isLocked).length,
      totalCount: pieces.length,
      score,
      mistakes,
      isComplete,
      elapsedTime,
      currentFossil,
    })
  }, [pieces, score, mistakes, isComplete, elapsedTime, currentFossil, onStateChange])

  const handleDragStart = useCallback((id: string) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
    }
    setDraggingPieceId(id)
  }, [])

  const getPieceById = useCallback(
    (id: string) => pieces.find((p) => p.id === id),
    [pieces]
  )

  useEffect(() => {
    if (!draggingPieceId) {
      setHighlightedSlotId(null)
      return
    }
  }, [draggingPieceId])

  const handleDragEnd = useCallback(
    (id: string, dropX: number, dropY: number) => {
      const piece = getPieceById(id)
      if (!piece) return

      setDraggingPieceId(null)
      setHighlightedSlotId(null)

      const distToTarget = Math.hypot(dropX - piece.targetX, dropY - piece.targetY)

      if (distToTarget < SNAP_THRESHOLD) {
        const isCorrectRotation = piece.rotation === piece.correctRotation
        setPieces((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  currentX: p.targetX,
                  currentY: p.targetY,
                  isPlaced: true,
                  isLocked: isCorrectRotation,
                  startX: p.targetX,
                  startY: p.targetY,
                }
              : p
          )
        )

        setScore((s) => s + 100)
        eventBus.emit(EVENTS.PIECE_PLACED, id)

        setTimeout(() => {
          setPieces((prev) => {
            const updated = prev.map((p) =>
              p.id === id && p.rotation === p.correctRotation
                ? { ...p, isLocked: true }
                : p
            )
            const allPlacedAndCorrect = updated.every(
              (p) => p.isPlaced && p.rotation === p.correctRotation
            )
            if (allPlacedAndCorrect && updated.length > 0) {
              setIsComplete(true)
              eventBus.emit(EVENTS.PUZZLE_COMPLETE, {
                pieces: updated,
                score: score + 100,
                elapsedTime: elapsedTime,
                fossil: currentFossil,
              })
            }
            return updated
          })
        }, 250)
      } else {
        setPieces((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  currentX: p.startX,
                  currentY: p.startY,
                }
              : p
          )
        )
        setScore((s) => Math.max(0, s - 10))
        setMistakes((m) => m + 1)
        eventBus.emit(EVENTS.PIECE_MISPLACED, id)
      }
    },
    [getPieceById, score, elapsedTime, currentFossil]
  )

  const handleRotate = useCallback((id: string) => {
    setPieces((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== id || !p.isPlaced) return p
        const newRotation = (((p.rotation + 90) % 360) as Rotation)
        const isCorrect = newRotation === p.correctRotation
        return {
          ...p,
          rotation: newRotation,
          isLocked: isCorrect,
        }
      })

      const allPlacedAndCorrect = updated.every(
        (p) => p.isPlaced && p.rotation === p.correctRotation
      )
      if (allPlacedAndCorrect && updated.length > 0) {
        setTimeout(() => {
          setIsComplete(true)
          eventBus.emit(EVENTS.PUZZLE_COMPLETE, {
            pieces: updated,
            score,
            elapsedTime,
            fossil: currentFossil,
          })
        }, 400)
      }

      return updated
    })
    eventBus.emit(EVENTS.PIECE_ROTATED, id)
  }, [score, elapsedTime, currentFossil])

  const slots = useMemo(
    () =>
      pieces.map((p) => ({
        id: p.id,
        x: p.targetX,
        y: p.targetY,
        pattern: p.patternPath,
        isOccupied: p.isPlaced,
      })),
    [pieces]
  )

  return (
    <div className="puzzle-wrapper">
      <div className="puzzle-board" ref={boardRef}>
        {slots.map((slot) => (
          <div
            key={`slot-${slot.id}`}
            className={`target-slot ${hintMode ? 'hint' : ''} ${
              draggingPieceId && highlightedSlotId === slot.id ? 'highlighted' : ''
            } ${slot.isOccupied ? 'occupied' : ''}`}
            style={{
              left: slot.x,
              top: slot.y,
              display: slot.isOccupied ? 'none' : undefined,
            }}
          >
            <svg viewBox="0 0 140 140">
              <path
                d={slot.pattern}
                fill="none"
                stroke="#8B7D6B"
                strokeWidth="1"
                strokeDasharray="4,4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ))}

        {pieces.map((piece) => (
          <FossilPiece
            key={piece.id}
            piece={piece}
            boardRef={boardRef as React.RefObject<HTMLDivElement>}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onRotate={handleRotate}
            isHighlighted={false}
          />
        ))}

        {currentFossil && (
          <div className="era-label">{currentFossil.eraLabel}</div>
        )}
      </div>
    </div>
  )
}

export default PuzzleBoard
