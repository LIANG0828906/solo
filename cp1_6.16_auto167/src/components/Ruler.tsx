import { useLayoutStore } from '@/store/layoutStore';
import { RULER_COLOR, TEXT_PRIMARY } from '@/types';

const RULER_SIZE = 24;
const MAJOR_TICK = 50;
const MINOR_TICK = 10;

export default function Ruler() {
  const { canvas } = useLayoutStore();

  const buildTicks = (length: number, offset: number, zoom: number) => {
    const ticks: { pos: number; label?: string; major: boolean }[] = [];
    const step = MINOR_TICK * zoom;
    const start = -offset % step;
    for (let p = start; p <= length + step; p += step) {
      const worldPos = Math.round((p + offset) / zoom);
      const isMajor = worldPos % MAJOR_TICK === 0;
      ticks.push({
        pos: p,
        label: isMajor ? `${worldPos}` : undefined,
        major: isMajor,
      });
    }
    return ticks;
  };

  return (
    <>
      {/* 顶部标尺 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: RULER_SIZE,
          right: 0,
          height: RULER_SIZE,
          background: 'var(--bg-bar)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          zIndex: 20,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          {buildTicks(5000, canvas.offsetX, canvas.zoom).map((t, i) => (
            <div
              key={`ht-${i}`}
              style={{
                position: 'absolute',
                left: t.pos,
                bottom: 0,
                width: 1,
                height: t.major ? 10 : 5,
                background: t.major ? RULER_COLOR : '#3a3a58',
              }}
            />
          ))}
          {buildTicks(5000, canvas.offsetX, canvas.zoom)
            .filter((t) => t.label)
            .map((t, i) => (
              <span
                key={`hl-${i}`}
                style={{
                  position: 'absolute',
                  left: t.pos + 3,
                  top: 2,
                  fontSize: 9,
                  color: '#888',
                  fontFamily: 'monospace',
                  pointerEvents: 'none',
                }}
              >
                {t.label}
              </span>
            ))}
        </div>
      </div>

      {/* 左侧标尺 */}
      <div
        style={{
          position: 'absolute',
          top: RULER_SIZE,
          left: 0,
          bottom: 0,
          width: RULER_SIZE,
          background: 'var(--bg-bar)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          zIndex: 20,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          {buildTicks(5000, canvas.offsetY, canvas.zoom).map((t, i) => (
            <div
              key={`vt-${i}`}
              style={{
                position: 'absolute',
                top: t.pos,
                right: 0,
                height: 1,
                width: t.major ? 10 : 5,
                background: t.major ? RULER_COLOR : '#3a3a58',
              }}
            />
          ))}
          {buildTicks(5000, canvas.offsetY, canvas.zoom)
            .filter((t) => t.label)
            .map((t, i) => (
              <span
                key={`vl-${i}`}
                style={{
                  position: 'absolute',
                  top: t.pos + 3,
                  left: 1,
                  fontSize: 9,
                  color: '#888',
                  fontFamily: 'monospace',
                  pointerEvents: 'none',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                {t.label}
              </span>
            ))}
        </div>
      </div>

      {/* 交叉角 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: RULER_SIZE,
          height: RULER_SIZE,
          background: 'var(--bg-bar)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          zIndex: 21,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: TEXT_PRIMARY,
        }}
      >
        px
      </div>
    </>
  );
}
