import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRoomStore } from './store';
import { analyzeEmotions, EmotionResult } from './EmotionAnalyzer';

const VISIBLE_COUNT = 10;
const MAX_DOM_NODES = 30;

interface ChatPanelProps {
  onNewMessage: (emotions: EmotionResult[]) => void;
}

const headerStyle: React.CSSProperties = {
  padding: '12px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #E8D5B7',
  background: '#FFF8F0',
};

const messagesAreaStyle: React.CSSProperties = {
  flex: 1,
  maxHeight: '70vh',
  overflowY: 'auto',
  padding: '16px 20px',
  position: 'relative',
};

const editorStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderTop: '1px solid #E8D5B7',
  background: '#FFFAF5',
};

const lineInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #E0D0DC',
  fontSize: '15px',
  outline: 'none',
  marginBottom: '6px',
  background: '#FFF',
  color: '#4A3F4F',
  transition: 'border-color 0.2s ease',
};

const sendBtnStyle: React.CSSProperties = {
  padding: '10px 32px',
  borderRadius: '20px',
  background: '#8E6C88',
  color: '#FFF',
  border: 'none',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
};

const charCountStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
  textAlign: 'right',
  marginBottom: '8px',
};

const bubbleStyle = (isSelf: boolean): React.CSSProperties => ({
  background: isSelf
    ? 'linear-gradient(135deg, #E8D5F0, #F0E6F6)'
    : 'linear-gradient(135deg, #FCE4EC, #FFF0F5)',
  borderRadius: '12px',
  padding: '12px 16px',
  marginBottom: '12px',
  boxShadow: '#0000000A 0px 2px 8px',
  maxWidth: '80%',
  alignSelf: isSelf ? 'flex-end' : 'flex-start',
  animation: 'bubbleIn 0.4s ease forwards',
});

const emotionTagStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '12px',
  fontWeight: 500,
  background: '#E8E0F0',
  borderRadius: '8px',
  padding: '2px 8px',
  marginLeft: '6px',
};

const PLACEHOLDER_HEIGHT = 80;

export default function ChatPanel({ onNewMessage }: ChatPanelProps) {
  const { roomId, nickname, messages, addMessage } = useRoomStore();
  const [lines, setLines] = useState<string[]>(['', '', '']);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!roomId) return;
    fetch(`/api/rooms/${roomId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          useRoomStore.getState().setMessages(data);
        }
      })
      .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
      setContainerHeight(scrollRef.current.clientHeight);
    }
  }, []);

  const handleLineChange = (index: number, value: string) => {
    if (value.length > 15) return;
    const newLines = [...lines];
    newLines[index] = value;
    setLines(newLines);
  };

  const handleSend = async () => {
    if (!roomId || !nickname) return;
    const filled = lines.filter((l) => l.trim() !== '');
    if (filled.length === 0) return;
    const poemLines: [string, string, string] = [
      lines[0] || '',
      lines[1] || '',
      lines[2] || '',
    ];

    const emotions = analyzeEmotions([poemLines[0], poemLines[1], poemLines[2]]);

    const msg = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nickname,
      lines: poemLines,
      emotions,
      timestamp: Date.now(),
    };

    addMessage(msg);
    onNewMessage(emotions);

    try {
      await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      });
    } catch {}

    setLines(['', '', '']);
  };

  const totalItems = messages.length;
  const totalHeight = totalItems * PLACEHOLDER_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / PLACEHOLDER_HEIGHT) - 2);
  const endIndex = Math.min(
    totalItems,
    startIndex + VISIBLE_COUNT + 4
  );
  const visibleMessages = messages.slice(startIndex, endIndex);
  const topPadding = startIndex * PLACEHOLDER_HEIGHT;
  const bottomPadding = Math.max(0, totalHeight - endIndex * PLACEHOLDER_HEIGHT);

  const currentDomNodes = visibleMessages.length * 2 + 10;
  const shouldVirtualize = currentDomNodes > MAX_DOM_NODES;

  const handleMessageRef = useCallback((el: HTMLDivElement | null, index: number) => {
    if (!el) return;
    if (index === messages.length - 1) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={headerStyle}>
        <span style={{ fontSize: '14px', color: '#6B5B73' }}>
          房间码: <strong>{roomId}</strong>
        </span>
        <span style={{ fontSize: '12px', color: '#999' }}>
          {messages.length} 条诗行
        </span>
      </div>

      <div
        ref={scrollRef}
        style={messagesAreaStyle}
        onScroll={shouldVirtualize ? handleScroll : undefined}
        className="chat-scroll"
      >
        {shouldVirtualize && <div style={{ height: topPadding }} />}
        {visibleMessages.map((msg, i) => {
          const globalIndex = shouldVirtualize ? startIndex + i : i;
          const isSelf = msg.nickname === nickname;
          return (
            <div
              key={msg.id}
              ref={(el) => {
                if (globalIndex === messages.length - 1) handleMessageRef(el, globalIndex);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isSelf ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{ fontSize: '11px', color: '#B0A0B8', marginBottom: '4px', marginLeft: '4px' }}>
                {msg.nickname}
              </div>
              <div style={bubbleStyle(isSelf)}>
                {msg.lines.map((line, li) =>
                  line ? (
                    <div key={li} style={{ fontSize: '15px', color: '#4A3F4F', lineHeight: '1.8' }}>
                      {line}
                    </div>
                  ) : null
                )}
                <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {msg.emotions.map((e, ei) => (
                    <span
                      key={ei}
                      style={{
                        ...emotionTagStyle,
                        borderLeft: `3px solid ${e.color}`,
                      }}
                    >
                      {e.keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {shouldVirtualize && <div style={{ height: bottomPadding }} />}
      </div>

      <div style={editorStyle}>
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <input
              style={lineInputStyle}
              placeholder={`第${i + 1}行`}
              value={lines[i]}
              onChange={(e) => handleLineChange(i, e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#8E6C88')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E0D0DC')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && i < 2) {
                  e.preventDefault();
                  const next = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                  next?.focus();
                }
                if (e.key === 'Enter' && i === 2) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div style={charCountStyle}>{lines[i].length}/15</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            style={sendBtnStyle}
            onClick={handleSend}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#7A5D75')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#8E6C88')}
          >
            发送诗行
          </button>
        </div>
      </div>

      <style>{`
        .chat-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: #D8C4D0;
          border-radius: 2px;
        }
        @keyframes bubbleIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
