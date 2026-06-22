import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

interface ChatMessage {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  createdAt: string
  read: boolean
}

interface PeerUser {
  id: string
  username: string
}

const ChatPage: React.FC = () => {
  const { id: peerId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [peer, setPeer] = useState<PeerUser | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const fetchMessages = useCallback(async () => {
    if (!peerId || !user) return

    try {
      const res = await axios.get(`/api/chat/${peerId}`)
      setMessages(res.data.messages)
      scrollToBottom()
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }, [peerId, user, scrollToBottom])

  const fetchPeer = useCallback(async () => {
    if (!peerId) return

    try {
      const res = await axios.get(`/api/users/${peerId}`)
      setPeer(res.data)
    } catch (error) {
      console.error('Failed to fetch peer:', error)
    }
  }, [peerId])

  useEffect(() => {
    if (!user && !useAuthStore.getState().loading) {
      navigate('/login')
      return
    }

    fetchMessages()
    fetchPeer()

    pollIntervalRef.current = setInterval(fetchMessages, 3000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [user, navigate, fetchMessages, fetchPeer])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = async () => {
    if (!input.trim() || !peerId || !user) return

    const content = input.trim()
    setInput('')

    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      fromUserId: user.id,
      toUserId: peerId,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    }

    setMessages(prev => [...prev, tempMessage])

    try {
      const res = await axios.post(`/api/chat/${peerId}`, { content })
      setMessages(prev =>
        prev.map(m =>
          m.id === tempMessage.id ? res.data.message : m
        )
      )

      const localKey = `chat_${user.id}_${peerId}`
      const localMessages = JSON.parse(localStorage.getItem(localKey) || '[]')
      localMessages.push(res.data.message)
      localStorage.setItem(localKey, JSON.stringify(localMessages))
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
      alert('消息发送失败，请重试')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const oneDay = 24 * 60 * 60 * 1000

    if (diff < 60 * 1000) {
      return '刚刚'
    } else if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`
    } else if (diff < oneDay) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diff < 7 * oneDay) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return days[date.getDay()]
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  const loadLocalMessages = () => {
    if (!user || !peerId) return []
    const localKey = `chat_${user.id}_${peerId}`
    return JSON.parse(localStorage.getItem(localKey) || '[]')
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-cream">
        <div className="text-brown font-serif text-xl">请先登录</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-cream">
      <div className="bg-brown text-cream px-4 py-3 flex items-center gap-3 shadow-md">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center hover:bg-brown-light rounded-lg transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <h2 className="font-serif font-semibold text-lg">
            {peer?.username || '加载中...'}
          </h2>
          <p className="text-xs text-cream/70">
            {peer ? '在线沟通取书时间和地点' : ''}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-brown-light text-sm">加载消息中...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-brown font-serif text-lg mb-2">开始你们的对话</p>
            <p className="text-brown-light text-sm">
              和对方沟通取书时间、地点等细节
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.fromUserId === user.id
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isMine
                      ? 'bg-brown text-cream rounded-br-md'
                      : 'bg-white text-brown rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMine ? 'text-cream/60' : 'text-brown-light'
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-brown/10 bg-cream-dark px-4 py-3">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            rows={1}
            className="flex-1 resize-none bg-white border border-brown/20 rounded-xl px-4 py-2.5 text-brown placeholder-brown-light focus:outline-none focus:border-brown transition-colors max-h-32"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-5 py-2.5 bg-brown text-cream rounded-xl font-medium hover:bg-brown-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            发送
          </button>
        </div>
        <p className="text-xs text-brown-light mt-2 text-center">
          消息已本地存储，每3秒自动刷新
        </p>
      </div>
    </div>
  )
}

export default ChatPage
