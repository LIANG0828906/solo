import { useCallback, useEffect, useRef, useState } from 'react';
import { SlideData } from '@/utils/api';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface SlideShowProps {
  slides: SlideData[];
  onExit: () => void;
}

const PAGE_DURATION = 8;

export default function SlideShow({ slides, onExit }: SlideShowProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageKey, setPageKey] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [countdown, setCountdown] = useState(PAGE_DURATION);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'idle' | 'exit'>('enter');
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (nextIndex: number, dir: 'next' | 'prev' = 'next') => {
      if (nextIndex < 0 || nextIndex >= slides.length) return;
      setAnimationPhase('exit');
      setDirection(dir);
      const t = setTimeout(() => {
        setCurrentPage(nextIndex);
        setPageKey(k => k + 1);
        setCountdown(PAGE_DURATION);
        setAnimationPhase('enter');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setAnimationPhase('idle'));
        });
      }, 750);
      return () => clearTimeout(t);
    },
    [slides.length],
  );

  const next = useCallback(() => {
    if (currentPage === slides.length - 1) {
      goTo(0, 'next');
    } else {
      goTo(currentPage + 1, 'next');
    }
  }, [currentPage, slides.length, goTo]);

  const prev = useCallback(() => {
    if (currentPage === 0) {
      goTo(slides.length - 1, 'prev');
    } else {
      goTo(currentPage - 1, 'prev');
    }
  }, [currentPage, slides.length, goTo]);

  useEffect(() => {
    const start = performance.now();
    const startTime = start;
    const tick = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const remaining = Math.max(0, PAGE_DURATION - (elapsed % PAGE_DURATION));
      setCountdown(Math.ceil(remaining));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    intervalRef.current = setInterval(next, PAGE_DURATION * 1000);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [next, pageKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onExit]);

  const slide = slides[currentPage];
  if (!slide) return null;

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${slide.gradientStart} 0%, ${slide.gradientEnd} 100%)`,
        transition: 'background 0.8s ease-in-out',
      }}
    >
      <div
        key={`${pageKey}-${currentPage}`}
        className="w-full h-full relative"
        style={{
          perspective: '1500px',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            transformOrigin: direction === 'next' ? 'left center' : 'right center',
            animation:
              animationPhase === 'exit'
                ? direction === 'next'
                  ? 'spin-fade-out 0.8s ease-in-out forwards'
                  : 'spin-fade-out 0.8s ease-in-out forwards'
                : animationPhase === 'enter'
                ? 'slide-in-left 0.8s ease-in-out both'
                : 'none',
          }}
        >
          <div
            key={`city-${pageKey}`}
            className="animate-slide-up text-center"
            style={{
              color: '#FFFFFF',
              fontSize: 72,
              fontWeight: 300,
              letterSpacing: '0.05em',
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            {slide.city}
          </div>

          <div className="mt-16 flex flex-col items-center w-full max-w-xl px-6">
            {slide.highlights.map((h, i) => (
              <div
                key={`${pageKey}-${i}`}
                className="w-full text-center animate-slide-up"
                style={{
                  animationDelay: `${0.5 + i * 0.3}s`,
                  opacity: 0,
                }}
              >
                {i > 0 && (
                  <div
                    className="mx-auto my-6"
                    style={{
                      width: 120,
                      height: 1,
                      background: 'rgba(255,255,255,0.35)',
                    }}
                  />
                )}
                <div
                  className="leading-relaxed"
                  style={{
                    color: '#FFFFFF',
                    fontSize: 18,
                    letterSpacing: '0.03em',
                    textShadow: '0 2px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  {h}
                </div>
              </div>
            ))}
          </div>

          <div
            className="absolute bottom-8 right-10"
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 20,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {countdown}
          </div>

          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {slides.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === currentPage ? 24 : 8,
                  height: 8,
                  background: i === currentPage ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-white"
        style={{
          width: 80,
          height: 80,
          opacity: 0.3,
          transition: 'opacity 0.25s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
      >
        <ChevronLeft size={44} strokeWidth={1.5} />
      </button>

      <button
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-white"
        style={{
          width: 80,
          height: 80,
          opacity: 0.3,
          transition: 'opacity 0.25s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
      >
        <ChevronRight size={44} strokeWidth={1.5} />
      </button>

      <button
        onClick={onExit}
        className="absolute top-6 right-6 flex items-center gap-2 text-white px-4"
        style={{
          height: 40,
          borderRadius: 20,
          background: 'rgba(0,0,0,0.2)',
          transition: 'background 0.25s ease',
          fontSize: 14,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.35)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.2)')}
      >
        <X size={16} />
        退出
      </button>
    </div>
  );
}
