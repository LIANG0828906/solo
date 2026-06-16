import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Pin, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Message {
  id: string
  userId: string
  content: string
  timestamp: string
  isPinned?: boolean
}

export interface ChatUser {
  id: string
  name: string
  avatar: string
}

interface ChatPanelProps {
  projectId: string
  messages: Message[]
  users: ChatUser[]
  currentUserId: string
  isAdmin: boolean
  onSendMessage: (content: string) => void
  onPinMessage: (messageId: string) => void
}

export default function ChatPanel({
  messages,
  users,
  currentUserId,
  isAdmin,
  onSendMessage,
  onPinMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sortedMessages = [...messages].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  })

  const getUserById = (userId: string) => {
    return users.find((u) => u.id === userId)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {sortedMessages.map((message, index) => {
            const user = getUserById(message.userId)
            const isCurrentUser = message.userId === currentUserId

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className={cn(
                  'flex gap-3 group relative',
                  isCurrentUser ? 'flex-row-reverse' : '',
                  message.isPinned ? 'bg-yellow-50 p-3 rounded-lg -mx-2' : ''
                )}
              >
                {message.isPinned && (
                  <Flag className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
                )}

                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />

                <div className={cn('flex flex-col max-w-[75%]', isCurrentUser ? 'items-end' : '')}>
                  <div className={cn('flex items-center gap-2 mb-1', isCurrentUser ? 'flex-row-reverse' : '')}>
                    <span className="text-sm font-medium text-gray-900">
                      {user?.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'px-4 py-2 rounded-2xl text-sm',
                      isCurrentUser
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                    )}
                  >
                    {message.content}
                  </div>

                  {isAdmin && !message.isPinned && (
                    <button
                      onClick={() => onPinMessage(message.id)}
                      className="opacity-0 group-hover:opacity-100 mt-1 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-opacity"
                    >
                      <Pin className="w-3 h-3" />
                      置顶
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors',
              input.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            发送
          </motion.button>
        </div>
      </div>
    </div>
  )
}
