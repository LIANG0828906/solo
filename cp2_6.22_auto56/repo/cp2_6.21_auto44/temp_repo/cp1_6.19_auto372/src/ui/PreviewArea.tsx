import { useEffect, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, useSpring, useTransform } from 'framer-motion';
import { useGradientStore } from '@/store/gradientStore';
import { createThrottledUpdater } from '@/gradient/scrollMapper';
import { generateGradientCSS, computeBlendedColors, interpolateNode } from '@/gradient/gradientEngine';
import { mapScrollToNodes } from '@/gradient/scrollMapper';

const REGION_COUNT = 4;
const REGION_HEIGHT = 500;
const TOTAL_HEIGHT = REGION_COUNT * REGION_HEIGHT;

export function PreviewArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodes = useGradientStore((s) => s.nodes);
  const direction = useGradientStore((s) => s.direction);
  const currentCSS = useGradientStore((s) => s.currentCSS);
  const activeRegion = useGradientStore((s) => s.activeRegion);
  const setScrollProgress = useGradientStore((s) => s.setScrollProgress);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  useEffect(() => {
    const updater = createThrottledUpdater(
      (v) => setScrollProgress(v),
      30,
      20,
    );
    const unsubscribe = scrollYProgress.on('change', (v) => {
      updater.update(v);
    });
    return () => {
      unsubscribe();
      updater.destroy();
    };
  }, [scrollYProgress, setScrollProgress]);

  const indicatorY = useTransform(smoothProgress, [0, 1], [0, TOTAL_HEIGHT - 48]);

  const regionGradients = nodes
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((node) => {
      const blended = computeBlendedColors(node);
      return generateGradientCSS(blended.startColor, blended.endColor, direction);
    });

  const regionLabels: { label: string; hint: string }[] = [
    { label: '区域 1 · 开篇', hint: 'Hero / Intro' },
    { label: '区域 2 · 叙事', hint: 'Story / Features' },
    { label: '区域 3 · 展示', hint: 'Showcase / Gallery' },
    { label: '区域 4 · 收尾', hint: 'Outro / Contact' },
  ];

  const ensureCount = Math.min(REGION_COUNT, Math.max(regionGradients.length, 1));

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: TOTAL_HEIGHT,
        overflow: 'hidden',
        touchAction: 'manipulation',
        overscrollBehavior: 'contain',
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: currentCSS,
          zIndex: 0,
          transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'background',
        }}
      />

      <motion.div
        style={{
          position: 'fixed',
          left: 20,
          top: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.9)',
          background: currentCSS,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.25)',
          zIndex: 30,
          pointerEvents: 'none',
          y: indicatorY,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 6,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {activeRegion + 1}
        </div>
      </motion.div>

      {Array.from({ length: REGION_COUNT }).map((_, idx) => {
        const css = regionGradients[idx % ensureCount];
        const { label, hint } = regionLabels[idx];
        const blended = getRegionColors(idx, nodes, direction);
        return (
          <section
            key={idx}
            style={{
              position: 'relative',
              height: REGION_HEIGHT,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom:
                idx < REGION_COUNT - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: css,
                opacity: 0.001,
                pointerEvents: 'none',
              }}
              aria-hidden
            />
            <div
              style={{
                textAlign: 'center',
                color: '#fff',
                zIndex: 5,
                padding: '0 32px',
                maxWidth: 640,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: 0.85,
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                  marginBottom: 14,
                  textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 20,
                  letterSpacing: 1,
                  textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                }}
              >
                {hint}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <ColorChip color={blended.startColor} />
                <Arrow />
                <ColorChip color={blended.endColor} />
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                left: 20,
                top: 20,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                color: 'rgba(255,255,255,0.7)',
                textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                zIndex: 4,
              }}
            >
              0{idx + 1} / 0{REGION_COUNT}
            </div>
          </section>
        );
      })}

      <ScrollHint />
    </div>
  );
}

function getRegionColors(
  idx: number,
  nodes: ReturnType<typeof useGradientStore.getState>['nodes'],
  direction: ReturnType<typeof useGradientStore.getState>['direction'],
): { startColor: string; endColor: string; css: string } {
  const sorted = [...nodes].sort((a, b) => a.position - b.position);
  const progress = (idx + 0.5) / REGION_COUNT;
  try {
    const { nodeA, nodeB, localT } = mapScrollToNodes(progress, sorted);
    const blendedA = computeBlendedColors(nodeA);
    const blendedB = computeBlendedColors(nodeB);
    const interpolated = interpolateNode(
      { ...nodeA, startColor: blendedA.startColor, endColor: blendedA.endColor },
      { ...nodeB, startColor: blendedB.startColor, endColor: blendedB.endColor },
      localT,
    );
    return {
      startColor: interpolated.startColor,
      endColor: interpolated.endColor,
      css: generateGradientCSS(interpolated.startColor, interpolated.endColor, direction),
    };
  } catch {
    return { startColor: '#000', endColor: '#000', css: '#000' };
  }
}

function ColorChip({ color }: { color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: color,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.2)',
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          color: '#fff',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }}
      >
        {color.toUpperCase()}
      </span>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
      <path
        d="M1 5h14m0 0L11 1m4 4L11 9"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScrollHint() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      style={{
        position: 'fixed',
        bottom: 110,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        zIndex: 25,
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 3,
          color: 'rgba(255,255,255,0.75)',
          textTransform: 'uppercase',
        }}
      >
        Scroll
      </span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)' }}
      />
    </motion.div>
  );
}
