import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Send } from 'lucide-react';

function ChatPanel() {
  const { messages, sendChatMessage, currentTurn } = useGameStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendChatMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-grid-line">
        <h3 className="font-bold font-orbitron text-electric-blue">聊天</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            {currentTurn === 'opponent' ? '等待对手操作...' : '开始聊天吧！'}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`
                flex ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}
                ${msg.sender === 'system' ? 'justify-center' : ''}
              `}
            >
              {msg.sender === 'system' ? (
                <div className="bg-grid-line/50 text-gray-400 text-xs px-4 py-2 rounded-full">
                  {msg.content}
                </div>
              ) : (
                <div
                  className={`
                    max-w-[80%] px-4 py-2 rounded-2xl
                    ${msg.sender === 'player' 
                      ? 'bg-deep-blue text-white rounded-br-md' 
                      : 'bg-chat-opponent text-gray-200 rounded-bl-md'
                    }
                  `}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'player' ? 'text-blue-300' : 'text-gray-500'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-grid-line">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="input-field flex-1 py-2 text-sm"
            maxLength={200}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-3 rounded-lg bg-electric-blue hover:bg-electric-blue-dark transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
