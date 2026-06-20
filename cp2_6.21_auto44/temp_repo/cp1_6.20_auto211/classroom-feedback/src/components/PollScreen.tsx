import { useEffect, useRef, useState, useCallback } from 'react';
import { TopicData, Question } from '../types';

interface Props {
  topics: string[];
  currentTopicIndex: number;
  topicDataMap: TopicData[];
  onSwitchTopic: (idx: number) => void;
  onExport: () => void;
}

const COLORS = {
  understood: '#52c41a',
  confused: '#faad14',
  lost: '#f5222d',
};

const BEZIER = 'cubic-bezier(0.4, 0, 0.2, 1)';

function lerpColor(a: number[], b: number[], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function getHeatColor(ratio: number): string {
  const red = [245, 34, 45];
  const green = [82, 196, 26];
  return lerpColor(red, green, ratio);
}

function Ring({ value, total, color, label, pulse }: { value: number; total: number; color: string; label: string; pulse: boolean }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * pct) / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        position: 'relative',
        width: 160,
        height: 160,
        transform: pulse ? 'scale(1.2)' : 'scale(1)',
        transition: `transform 0.3s ${BEZIER}`,
      }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={r} fill="none" stroke="#2c3e50" strokeWidth="10" />
          <circle
            cx="80" cy="80" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            style={{ transition: `stroke-dashoffset 250ms ${BEZIER}` }}
          />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div key={value} style={{
            fontSize: 32, fontWeight: 700, color: '#fff',
            animation: 'bounceNum 200ms ease-out',
          }}>
            {value}
          </div>
          <div style={{ fontSize: 14, color: '#8899aa' }}>{pct}%</div>
        </div>
      </div>
      <span style={{ color, fontSize: 14, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function HeatmapCanvas({ topics, topicDataMap, currentTopicIndex }: { topics: string[]; topicDataMap: TopicData[]; currentTopicIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 40;
    const gap = 4;
    const cols = 8;
    const rows = Math.ceil(topics.length / cols);

    canvas.width = cols * (size + gap) + gap;
    canvas.height = rows * (size + gap) + gap;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < topics.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gap + col * (size + gap);
      const y = gap + row * (size + gap);

      const td = topicDataMap[i];
      const total = td.votes.understood + td.votes.confused + td.votes.lost;
      const ratio = total > 0 ? td.votes.understood / total : 0;

      ctx.fillStyle = getHeatColor(ratio);
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 4);
      ctx.fill();

      if (i === currentTopicIndex) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 4);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, x + size / 2, y + size / 2);
    }
  }, [topics, topicDataMap, currentTopicIndex]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = 40;
    const gap = 4;
    const cols = 8;
    const col = Math.floor((x - gap) / (size + gap));
    const row = Math.floor((y - gap) / (size + gap));
    const idx = row * cols + col;
    if (idx >= 0 && idx < topics.length && col >= 0 && col < cols) {
      setHoveredIdx(idx);
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoveredIdx(null);
    }
  };

  const hoveredTd = hoveredIdx !== null ? topicDataMap[hoveredIdx] : null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredIdx(null)} style={{ display: 'block' }} />
      {hoveredIdx !== null && hoveredTd && (
        <div style={{
          position: 'absolute',
          left: mousePos.x + 12,
          top: mousePos.y - 10,
          background: 'rgba(13,27,42,0.95)',
          border: '1px solid #2c3e50',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#fff',
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 100,
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{topics[hoveredIdx]}</div>
          <div style={{ color: COLORS.understood }}>听懂: {hoveredTd.votes.understood}</div>
          <div style={{ color: COLORS.confused }}>疑惑: {hoveredTd.votes.confused}</div>
          <div style={{ color: COLORS.lost }}>没懂: {hoveredTd.votes.lost}</div>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const borderColor = question.lastFeedbackType ? COLORS[question.lastFeedbackType] : '#2c3e50';
  return (
    <div style={{
      background: 'rgba(255,255,255,0.9)',
      borderRadius: 8,
      padding: '10px 14px',
      borderLeft: `4px solid ${borderColor}`,
      animation: `slideInLeft 300ms ${BEZIER} ${index * 50}ms both`,
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{question.studentLabel}</div>
      <div style={{ fontSize: 14, color: '#1a1a2e' }}>{question.text}</div>
    </div>
  );
}

export default function PollScreen({ topics, currentTopicIndex, topicDataMap, onSwitchTopic, onExport }: Props) {
  const [pulsingType, setPulsingType] = useState<'understood' | 'confused' | 'lost' | null>(null);
  const prevVotesRef = useRef(topicDataMap[currentTopicIndex]?.votes || { understood: 0, confused: 0, lost: 0 });

  const currentData = topicDataMap[currentTopicIndex];
  const votes = currentData?.votes || { understood: 0, confused: 0, lost: 0 };
  const questions = currentData?.questions || [];
  const total = votes.understood + votes.confused + votes.lost;

  useEffect(() => {
    const prev = prevVotesRef.current;
    if (votes.understood > prev.understood) { setPulsingType('understood'); }
    else if (votes.confused > prev.confused) { setPulsingType('confused'); }
    else if (votes.lost > prev.lost) { setPulsingType('lost'); }
    prevVotesRef.current = votes;
    if (pulsingType) {
      const t = setTimeout(() => setPulsingType(null), 300);
      return () => clearTimeout(t);
    }
  }, [votes]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1b2a',
      color: '#fff',
      padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes bounceNum {
          0% { transform: translateY(8px); opacity: 0.5; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>课堂反馈系统</h1>
          <select
            value={currentTopicIndex}
            onChange={(e) => onSwitchTopic(Number(e.target.value))}
            style={{
              background: '#1b2838', color: '#fff', border: '1px solid #2c3e50',
              borderRadius: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer',
              outline: 'none',
            }}
          >
            {topics.map((t, i) => (
              <option key={i} value={i}>{i + 1}. {t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onExport}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: `transform 250ms ${BEZIER}, box-shadow 250ms ${BEZIER}`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        >
          导出数据
        </button>
      </div>

      <div className="poll-main" style={{
        display: 'flex', gap: 24, minHeight: 500,
      }}>
        <div style={{
          flex: '7 1 0',
          background: '#1b2838',
          borderRadius: 12,
          border: '1px solid rgba(44,62,80,0.5)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}>
          <div>
            <div style={{ fontSize: 14, color: '#8899aa', marginBottom: 4 }}>
              当前知识点 #{currentTopicIndex + 1}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {topics[currentTopicIndex]}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            <Ring value={votes.understood} total={total} color={COLORS.understood} label="听懂" pulse={pulsingType === 'understood'} />
            <Ring value={votes.confused} total={total} color={COLORS.confused} label="疑惑" pulse={pulsingType === 'confused'} />
            <Ring value={votes.lost} total={total} color={COLORS.lost} label="没懂" pulse={pulsingType === 'lost'} />
          </div>

          <div>
            <div style={{ fontSize: 14, color: '#8899aa', marginBottom: 12, fontWeight: 600 }}>
              知识掌握热力图
            </div>
            <HeatmapCanvas topics={topics} topicDataMap={topicDataMap} currentTopicIndex={currentTopicIndex} />
          </div>
        </div>

        <div style={{
          flex: '3 1 0',
          background: '#1b2838',
          borderRadius: 12,
          border: '1px solid rgba(44,62,80,0.5)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, flexShrink: 0 }}>
            实时提问 ({questions.length})
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            {questions.length === 0 && (
              <div style={{ color: '#556677', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
                暂无提问
              </div>
            )}
            {questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .poll-main {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
