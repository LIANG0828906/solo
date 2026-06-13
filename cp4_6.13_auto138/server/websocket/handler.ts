import { WebSocket, Server as WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { WebSocketMessage, FeedbackEmitData, FeedbackUpdateData, SubscribeData } from '../types.js'
import * as feedbackService from '../services/feedbackService.js'

interface ExtendedWebSocket extends WebSocket {
  surveyId?: string
}

const clients = new Map<string, Set<ExtendedWebSocket>>()

export function setupWebSocketHandler(wss: WebSocketServer): void {
  wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) => {
    console.log('New WebSocket connection')

    ws.on('message', (message: string) => {
      handleMessage(ws, message)
    })

    ws.on('close', () => {
      handleClose(ws)
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  })
}

function handleMessage(ws: ExtendedWebSocket, message: string): void {
  try {
    const parsed: WebSocketMessage<unknown> = JSON.parse(message.toString())
    const { event, data } = parsed

    switch (event) {
      case '/feedback/emit':
        handleFeedbackEmit(ws, data as FeedbackEmitData)
        break
      case '/survey/subscribe':
        handleSubscribe(ws, data as SubscribeData)
        break
      default:
        console.log('Unknown event:', event)
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error)
  }
}

function handleFeedbackEmit(ws: ExtendedWebSocket, data: FeedbackEmitData): void {
  try {
    const feedback = feedbackService.createFeedback(data)
    broadcastToSurvey(data.surveyId, '/feedback/update', feedback)
  } catch (error) {
    console.error('Error handling feedback emit:', error)
    sendMessage(ws, '/error', { message: 'Failed to submit feedback' })
  }
}

function handleSubscribe(ws: ExtendedWebSocket, data: SubscribeData): void {
  const { surveyId } = data

  if (ws.surveyId && ws.surveyId !== surveyId) {
    unsubscribeFromSurvey(ws, ws.surveyId)
  }

  subscribeToSurvey(ws, surveyId)
  ws.surveyId = surveyId

  sendMessage(ws, '/survey/subscribed', { surveyId })
}

function subscribeToSurvey(ws: ExtendedWebSocket, surveyId: string): void {
  if (!clients.has(surveyId)) {
    clients.set(surveyId, new Set())
  }
  clients.get(surveyId)!.add(ws)
  console.log(`Client subscribed to survey ${surveyId}`)
}

function unsubscribeFromSurvey(ws: ExtendedWebSocket, surveyId: string): void {
  const surveyClients = clients.get(surveyId)
  if (surveyClients) {
    surveyClients.delete(ws)
    if (surveyClients.size === 0) {
      clients.delete(surveyId)
    }
  }
}

function handleClose(ws: ExtendedWebSocket): void {
  if (ws.surveyId) {
    unsubscribeFromSurvey(ws, ws.surveyId)
  }
  console.log('WebSocket connection closed')
}

function broadcastToSurvey<T>(surveyId: string, event: string, data: T): void {
  const surveyClients = clients.get(surveyId)
  if (!surveyClients) return

  const message = JSON.stringify({ event, data })

  surveyClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })

  console.log(`Broadcast to ${surveyClients.size} clients for survey ${surveyId}`)
}

function sendMessage<T>(ws: WebSocket, event: string, data: T): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, data }))
  }
}

export function getClientCount(): number {
  let count = 0
  clients.forEach((surveyClients) => {
    count += surveyClients.size
  })
  return count
}

export function getSurveyClientCount(surveyId: string): number {
  return clients.get(surveyId)?.size || 0
}
