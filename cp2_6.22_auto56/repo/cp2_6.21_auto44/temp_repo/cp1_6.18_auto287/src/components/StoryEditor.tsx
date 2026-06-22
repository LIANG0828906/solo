import { useDrop } from 'react-dnd';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { StoryCard, CardType, Connection, DragItem } from '../types';
import { useGameStore } from '../store/gameStore';

const CARD_WIDTH = 180;
const CARD_HEIGHT = 90;
const TYPEWRITE_INTERVAL = 30;
const PARTICLE_COUNT = 50;
const PARTICLE_COLORS = ['#E94560', '#0F3460', '#533483'];

const typeLabelMap: Record<CardType, string> = {
  character: 'label-character',
  scene: 'label-scene',
  event: 'label-event',
  object: 'label-object',
};

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
  opacity: number;
}

function EditorCard({
  card,
  onClick,
  onConnectClick,
  isConnecting,
  isSelected,
}: {
  card: StoryCard;
  onClick: () => void;
  onConnectClick: (e: React.MouseEvent) => void;
  isConnecting: boolean;
  isSelected: boolean;
}) {
  const labelClass = typeLabelMap[card.type];
  const [justPlaced] = useState(true);

  return (
    <div
      className={justPlaced ? 'spring-in' : ''}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: 'absolute',
        left: card.x,
        top: card.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        padding: '14px 16px 14px 18px',
        background: 'linear-gradient(135deg, rgba(26,26,46,0.95), rgba(83,52,131,0.6))',
        borderRadius: 12,
        border: isSelected
          ? '2px solid #E94560'
          : isConnecting
          ? '2px solid #533483'
          : '1px solid rgba(233,69,96,0.4)',
        cursor: 'pointer',
        transition: 'all 0.3s ease, box-shadow 0.3s ease',
        boxShadow: isSelected
          ? '0 4px 20px rgba(233,69,96,0.4)'
          : '0 2px 12px rgba(0,0,0,0.3)',
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 6px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = isSelected
          ? '0 4px 20px rgba(233,69,96,0.4)'
          : '0 2px 12px rgba(0,0,0,0.3)';
      }}
    >
      <div className={`card-type-label ${labelClass}`} />
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#E0E0E0',
          marginBottom: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {card.name}
      </div>
      <div
        style={{
          fontSize: 11,
          color: '#8892B0',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {card.description}
      </div>
      {isConnecting && (
        <button
          onClick={onConnectClick}
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'linear-gradient(90deg, #E94560, #533483)',
            border: 'none',
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          连接到此
        </button>
      )}
    </div>
  );
}

function CardModal({
  card,
  onClose,
  onStartConnect,
}: {
  card: StoryCard;
  onClose: () => void;
  onStartConnect: () => void;
}) {
  const labelClass = typeLabelMap[card.type];
  const typeNames: Record<CardType, string> = {
    character: '角色',
    scene: '场景',
    event: '事件',
    object: '物件',
  };

  return (
    <div
      className="overlay-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="modal-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          padding: 32,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #E94560 0%, #533483 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div className={`card-type-label ${labelClass}`} style={{ position: 'relative', top: 0, left: 0 }} />
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
              {typeNames[card.type]}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>
              {card.name}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 15,
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.92)',
            marginBottom: 28,
            padding: '16px 20px',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: 10,
            borderLeft: '3px solid rgba(255,255,255,0.3)',
          }}
        >
          {card.description}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onStartConnect}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 10,
              background: '#fff',
              border: 'none',
              color: '#533483',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            连接 →
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function ConnectionLines({
  connections,
  cards,
}: {
  connections: Connection[];
  cards: StoryCard[];
}) {
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E94560" />
          <stop offset="100%" stopColor="#533483" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {connections.map((conn) => {
        const from = cardMap.get(conn.fromId);
        const to = cardMap.get(conn.toId);
        if (!from || !to || from.x === undefined || to.x === undefined || from.y === undefined || to.y === undefined) return null;

        const x1 = from.x + CARD_WIDTH / 2;
        const y1 = from.y + CARD_HEIGHT / 2;
        const x2 = to.x + CARD_WIDTH / 2;
        const y2 = to.y + CARD_HEIGHT / 2;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 20;

        return (
          <g key={conn.id}>
            <path
              className="draw-line"
              d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              stroke="url(#lineGradient)"
              strokeWidth={2}
              fill="none"
              filter="url(#glow)"
              strokeLinecap="round"
            />
            <circle cx={x1} cy={y1} r={4} fill="#E94560" filter="url(#glow)" />
            <circle cx={x2} cy={y2} r={4} fill="#533483" filter="url(#glow)" />
          </g>
        );
      })}
    </svg>
  );
}

function ParticleCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 2 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 1,
        vy: -0.5 - Math.random() * 0.5,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        opacity: 0.4 + Math.random() * 0.2,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      initParticles(rect.width, rect.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        ctx.beginPath();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(animate);
    };

    if (active) {
      animate();
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [active, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

export default function StoryEditor() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [pulseBtn, setPulseBtn] = useState(false);
  const typewriterRef = useRef<number>(0);

  const cards = useGameStore((s) => s.cards);
  const connections = useGameStore((s) => s.connections);
  const storyText = useGameStore((s) => s.storyText);
  const displayedStoryText = useGameStore((s) => s.displayedStoryText);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const connectingFromId = useGameStore((s) => s.connectingFromId);
  const isGenerating = useGameStore((s) => s.isGenerating);

  const addCardToEditor = useGameStore((s) => s.addCardToEditor);
  const generateStory = useGameStore((s) => s.generateStory);
  const setDisplayedStoryText = useGameStore((s) => s.setDisplayedStoryText);
  const setSelectedCardId = useGameStore((s) => s.setSelectedCardId);
  const setConnectingFromId = useGameStore((s) => s.setConnectingFromId);
  const addConnection = useGameStore((s) => s.addConnection);
  const setIsGenerating = useGameStore((s) => s.setIsGenerating);
  const resetAll = useGameStore((s) => s.resetAll);

  const placedCards = cards.filter((c) => c.placedInEditor);
  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) : null;

  const [{ isOver }, drop] = useDrop<DragItem, unknown, { isOver: boolean }>(() => ({
    accept: 'CARD',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const rect = editorRef.current?.getBoundingClientRect();
      if (!offset || !rect) return;
      const x = offset.x - rect.left - CARD_WIDTH / 2;
      const y = offset.y - rect.top - CARD_HEIGHT / 2;
      addCardToEditor(item.card.id, Math.max(10, x), Math.max(10, y));
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [addCardToEditor]);

  useEffect(() => {
    if (!isGenerating || !storyText) return;

    let i = 0;
    clearInterval(typewriterRef.current);

    typewriterRef.current = window.setInterval(() => {
      i++;
      setDisplayedStoryText(storyText.slice(0, i));
      if (i >= storyText.length) {
        clearInterval(typewriterRef.current);
        setIsGenerating(false);
      }
    }, TYPEWRITE_INTERVAL);

    return () => clearInterval(typewriterRef.current);
  }, [storyText, isGenerating, setDisplayedStoryText, setIsGenerating]);

  const handleGenerateClick = () => {
    setPulseBtn(true);
    setTimeout(() => setPulseBtn(false), 300);
    generateStory();
  };

  const handleCardClick = (card: StoryCard) => {
    if (connectingFromId && connectingFromId !== card.id) {
      addConnection(connectingFromId, card.id);
      setConnectingFromId(null);
      setSelectedCardId(null);
    } else {
      setSelectedCardId(card.id);
    }
  };

  const handleConnectStart = () => {
    if (selectedCardId) {
      setConnectingFromId(selectedCardId);
      setSelectedCardId(null);
    }
  };

  const handleEditorClick = () => {
    setSelectedCardId(null);
    setConnectingFromId(null);
  };

  const setEditorRef = (node: HTMLDivElement | null) => {
    drop(node);
    (editorRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <div
      ref={setEditorRef}
      onClick={handleEditorClick}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #16213E 0%, #0F3460 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ParticleCanvas active={isGenerating || displayedStoryText.length > 0} />

      {isOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px dashed #E94560',
            borderRadius: 0,
            background: 'rgba(233,69,96,0.05)',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />
      )}

      {placedCards.length === 0 && !displayedStoryText && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
              opacity: 0.3,
            }}
          >
            ✨
          </div>
          <div
            style={{
              fontSize: 18,
              color: '#8892B0',
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            从左侧拖拽卡片到这里
          </div>
          <div style={{ fontSize: 13, color: '#533483' }}>
            开始编织属于你的奇幻故事
          </div>
        </div>
      )}

      <ConnectionLines connections={connections} cards={placedCards} />

      {placedCards.map((card) => (
        <EditorCard
          key={card.id}
          card={card}
          onClick={() => handleCardClick(card)}
          onConnectClick={(e) => {
            e.stopPropagation();
            if (connectingFromId) {
              addConnection(connectingFromId, card.id);
              setConnectingFromId(null);
            }
          }}
          isConnecting={connectingFromId !== null && connectingFromId !== card.id}
          isSelected={selectedCardId === card.id}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          gap: 10,
          zIndex: 100,
        }}
      >
        {placedCards.length > 0 && (
          <button
            onClick={() => resetAll()}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              background: 'rgba(26,26,46,0.8)',
              border: '1px solid rgba(136,146,176,0.3)',
              color: '#8892B0',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.color = '#E94560';
              (e.target as HTMLButtonElement).style.borderColor = '#E94560';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.color = '#8892B0';
              (e.target as HTMLButtonElement).style.borderColor =
                'rgba(136,146,176,0.3)';
            }}
          >
            重置
          </button>
        )}
        <button
          onClick={handleGenerateClick}
          className={pulseBtn ? 'pulse-animation' : ''}
          disabled={placedCards.length === 0}
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            background: placedCards.length === 0 ? '#533483' : '#E94560',
            border: 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: placedCards.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow:
              placedCards.length === 0
                ? 'none'
                : '0 4px 16px rgba(233,69,96,0.4)',
          }}
          onMouseEnter={(e) => {
            if (placedCards.length > 0) {
              (e.target as HTMLButtonElement).style.background = '#FF6B6B';
              (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.target as HTMLButtonElement).style.boxShadow =
                '0 6px 20px rgba(233,69,96,0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (placedCards.length > 0) {
              (e.target as HTMLButtonElement).style.background = '#E94560';
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.target as HTMLButtonElement).style.boxShadow =
                '0 4px 16px rgba(233,69,96,0.4)';
            }
          }}
        >
          {isGenerating ? '生成中...' : '✨ 生成故事'}
        </button>
      </div>

      {connectingFromId && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            borderRadius: 10,
            background: 'linear-gradient(90deg, rgba(233,69,96,0.9), rgba(83,52,131,0.9))',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          点击另一张卡片建立连接，或点击空白处取消
        </div>
      )}

      {(displayedStoryText || isGenerating) && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: '40%',
            overflowY: 'auto',
            padding: '24px 32px',
            background:
              'linear-gradient(to top, rgba(26,26,46,0.98), rgba(22,33,62,0.9))',
            borderTop: '1px solid rgba(233,69,96,0.3)',
            zIndex: 50,
          }}
          className="custom-scrollbar"
        >
          <div
            style={{
              fontSize: 12,
              color: '#E94560',
              marginBottom: 12,
              fontWeight: 600,
              letterSpacing: 2,
            }}
          >
            ◆ 你的奇幻故事 ◆
          </div>
          <div
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 16,
              lineHeight: 2,
              color: '#E0E0E0',
              whiteSpace: 'pre-wrap',
            }}
          >
            {displayedStoryText}
            {isGenerating && (
              <span
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: 18,
                  background: '#E94560',
                  marginLeft: 2,
                  verticalAlign: 'middle',
                  animation: 'pulse-scale 0.8s ease-in-out infinite',
                }}
              />
            )}
          </div>
        </div>
      )}

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCardId(null)}
          onStartConnect={handleConnectStart}
        />
      )}
    </div>
  );
}
