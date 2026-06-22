import { useGameStore } from '@/store/gameStore'
import { useEffect, useState } from 'react'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60