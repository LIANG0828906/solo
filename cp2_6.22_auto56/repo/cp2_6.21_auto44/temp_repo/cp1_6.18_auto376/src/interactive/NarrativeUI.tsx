import { useEffect, useRef, useState, useMemo } from 'react';
import { useMazeStore, StoryLine } from '@/maze/mazeStore';

const TYPE_INTERVAL = 40;

function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayed('');
    idxRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      idxRef.current++;
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        if (timerRef.current) clearInterval(timerRef.current);
        onComplete?.();
      } else {
        setDisplayed(text.substring(0, idxRef.current));
      }
    }, TYPE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, onComplete]);

  return (
    <span className={displayed.length < text.length ? 'typewriter-cursor' : ''}>
      {displayed}
    </span>
  );
}

function DialogPanel() {
  const activeFragment = useMazeStore(s => s.activeFragment);
  const setActiveFragment = useMazeStore(s => s.setActiveFragment);

  if (!activeFragment) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 320,
        maxWidth: '90vw',
        padding: '20px 24px',
        borderRadius: 16,
        background: 'rgba(10, 17, 40, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(0, 255, 170, 0.3)',
        boxShadow: '0 0 20px rgba(0, 255, 170, 0.2), inset 0 0 20px rgba(0, 255, 170, 0.05)',
        color: '#E0FFF0',
        fontFamily: "'Courier New', monospace",
        fontSize: 14,
        lineHeight: 1.6,
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#00FFAA',
          marginBottom: 8,
          letterSpacing: 2,
          textTransform: 'uppercase',
          opacity: 0.8,
        }}
      >
        ◇ 碎片 · {activeFragment.storyLine} #{activeFragment.order + 1}
      </div>
      <div style={{ minHeight: 60 }}>
        <TypewriterText text={activeFragment.text} />
      </div>
      <button
        onClick={() => setActiveFragment(null)}
        className="glow-button"
        style={{
          marginTop: 16,
          padding: '8px 20px',
          background: 'transparent',
          border: '1px solid #00FFAA',
          borderRadius: 6,
          color: '#00FFAA',
          fontFamily: "'Courier New', monospace",
          fontSize: 12,
          cursor: 'pointer',
          letterSpacing: 1,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = 'rgba(0, 255, 170, 0.15)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        [ 继续探索 ]
      </button>
    </div>
  );
}

