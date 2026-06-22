import type { Server as SocketIOServer, Socket } from 'socket.io'
import type { QuizState, QuizAnswerPayload, QuizQuestion } from '../shared/types'
import { quizQuestions } from './exhibits'

const COOLDOWN_MS = 3000

const quizStates: Map<string, QuizState> = new Map()

quizQuestions.forEach((q: QuizQuestion) => {
  quizStates.set(q.id, {
    questionId: q.id,
    answered: false,
    correct: undefined,
    cooldownUntil: 0
  })
})

function broadcastState(io: SocketIOServer, questionId: string): void {
  const state = quizStates.get(questionId)
  if (state) {
    io.emit('quiz:state', { questionId, state })
  }
}

export function setupQuizSocket(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id)

    quizStates.forEach((state, questionId) => {
      socket.emit('quiz:state', { questionId, state })
    })

    socket.on('quiz:answer', (payload: QuizAnswerPayload) => {
      const { questionId, answerIndex, playerId, playerName } = payload

      const question = quizQuestions.find(q => q.id === questionId)
      if (!question) {
        socket.emit('quiz:error', { message: 'Question not found' })
        return
      }

      const state = quizStates.get(questionId)
      if (!state) return

      const now = Date.now()
      if (state.cooldownUntil !== undefined && now < state.cooldownUntil) {
        socket.emit('quiz:cooldown', {
          questionId,
          remainingMs: state.cooldownUntil - now
        })
        return
      }

      if (state.answered) {
        socket.emit('quiz:alreadyAnswered', { questionId })
        return
      }

      const isCorrect = answerIndex === question.correctIndex

      state.answered = true
      state.correct = isCorrect
      state.cooldownUntil = now + COOLDOWN_MS

      socket.emit('quiz:result', {
        questionId,
        isCorrect,
        correctAnswer: question.correctIndex,
        playerName
      })

      broadcastState(io, questionId)

      setTimeout(() => {
        const currentState = quizStates.get(questionId)
        if (currentState) {
          currentState.answered = false
          currentState.correct = undefined
          currentState.cooldownUntil = 0
          broadcastState(io, questionId)
        }
      }, COOLDOWN_MS)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })
}
