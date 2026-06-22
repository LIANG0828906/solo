import { useState, useCallback } from 'react';

interface Props {
  topics: string[];
  currentTopicIndex: number;
  myVote: 'understood' | 'confused' | 'lost' | null;
  onSubmitFeedback: (type: 'understood' | 'confused' | 'lost') => void;
  onSubmitQuestion: (text: string) => void;
}

const BEZIER = 'cubic-bezier(0.4, 0, 0.2, 1)';

const BUTTON_CONFIGS: { type: 'understood' | 'confused' | 'lost'; label: string; gradient: string }[] = [
  { type: 'understood', label: '听懂', gradient: 'linear-gradient(135deg, #52c41a, #73d13d)' },
  { type: 'confused', label: '疑惑', gradient: 'linear-gradient(135deg, #faad14, #ffc53d)' },
  { type: 'lost', label: '没懂', gradient: 'linear-gradient(135deg, #f5222d, #ff4d4f)' },
];

export default function StudentPanel({ topics, currentTopicIndex, myVote, onSubmitFeedback, onSubmitQuestion }: Props) {
  const [questionText, setQuestionText] = useState('');
  const [questionSent, setQuestionSent] = useState(false);
  const [pressedBtn, setPressedBtn] = useState<'understood' | 'confused' | 'lost' | null>(null);

  const handleQuestionSubmit = useCallback(() => {
    const text = questionText.trim();
    if (!text) return;
    onSubmitQuestion(text);
    setQuestionText('');
    setQuestionSent(true);
    setTimeout(() => setQuestionSent(false), 2000);
  }, [questionText, onSubmitQuestion]);

  const handleFeedback = useCallback((type: 'understood' | 'confused' | 'lost') => {
    setPressedBtn(type);
    setTimeout(() => setPressedBtn(null), 100);
    onSubmitFeedback(type);
  }, [onSubmitFeedback]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1b2a',
      color: '#fff',
      padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box',
    }}>
      <div style={{
        background: '#1b2838',
        borderRadius: 12,
        border: '1px solid rgba(44,62,80,0.5)',
        padding: '16px 32px',
        marginBottom: 32,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, color: '#8899aa', marginBottom: 4 }}>当前知识点 #{currentTopicIndex + 1}</div>
        <div style={{
          fontSize: 24, fontWeight: 700, color: '#fff',
          background: '#000',
          display: 'inline-block',
          padding: '4px 16px',
          borderRadius: 6,
        }}>
          {topics[currentTopicIndex]}
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        marginBottom: 40,
      }}>
        {BUTTON_CONFIGS.map(({ type, label, gradient }) => {
          const isActive = myVote === type;
          const isPressed = pressedBtn === type;
          return (
            <div key={type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => handleFeedback(type)}
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 12,
                  border: isActive ? '3px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                  background: gradient,
                  color: '#fff',
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transform: isPressed ? 'scale(0.92)' : isActive ? 'scale(1.05)' : 'scale(1)',
                  transition: `transform 100ms ${BEZIER}, box-shadow 250ms ${BEZIER}, border 250ms ${BEZIER}`,
                  boxShadow: isActive
                    ? '0 4px 20px rgba(0,0,0,0.4)'
                    : '0 2px 8px rgba(0,0,0,0.2)',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isPressed) e.currentTarget.style.transform = isActive ? 'scale(1.05) translateY(-2px)' : 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isActive ? 'scale(1.05)' : '';
                  e.currentTarget.style.boxShadow = isActive ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.2)';
                }}
              >
                {label}
              </button>
              {isActive && (
                <span style={{ fontSize: 12, color: '#8899aa' }}>已反馈</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        width: '100%',
        maxWidth: 360,
        background: '#1b2838',
        borderRadius: 12,
        border: '1px solid rgba(44,62,80,0.5)',
        padding: 16,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>提交提问</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuestionSubmit(); }}
            placeholder="请输入你的问题..."
            style={{
              flex: 1,
              background: '#0d1b2a',
              border: '1px solid #2c3e50',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              transition: `border-color 250ms ${BEZIER}`,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#2c3e50'; }}
          />
          <button
            onClick={handleQuestionSubmit}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: `transform 250ms ${BEZIER}`,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
          >
            发送
          </button>
        </div>
        {questionSent && (
          <div style={{
            marginTop: 8,
            fontSize: 13,
            color: '#52c41a',
            animation: `fadeInOut 2000ms ${BEZIER}`,
          }}>
            提问已发送
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(4px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @media (max-width: 768px) {
          button {
            width: 100px !important;
            height: 100px !important;
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
