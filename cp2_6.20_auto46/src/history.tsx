import { useState, useRef, useCallback, useEffect } from 'react';
import { useLabStore } from './store';
import type { ReactionRecord } from './types';
import { rgbaToString } from './types';

interface AnimationState {
  active: boolean;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

function WindingLightOverlay({ anim, onDone }: { anim: AnimationState; onDone: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!anim.active) return;
    const timer = setTimeout(onDone, 650);
    return () => clearTimeout(timer);
  }, [anim.active, onDone]);

  if (!anim.active) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const sx = anim.startX;
  const sy = anim.startY;
  const tx = anim.targetX;
  const ty = anim.targetY;

  const dx = tx - sx;
  const dy = ty - sy;
  const cx1 = sx + dx * 0.25;
  const cy1 = sy + dy * 0.1 - 80;
  const cx2 = sx + dx * 0.5;
  const cy2 = sy + dy * 0.5 + 60;
  const cx3 = sx + dx * 0.75;
  const cy3 = sy + dy * 0.7 - 40;

  const pathD = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: vw,
        height: vh,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <defs>
        <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path id="winding-path" d={pathD} fill="none" stroke="none" />
      <circle r="8" fill="#5bf" filter="url(#glow-filter)" opacity="0.95">
        <animateMotion dur="0.6s" repeatCount="1" fill="freeze">
          <mpath href="#winding-path" />
        </animateMotion>
      </circle>
      <circle r="4" fill="#fff" opacity="0.8">
        <animateMotion dur="0.6s" repeatCount="1" fill="freeze">
          <mpath href="#winding-path" />
        </animateMotion>
      </circle>
    </svg>
  );
}

export default function HistoryPanel() {
  const history = useLabStore((s) => s.history);
  const loadHistoryRecord = useLabStore((s) => s.loadHistoryRecord);
  const [anim, setAnim] = useState<AnimationState>({
    active: false,
    startX: 0,
    startY: 0,
    targetX: 0,
    targetY: 0,
  });
  const pendingRecord = useRef<ReactionRecord | null>(null);

  const handleRecordClick = useCallback(
    (record: ReactionRecord, e: React.MouseEvent<HTMLDivElement>) => {
      const cardRect = e.currentTarget.getBoundingClientRect();
      const labCanvas = document.getElementById('lab-canvas');
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      if (labCanvas) {
        const canvasRect = labCanvas.getBoundingClientRect();
        targetX = canvasRect.left + canvasRect.width / 2;
        targetY = canvasRect.top + canvasRect.height / 2;
      }

      pendingRecord.current = record;
      setAnim({
        active: true,
        startX: cardRect.left + cardRect.width / 2,
        startY: cardRect.top + cardRect.height / 2,
        targetX,
        targetY,
      });
    },
    []
  );

  const handleAnimDone = useCallback(() => {
    setAnim((prev) => ({ ...prev, active: false }));
    if (pendingRecord.current) {
      loadHistoryRecord(pendingRecord.current);
      pendingRecord.current = null;
    }
  }, [loadHistoryRecord]);

  if (history.length === 0) {
    return (
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          color: '#999',
          fontSize: 14,
          gap: 8,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M18 4C14 4 10 7 10 12C10 16 12 18 12 20L12 22L24 22L24 20C24 18 26 16 26 12C26 7 22 4 18 4Z"
            stroke="#bbb"
            strokeWidth="1.5"
            fill="none"
          />
          <line x1="12" y1="26" x2="24" y2="26" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="13" y1="29" x2="23" y2="29" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="18" cy="11" r="2" fill="#ddd" />
        </svg>
        <span>暂无实验记录</span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: '16px 12px 16px 24px',
        position: 'relative',
        maxHeight: '100%',
        overflowY: 'auto',
      }}
    >
      <WindingLightOverlay anim={anim} onDone={handleAnimDone} />
      <div
        style={{
          position: 'absolute',
          left: 14,
          top: 16,
          bottom: 16,
          width: 2,
          borderLeft: '2px dashed #ccc',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {history.map((record) => (
          <HistoryRecordCard key={record.id} record={record} onClick={handleRecordClick} />
        ))}
      </div>
    </div>
  );
}

function HistoryRecordCard({
  record,
  onClick,
}: {
  record: ReactionRecord;
  onClick: (record: ReactionRecord, e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const colorStr = rgbaToString(record.resultColor);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
      <div
        style={{
          position: 'absolute',
          left: -18,
          top: 10,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#3a6ea5',
          zIndex: 1,
        }}
      />
      <div
        onClick={(e) => onClick(record, e)}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 6,
          background: '#f8f9fb',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s, transform 0.2s',
          border: '1px solid #eef0f3',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
          {record.phenomenaEmoji.join(' ')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: '#999',
              marginBottom: 2,
            }}
          >
            {record.timestamp}
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#1e2a38',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {record.description}
          </div>
        </div>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: colorStr,
            flexShrink: 0,
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        />
      </div>
    </div>
  );
}
