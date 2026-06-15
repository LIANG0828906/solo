import { useEffect, useRef, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAppStore } from '@/store/useAppStore'
import type { QuizState } from '@/types'

export function useSocket(userId: string) {
  const socketRef = useRef<Socket | null>(null)
  const { setQuizStates, updateQuizState } = useAppStore()

  useEffect(() => {
    const socket = io('/socket.io', {
      transports: ['websocket', 'polling'],
      query: { userId },
    })

    socketRef.current = socket

    socket.on('quiz:state', (quizState: QuizState) => {
      updateQuizState(quizState)
    })

    socket.on('quiz:allStates', (quizStates: QuizState[]) => {
      setQuizStates(quizStates)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId, setQuizStates, updateQuizState])

  const submitAnswer = useCallback(
    (quizId: string, selectedOptionId: string) => {
      if (socketRef.current) {
        socketRef.current.emit('quiz:submit', {
          quizId,
          userId,
          selectedOptionId,
          answeredAt: Date.now(),
        })
      }
    },
    [userId]
  )

  return {
    socket: socketRef.current,
    submitAnswer,
    isConnected: socketRef.current?.connected ?? false,
  }
}
