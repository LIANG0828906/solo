import { useState } from 'react';
import { useCardStore, Tag } from './store';

const TAG_COLORS: Record<string, string> = {
  '数学': '#E3F2FD',
  '英语': '#FCE4EC',
  '历史': '#FFF3E0',
  '编程': '#E8F5E9',
};

const TAGS: Tag[] = ['数学', '英语', '历史', '编程'];

export default function CardEditor() {
  const cards = useCardStore(s => s.cards);
  const addCard = useCardStore(s => s.addCard);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tag, setTag] = useState<Tag>('数学');
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const handleAdd = () => {
    if (!front.trim() || !back.trim()) return;
    addCard(front.trim(), back.trim(), tag);
    setFront('');
    setBack('');
  };

  const toggleFlip = (id: string) => {
    setFlipped(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #444',
    background: '#333',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div>
      <div
        style={{
          background: 'var(--card)',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '28px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--accent)' }}>
            正面（问题/提示）
          </label>
          <input
            value={front}
            onChange={e => setFront(e.target.value)}
            placeholder="输入问题或提示..."
            style={inputStyle}
          />
        </div>
        <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--accent)' }}>
            背面（答案/详解）
          </label>
          <input
            value={back}
            onChange={e => setBack(e.target.value)}
            placeholder="输入答案或详解..."
            style={inputStyle}
          />
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--accent)' }}>
            标签
          </label>
          <select
            value={tag}
            onChange={e => setTag(e.target.value as Tag)}
            style={{
              ...inputStyle,
              width: 'auto',
              minWidth: '100px',
            }}
          >
            {TAGS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          style={{
            padding: '10px 28px',
            border: 'none',
            borderRadius: '8px',
            background: 'var(--accent)',
            color: '#1E1E24',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'opacity 0.2s',
          }}
        >
          添加卡片
        </button>
      </div>

      <div
        className="card-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        {cards.map(card => (
          <div
            key={card.id}
            className="card-container"
            onClick={() => toggleFlip(card.id)}
            style={{
              perspective: '1000px',
              cursor: 'pointer',
              height: '180px',
              transition: 'transform 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(-3px)';
              el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = 'none';
            }}
          >
            <div className={`card-inner${flipped.has(card.id) ? ' flipped' : ''}`}>
              <div
                className="card-face"
                style={{
                  background: TAG_COLORS[card.tag] || 'var(--card)',
                  color: '#333',
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    fontSize: '11px',
                    opacity: 0.5,
                    color: '#666',
                  }}
                >
                  {card.tag}
                </span>
                {card.front}
              </div>
              <div
                className="card-face card-face-back"
                style={{
                  background: 'var(--card)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  border: '1px solid var(--accent)',
                }}
              >
                {card.back}
              </div>
            </div>
          </div>
        ))}
      </div>

      {cards.length === 0 && (
        <div style={{ textAlign: 'center', color: '#555', padding: '56px 0', fontSize: '15px' }}>
          还没有卡片，添加一张开始学习吧！
        </div>
      )}
    </div>
  );
}
