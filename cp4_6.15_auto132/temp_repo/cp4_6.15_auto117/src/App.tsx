import { useEffect, useRef, useState, useCallback } from 'react';
import { SceneSetup } from '@/renderer/SceneSetup';
import { DNAHelix } from '@/renderer/DNAHelix';
import { MutationVisualizer } from '@/renderer/MutationVisualizer';
import ControlPanel from '@/components/ControlPanel';
import Toolbar from '@/components/Toolbar';
import HistoryPanel from '@/components/HistoryPanel';
import { useSequenceStore } from '@/store/sequenceStore';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { rawSequence, isTransitioning, setTransitioning } = useSequenceStore();

  const [transitionState, setTransitionState] = useState<'idle' | 'dissolve' | 'form'>('idle');
  const [dissolveProgress, setDissolveProgress] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const prevSequenceRef = useRef<string>(rawSequence);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (prevSequenceRef.current === rawSequence) return;

    setTransitioning(true);
    setTransitionState('dissolve');
    setDissolveProgress(0);

    const startTime = Date.now();
    const dissolveDuration = 1000;

    const dissolveAnim = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / dissolveDuration);
      const ease = t * t;
      setDissolveProgress(ease);

      if (t < 1) {
        requestAnimationFrame(dissolveAnim);
      } else {
        prevSequenceRef.current = rawSequence;
        setTransitionState('form');
        setFormProgress(0);

        const formStartTime = Date.now();
        const formDuration = 1000;

        const formAnim = () => {
          const formElapsed = Date.now() - formStartTime;
          const ft = Math.min(1, formElapsed / formDuration);
          const formEase = 1 - Math.pow(1 - ft, 3);
          setFormProgress(formEase);

          if (ft < 1) {
            requestAnimationFrame(formAnim);
          } else {
            setTransitionState('idle');
            setTransitioning(false);
          }
        };
        formAnim();
      }
    };
    dissolveAnim();
  }, [rawSequence, setTransitioning]);

  const loadingParticles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 5 + 2,
    delay: Math.random() * 2,
    duration: Math.random() * 2 + 1.5,
  }));

  const dnaOpacity = transitionState === 'dissolve'
    ? 1 - dissolveProgress
    : transitionState === 'form'
      ? formProgress
      : 1;

  const dnaScale = transitionState === 'dissolve'
    ? 1 - dissolveProgress * 0.2
    : transitionState === 'form'
      ? 0.8 + formProgress * 0.2
      : 1;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0a0a1a',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {loading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#0a0a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 0.6s ease-out',
            pointerEvents: fadeOut ? 'none' : 'auto',
          }}
        >
          {loadingParticles.map((particle) => (
            <div
              key={particle.id}
              style={{
                position: 'absolute',
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                background: `radial-gradient(circle, rgba(102, 200, 255, 0.8) 0%, transparent 70%)`,
                borderRadius: '50%',
                animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
              }}
            />
          ))}
          <div
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#e0e0ff',
              letterSpacing: '6px',
              animation: 'pulse 2s ease-in-out infinite',
              textShadow: '0 0 30px rgba(100, 200, 255, 0.5)',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          >
            DNA SEQUENCE EXPLORER
          </div>
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: '100%',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.5s ease-in',
          transform: `scale(${dnaScale})`,
          transitionProperty: 'opacity, transform',
          transitionDuration: '0.3s',
        }}
      >
        <SceneSetup>
          <group
            style={{
              opacity: dnaOpacity,
            }}
          >
            <DNAHelix />
            <MutationVisualizer />
          </group>
        </SceneSetup>
      </div>

      {transitionState !== 'idle' && (
        <TransitionParticles
          state={transitionState}
          progress={transitionState === 'dissolve' ? dissolveProgress : formProgress}
        />
      )}

      <Toolbar canvasRef={canvasRef} />
      <ControlPanel />
      <HistoryPanel />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes particleExplode {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @keyframes particleImplode {
          0% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function TransitionParticles({
  state,
  progress,
}: {
  state: 'dissolve' | 'form';
  progress: number;
}) {
  const particles = useMemoParticles();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
        perspective: '1000px',
      }}
    >
      {particles.map((p, i) => {
        const eased = state === 'dissolve' ? progress * progress : 1 - Math.pow(1 - progress, 3);
        const opacity = state === 'dissolve' ? 1 - eased : eased;
        const scale = state === 'dissolve' ? 1 - eased * 0.5 : 0.5 + eased * 0.5;
        const tx = state === 'dissolve' ? p.tx * eased : p.tx * (1 - eased);
        const ty = state === 'dissolve' ? p.ty * eased : p.ty * (1 - eased);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
              borderRadius: '50%',
              transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale})`,
              opacity,
              transition: 'transform 0.05s linear, opacity 0.05s linear',
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        );
      })}
    </div>
  );
}

function useMemoParticles() {
  const particles = useRef<
    { tx: number; ty: number; size: number; color: string }[]
  >([]);

  if (particles.current.length === 0) {
    const colors = ['#00d4ff', '#00ffaa', '#ff6b6b', '#ffd93d', '#667eea'];
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 300;
      particles.current.push({
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance + (Math.random() - 0.5) * 200,
        size: 4 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  return particles.current;
}
