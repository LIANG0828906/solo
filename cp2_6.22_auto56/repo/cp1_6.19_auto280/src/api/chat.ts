import axios from 'axios'
import { io, Socket } from 'socket.io-client'
import { ChatMessage } from '../types'

const API_BASE = '/api/chats'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/ws/chat', { transports: ['websocket'] })
  }
  return socket
}

export function joinChat(chatId: string): void {
  getSocket().emit('join_chat', { chatId })
}

export function onNewMessage(callback: (msg: ChatMessage) => void): void {
  getSocket().on('new_message', callback)
}

export function offNewMessage(callback: (msg: ChatMessage) => void): void {
  getSocket().off('new_message', callback)
}

export function onReadReceipt(callback: (data: { messageId: string }) => void): void {
  getSocket().on('read_receipt', callback)
}

export function offReadReceipt(callback: (data: { messageId: string }) => void): void {
  getSocket().off('read_receipt', callback)
}

export function sendSocketMessage(chatId: string, content: string): void {
  getSocket().emit('send_message', { chatId, content })
}

export function sendReadReceipt(chatId: string, messageId: string): void {
  getSocket().emit('mark_read', { chatId, messageId })
}

export async function fetchChatMessages(chatId: string): Promise<ChatMessage[]> {
  const res = await axios.get(`${API_BASE}/${chatId}/messages`)
  return res.data
}

export async function postChatMessage(chatId: string, content: string): Promise<ChatMessage> {
  const res = await axios.post(`${API_BASE}/${chatId}/messages`, { content })
  return res.data
}
