import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Music,
} from 'lucide-react'
import { useMusicStore } from '@/store/musicStore'
import { cn } from '@/lib/utils'
import { LoopMode } from '@/types'

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getLoopIcon = (mode: LoopMode) => {
  switch (mode) {
    case 'single':
      return Repeat1
    case 'shuffle':
      return Shuffle
    case 'list':
    default:
      return Repeat
  }
}

export default function Player() {
  const {
    player,
    togglePlay,
    nextSong,
    prevSong,
    setVolume,
    setCurrentTime,
    toggleLoopMode,
  } = useMusicStore()

  const { currentSong, isPlaying, currentTime, duration, volume, loopMode, isTransitioning } = player

  const [isFlipped, setIsFlipped] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [prevVolume, setPrevVolume] = useState(volume)
  const [isRotating, setIsRotating] = useState(false