function HUD() {
  const fragments = useMazeStore(s => s.fragments);
  const storyLines = useMazeStore(s => s.storyLines);
  const collected = useMazeStore(s => s.playerState.collectedFragments);
  const triggerEnding = useMazeStore(s => s.triggerEnding);
  const activeEnding = useMazeStore(s => s.activeEnding);

  if (activeEnding) return null;

  const total = fragments.length;
  const collectedCount = collected.length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        padding: '14px 18px',
        borderRadius: 12,
        background: 'rgba(10, 17, 40, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(0, 255, 170, 0.25)',
        color: '#E0FFF0',
        fontFamily: "'Courier New', monospace",
        fontSize: 12,
        zIndex: 90,
        minWidth: 200,
      }}
    >
      <div style={{ fontSize: 11, color: '#00FFAA', marginBottom: 8, letterSpacing: 2 }}>
        记忆迷宫 / MEMORY MAZE
      </div>
      <div style={{ marginBottom: 10, opacity: 0.9 }}>
        碎片收集: <span style={{ color: '#FFD700' }}>{collectedCount}</span> / {total}
      </div>
      <div style={{ width: '100%', height: 4, background: '#0A2A48', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            width: `${total > 0 ? (collectedCount / total) * 100 : 0}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00FFAA, #FFD700)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        {storyLines.map(line => {
          const lineCollected = line.fragments.filter(id => collected.includes(id)).length;
          return (
            <div
              key={line.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span style={{ opacity: line.unlocked ? 1 : 0.55 }}>
                {line.unlocked ? '✓' : '○'} {line.name}
              </span>
              <span style={{ fontSize: 10, color: line.unlocked ? '#FFD700' : '#88AAAA' }}>
                {lineCollected}/{line.fragments.length}
              </span>
              {line.unlocked && !activeEnding && (
                <button
                  onClick={() => triggerEnding(line.id)}
                  className="glow-button-gold"
                  style={{
                    marginLeft: 8,
                    padding: '3px 8px',
                    fontSize: 10,
                    background: 'rgba(255, 215, 0, 0.12)',
                    border: '1px solid #FFD700',
                    borderRadius: 4,
                    color: '#FFD700',
                    fontFamily: "'Courier New', monospace",
                    cursor: 'pointer',
                  }}
                >
                  查看
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EndingScene({ ending }: { ending: StoryLine }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resetGame = useMazeStore(s => s.resetGame);
  const activeEnding = useMazeStore(s => s.activeEnding);
  const [showText, setShowText] = useState(false);

  const color = useMemo(() => {
    switch (ending.ending.type) {
      case 'victory': return { r: 255, g: 215, b: 0, dir: 1 };
      case 'sorrow': return { r: 80, g: 140, b: 255, dir: -1 };
      default: return { r: 160, g: 160, b: 200, dir: 0 };
    }
  }, [ending.ending.type]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;
    const particles: Array<{ x: number; y: number; vy: number; size: number; alpha: number }> = [];
    const count = 250;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vy: (Math.random() * 1.2 + 0.3) * (color.dir === 0 ? (Math.random() - 0.5) : color.dir),
        size: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.6 + 0.3,
      });
    }
    let raf = 0;
    const render = () => {
      ctx.fillStyle = 'rgba(10, 17, 40, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.vy;
        p.x += Math.sin(p.y * 0.01) * 0.3;
        if (color.dir >= 0 && p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (color.dir < 0 && p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
      }
      raf = requestAnimationFrame(render);
    };
    render();
    const t = setTimeout(() => setShowText(true), 800);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [color.r, color.g, color.b, color.dir]);

  if (!activeEnding) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0A1128',
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      {showText && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontFamily: "'Courier New', monospace",
            padding: 40,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 14,
              letterSpacing: 6,
              color: `rgb(${color.r}, ${color.g}, ${color.b})`,
              marginBottom: 24,
              opacity: 0.9,
            }}
          >
            ◆ {ending.name} · 结局解锁 ◆
          </div>
          <div
            style={{
              maxWidth: 560,
              fontSize: 18,
              lineHeight: 2,
              color: '#E8F0FF',
              textShadow: `0 0 20px rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`,
              marginBottom: 40,
            }}
          >
            <TypewriterText text={ending.ending.text} />
          </div>
          <button
            onClick={resetGame}
            className="glow-button"
            style={{
              padding: '12px 32px',
              background: 'transparent',
              border: '1px solid #00FFAA',
              borderRadius: 8,
              color: '#00FFAA',
              fontFamily: "'Courier New', monospace",
              fontSize: 14,
              cursor: 'pointer',
              letterSpacing: 3,
            }}
          >
            [ 重新生成迷宫 ]
          </button>
        </div>
      )}
    </div>
  );
}

function Instructions() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        padding: '12px 16px',
        borderRadius: 10,
        background: 'rgba(10, 17, 40, 0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid rgba(0, 255, 170, 0.15)',
        color: '#88AAAA',
        fontFamily: "'Courier New', monospace",
        fontSize: 11,
        zIndex: 90,
        lineHeight: 1.8,
      }}
    >
      <div style={{ color: '#00FFAA', marginBottom: 4, letterSpacing: 1 }}>操作指南</div>
      <div>WASD - 移动</div>
      <div>鼠标 - 视角</div>
      <div>点击画面锁定鼠标</div>
    </div>
  );
}

export default function NarrativeUI() {
  const activeEnding = useMazeStore(s => s.activeEnding);
  return (
    <>
      <HUD />
      <DialogPanel />
      {!activeEnding && <Instructions />}
      {activeEnding && <EndingScene ending={activeEnding} />}
    </>
  );
}
