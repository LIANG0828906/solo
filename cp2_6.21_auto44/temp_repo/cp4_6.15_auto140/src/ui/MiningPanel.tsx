import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { artifactManager, ArtifactPiece, ArtifactDefinition, ARTIFACT_DEFINITIONS, AssembleResult } from '../artifact/artifactManager';

interface MiningPanelProps {
  onWorkbenchChange?: () => void;
}

const rarityColors: Record<string, { bg: string; border: string; label: string }> = {
  common:    { bg: 'rgba(160,160,160,0.15)', border: '#a8a8a8', label: '普通' },
  rare:      { bg: 'rgba(120,170,230,0.18)', border: '#6aa8e0', label: '稀有' },
  legendary: { bg: 'rgba(230,190,90,0.22)', border: '#e8be5a', label: '传说' }
};

const lerpHex = (a: string, b: string, t: number) => {
  const h2r = (h: string) => {
    const x = h.replace('#', '');
    return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
  };
  const [ar, ag, ab] = h2r(a); const [br, bg, bb] = h2r(b);
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
};

function ArtifactPieceView({
  piece, def, dragging, onDragStart, onDragEnd, restored, showBg = true, small = false
}: {
  piece: ArtifactPiece; def: ArtifactDefinition;
  dragging: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  onDragEnd?: (e: React.PointerEvent) => void;
  restored: boolean;
  showBg?: boolean; small?: boolean;
}) {
  const prog = restored ? artifactManager.getRestoreProgress(def.id) : 0;
  const col = restored ? lerpHex(def.baseColor, def.restoredColor, Math.min(1, prog)) : def.baseColor;
  const sz = small ? 48 : 64;

  const renderShape = () => {
    switch (def.shape) {
      case 'pot':
        return <svg viewBox="0 0 64 64" width={sz} height={sz}>
          <path d="M18 14 L46 14 L50 24 Q52 44 42 56 Q32 60 22 56 Q12 44 14 24 Z" fill={col} stroke={def.accentColor} strokeWidth="1.5" opacity={0.95} />
          <ellipse cx="32" cy="14" rx="14" ry="3.5" fill={col} stroke={def.accentColor} strokeWidth="1.2" />
        </svg>;
      case 'arrow':
        return <svg viewBox="0 0 64 64" width={sz} height={sz}>
          <polygon points="48,32 20,14 26,28 6,32 26,36 20,50" fill={col} stroke={def.accentColor} strokeWidth="1.5" />
        </svg>;
      case 'disc':
        return <svg viewBox="0 0 64 64" width={sz} height={sz}>
          <circle cx="32" cy="32" r="24" fill="none" stroke={col} strokeWidth="11" />
          <circle cx="32" cy="32" r="18" fill="none" stroke={def.accentColor} strokeWidth="1.2" opacity={0.7} />
        </svg>;
      case 'trilobite':
        return <svg viewBox="0 0 64 64" width={sz} height={sz}>
          <ellipse cx="32" cy="34" rx="24" ry="18" fill={col} stroke={def.accentColor} strokeWidth="1.4" />
          <line x1="32" y1="16" x2="32" y2="52" stroke={def.accentColor} strokeWidth="1.8" />
          <line x1="18" y1="26" x2="46" y2="26" stroke={def.accentColor} strokeWidth="0.9" opacity={0.7} />
          <line x1="18" y1="42" x2="46" y2="42" stroke={def.accentColor} strokeWidth="0.9" opacity={0.7} />
        </svg>;
      case 'ding':
        return <svg viewBox="0 0 64 64" width={sz} height={sz}>
          <path d="M14 20 L50 20 L48 48 Q32 54 16 48 Z" fill={col} stroke={def.accentColor} strokeWidth="1.5" />
          <path d="M12 22 Q4 20 8 10" fill="none" stroke={def.accentColor} strokeWidth="2.4" />
          <path d="M52 22 Q60 20 56 10" fill="none" stroke={def.accentColor} strokeWidth="2.4" />
        </svg>;
      case 'axe':
        return <svg viewBox="0 0 64 64" width={sz} height={sz}>
          <rect x="6" y="22" width="52" height="20" rx="3" fill={col} stroke={def.accentColor} strokeWidth="1.5" />
          <line x1="24" y1="12" x2="40" y2="12" stroke={def.accentColor} strokeWidth="3" strokeLinecap="round" />
        </svg>;
      case 'shell':
        return <svg viewBox="0 0 64 64" width={sz} height={sz}>
          <path d="M32 12 Q10 20 12 44 Q18 58 32 58 Q46 58 52 44 Q54 20 32 12 Z" fill={col} stroke={def.accentColor} strokeWidth="1.4" />
          <path d="M32 14 L32 56" stroke={def.accentColor} strokeWidth="0.9" opacity={0.7} />
          <path d="M32 14 Q22 30 20 50" stroke={def.accentColor} strokeWidth="0.8" opacity={0.6} fill="none" />
          <path d="M32 14 Q42 30 44 50" stroke={def.accentColor} strokeWidth="0.8" opacity={0.6} fill="none" />
        </svg>;
      case 'pendant':
        return <svg viewBox="0 0 64 64" width={sz} height={sz}>
          <path d="M32 12 Q52 22 46 40 Q40 56 32 52 Q24 56 18 40 Q12 22 32 12 Z" fill={col} stroke={def.accentColor} strokeWidth="1.5" />
          <circle cx="32" cy="22" r="3" fill={def.accentColor} opacity={0.7} />
        </svg>;
      default:
        return <div style={{ width: sz, height: sz, background: col, borderRadius: 6 }} />;
    }
  };

  return (
    <div
      onPointerDown={onDragStart}
      onPointerUp={onDragEnd}
      onPointerLeave={onDragEnd}
      style={{
        width: sz + 12, height: sz + 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 9,
        background: showBg ? 'rgba(30,18,8,0.6)' : 'transparent',
        border: `1px solid ${piece.placed ? def.accentColor : 'rgba(201,168,106,0.4)'}`,
        boxShadow: dragging
          ? `0 14px 30px rgba(0,0,0,0.7), 0 0 22px ${def.glowColor}80`
          : `inset 0 0 14px ${def.accentColor}18`,
        cursor: onDragStart ? (dragging ? 'grabbing' : 'grab') : 'default',
        transform: dragging ? 'scale(1.32) rotate(4deg)' : 'scale(1)',
        transition: dragging ? 'none' : 'transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s',
        touchAction: 'none', userSelect: 'none',
        position: 'relative', zIndex: dragging ? 9999 : 1
      }}
      title={`${def.name} · 碎片 ${piece.pieceIndex + 1}/${piece.totalPieces}`}
    >
      {renderShape()}
      <div style={{
        position: 'absolute', bottom: 2, right: 4, fontSize: 9,
        color: piece.placed ? def.accentColor : '#a8916a',
        fontFamily: 'monospace', opacity: 0.8
      }}>
        {piece.pieceIndex + 1}/{piece.totalPieces}
      </div>
      {piece.placed && <div style={{ position: 'absolute', top: 3, left: 3, fontSize: 10, color: '#9ee09e' }}>✓</div>}
    </div>
  );
}

function Workbench({
  activeDef, onDropPiece, draggingPieceId, sounds
}: {
  activeDef: ArtifactDefinition | null;
  onDropPiece: (pieceId: string, x: number, y: number) => AssembleResult;
  draggingPieceId: string | null;
  sounds: string[];
}) {
  const benchRef = useRef<HTMLDivElement>(null);
  const [celebrate, setCelebrate] = useState<{ color: string; t0: number; id: number } | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!activeDef) return;
    const id = setInterval(() => tick(t => t + 1), 80);
    return () => clearInterval(id);
  }, [activeDef]);

  useEffect(() => {
    if (!activeDef) return;
    if (artifactManager.isArtifactRestored(activeDef.id)) {
      const lastId = celebrate?.id ?? 0;
      if (!(celebrate && performance.now() - celebrate.t0 < 3200)) {
        setCelebrate({ color: activeDef.glowColor, t0: performance.now(), id: lastId + 1 });
        const t = setTimeout(() => setCelebrate(null), 3200);
        return () => clearTimeout(t);
      }
    }
  }, [activeDef, artifactManager.getWorkbenchPieces().length]);

  const params = artifactManager.getWorkbenchParams();
  const allPieces = activeDef ? artifactManager.getPiecesByArtifact(activeDef.id) : [];

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingPieceId || !benchRef.current) return;
    const rect = benchRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    onDropPiece(draggingPieceId, e.clientX - cx, e.clientY - cy);
  };

  const restored = activeDef ? artifactManager.isArtifactRestored(activeDef.id) : false;
  const restoreT = activeDef && restored ? Math.min(1, artifactManager.getRestoreProgress(activeDef.id)) : 0;
  const placedCount = allPieces.filter(p => p.placed).length;

  return (
    <div ref={benchRef} onPointerUp={handlePointerUp} style={{
      position: 'relative', width: 340, height: 340, margin: '0 auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, rgba(210,175,120,0.85) 0%, rgba(185,145,92,0.9) 35%, rgba(130,92,55,0.95) 75%, rgba(90,60,32,0.98) 100%)',
        border: '4px solid #8b6914',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6), inset 0 4px 14px rgba(255,220,160,0.25), inset 0 -8px 20px rgba(40,20,5,0.6), 0 0 0 2px rgba(201,168,106,0.35)'
      }}>
        <div style={{
          position: 'absolute', inset: 16, borderRadius: '50%',
          background: 'repeating-radial-gradient(circle at 50% 50%, rgba(90,55,25,0.35) 0px, rgba(90,55,25,0.35) 2px, rgba(60,35,15,0.35) 4px, rgba(60,35,15,0.35) 6px)',
          opacity: 0.55
        }} />
      </div>

      {celebrate && (
        <div style={{
          position: 'absolute', inset: -30, borderRadius: '50%',
          background: `radial-gradient(circle, ${celebrate.color}66 0%, transparent 70%)`,
          pointerEvents: 'none'
        }}>
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * Math.PI * 2;
            const r = 110 + (i % 3) * 20;
            const age = Math.min(1, (performance.now() - celebrate.t0) / 2500);
            return <div key={`${celebrate.id}-${i}`} style={{
              position: 'absolute',
              left: `calc(50% + ${Math.cos(angle) * r * (0.4 + age * 0.8)}px)`,
              top: `calc(50% + ${Math.sin(angle) * r * (0.4 + age * 0.8)}px)`,
              width: 8 + (i % 4) * 2, height: 8 + (i % 4) * 2,
              borderRadius: '50%', background: celebrate.color,
              boxShadow: `0 0 8px ${celebrate.color}`,
              transform: `translate(-50%, -50%) scale(${Math.max(0, 1 - age)})`,
              opacity: Math.max(0, 1 - age)
            }} />;
          })}
        </div>
      )}

      {!activeDef ? (
        <div style={{ position: 'relative', textAlign: 'center', color: 'rgba(230,200,150,0.55)', fontSize: 13, lineHeight: 1.7, padding: '0 30px', pointerEvents: 'none' }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.7 }}>🏺</div>
          <div>拼接工作台</div>
          <div style={{ fontSize: 11, marginTop: 6, opacity: 0.7 }}>从收藏架拖拽文物碎片<br/>到此处开始拼合</div>
        </div>
      ) : (
        <>
          {allPieces.map(piece => {
            const correct = artifactManager.getCorrectScreenPosition(piece);
            const isCollected = piece.collected;
            const isPlaced = piece.placed;
            const isDraggingNow = draggingPieceId === piece.id;
            const shownX = isPlaced ? correct.x : piece.workbenchOffset?.x ?? null;
            const shownY = isPlaced ? correct.y : piece.workbenchOffset?.y ?? null;
            return (
              <div key={piece.id} style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: (shownX !== null && shownY !== null)
                  ? `translate(calc(-50% + ${shownX}px), calc(-50% + ${shownY}px))`
                  : 'translate(-50%, -50%)',
                opacity: (isCollected && !isPlaced && !isDraggingNow) ? 0 : (isCollected ? 1 : 0.18),
                transition: isDraggingNow ? 'none' : 'transform 0.28s cubic-bezier(.34,1.56,.64,1), opacity 0.2s',
                filter: isPlaced ? `drop-shadow(0 0 10px ${activeDef.glowColor}88)` : 'none',
                pointerEvents: isDraggingNow ? 'none' : 'auto'
              }}>
                {(!isCollected || (!isPlaced && !isDraggingNow)) && <div style={{
                  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                  width: 54, height: 54, borderRadius: 9,
                  border: `1px dashed rgba(201,168,106,${isCollected ? 0.15 : 0.4})`,
                  background: isCollected ? 'transparent' : 'rgba(0,0,0,0.12)', pointerEvents: 'none'
                }} />}
                <ArtifactPieceView piece={piece} def={activeDef} dragging={false} restored={restored && restoreT > 0} showBg={false} />
              </div>
            );
          })}

          <div style={{
            position: 'absolute', bottom: -26, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(20,12,6,0.7)', border: '1px solid rgba(201,168,106,0.45)',
            borderRadius: 6, padding: '4px 12px', color: '#e8c88a', fontSize: 11.5, whiteSpace: 'nowrap'
          }}>
            {placedCount} / {activeDef.pieceCount} 已拼合
            {restored && restoreT >= 1 && ' ✅ 已复原'}
          </div>
        </>
      )}

      {sounds.length > 0 && (
        <div style={{
          position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
          fontSize: 11, color: '#c8e8b0', textShadow: '0 0 6px rgba(150,230,140,0.6)',
          pointerEvents: 'none', whiteSpace: 'nowrap'
        }}>
          {sounds[sounds.length - 1]}
        </div>
      )}
    </div>
  );
}

export function MiningPanel(_props: MiningPanelProps) {
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [dragPieceId, setDragPieceId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [sounds, setSounds] = useState<string[]>([]);
  const dragStart = useRef<{ pieceId: string } | null>(null);

  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    const off1 = artifactManager.addPieceCollectedListener(() => { forceUpdate(); setOpen(true); });
    const off2 = artifactManager.addWorkbenchChangedListener(() => forceUpdate());
    const off3 = artifactManager.addArtifactRestoredListener(() => forceUpdate());
    const off4 = artifactManager.addAssembleAttemptListener((r) => {
      if (r.sound) setSounds(prev => [...prev.slice(-4), r.sound as string]);
    });
    return () => { off1(); off2(); off3(); off4(); };
  }, [forceUpdate]);

  useEffect(() => {
    const id = setInterval(() => setSounds(prev => prev.slice(-1)), 2400);
    return () => clearInterval(id);
  }, []);

  const effectiveActive = activeArtifactId ?? artifactManager.getActiveArtifactId();
  const activeDef = effectiveActive ? artifactManager.getDefinition(effectiveActive) : null;

  const piecesByArtifact = useMemo(() => {
    const collected = artifactManager.getCollectedPieces();
    const m = new Map<string, ArtifactPiece[]>();
    for (const p of collected) {
      if (!m.has(p.artifactId)) m.set(p.artifactId, []);
      m.get(p.artifactId)!.push(p);
    }
    return m;
  }, [effectiveActive, sounds.length]);

  const globalProgress = artifactManager.getProgress();
  const collected = artifactManager.getCollectedPieces();

  const makeDragStart = useCallback((pieceId: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    dragStart.current = { pieceId };
    setDragPieceId(pieceId);
    setDragPos({ x: e.clientX, y: e.clientY });
  }, []);
  const makeDragEnd = useCallback((pieceId: string) => (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    setDragPieceId(null); setDragPos(null); dragStart.current = null;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (dragPieceId) setDragPos({ x: e.clientX, y: e.clientY });
  }, [dragPieceId]);

  const handleDropOnBench = useCallback((pieceId: string, x: number, y: number): AssembleResult => {
    const r = artifactManager.tryPlacePieceOnWorkbench(pieceId, x, y);
    forceUpdate();
    return r;
  }, [forceUpdate]);

  const handleSelectArtifact = (id: string | null) => {
    artifactManager.setActiveArtifact(id);
    setActiveArtifactId(id);
    forceUpdate();
  };

  const benchActive = activeDef ?? (effectiveActive ? artifactManager.getDefinition(effectiveActive) : null);

  return (
    <div onPointerMove={onPointerMove} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 0, zIndex: 50, pointerEvents: 'none' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'absolute', top: '50%', right: open ? '380px' : 0, transform: 'translateY(-50%)',
          width: 24, height: 160,
          background: 'linear-gradient(180deg, #7a5a2d, #4a3516, #7a5a2d)',
          border: '2px solid #b88a44',
          borderRadius: '10px 0 0 10px',
          cursor: 'pointer', pointerEvents: 'auto',
          transition: 'right 0.45s cubic-bezier(.34,1.56,.64,1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#f5e6c8', fontSize: 14,
          writingMode: 'vertical-rl', letterSpacing: 3,
          textShadow: '0 1px 2px rgba(0,0,0,0.7)',
          boxShadow: 'inset 2px 0 8px rgba(0,0,0,0.4), 0 0 20px rgba(201,168,106,0.2)',
          fontWeight: 600
        }}
      >
        {open ? '◀ 收起面板' : '收藏架 ▶ 工作台'}
        {collected.length > 0 && (
          <div style={{
            position: 'absolute', top: -8, right: -8,
            width: 22, height: 22, borderRadius: '50%',
            background: '#d4a24a', color: '#2a1a0d',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #5a3d18', fontFamily: 'sans-serif',
            writingMode: 'horizontal-tb', letterSpacing: 0
          }}>{collected.length}</div>
        )}
      </div>

      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 380,
        transform: `translateX(${open ? '0' : '100%'})`,
        transition: 'transform 0.5s cubic-bezier(.34,1.56,.64,1)',
        pointerEvents: 'auto',
        background: 'linear-gradient(135deg, rgba(42,26,12,0.78), rgba(25,15,6,0.82))',
        backdropFilter: 'blur(14px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
        borderLeft: '3px solid #8b6914',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.6), inset 8px 0 30px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        color: '#f5e6c8', fontFamily: 'Georgia, "Times New Roman", serif'
      }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(201,168,106,0.35)',
          background: 'linear-gradient(180deg, rgba(201,168,106,0.18), transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#e8c88a', letterSpacing: 1 }}>✦ 记忆地层 · 收藏架 ✦</div>
            <div style={{ fontSize: 10.5, color: '#a8916a', marginTop: 3 }}>
              已收集 {globalProgress.collectedPieces}/{globalProgress.totalPieces} 碎片
              {' · '}已复原 {globalProgress.restoredArtifacts}/{globalProgress.totalArtifacts}
              {' · '}{globalProgress.totalPoints} 分
            </div>
          </div>
        </div>

        <div style={{
          padding: '16px 16px 8px 16px', flex: 1, overflowY: 'auto',
          scrollbarWidth: 'thin', scrollbarColor: '#8b6914 transparent'
        }}>
          <div style={{
            marginBottom: 16,
            background: 'rgba(15,8,4,0.4)',
            border: '1px solid rgba(201,168,106,0.25)',
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: 'inset 0 0 18px rgba(0,0,0,0.25)'
          }}>
            <div style={{ fontSize: 12, color: '#c8a878', marginBottom: 8, fontWeight: 600 }}>⚒ 拼接工作台</div>
            <Workbench
              activeDef={benchActive}
              onDropPiece={handleDropOnBench}
              draggingPieceId={dragPieceId}
              sounds={sounds}
            />
            {benchActive && (
              <div style={{
                marginTop: 32, padding: '10px 12px', borderRadius: 7,
                background: rarityColors[benchActive.rarity].bg,
                border: `1px solid ${rarityColors[benchActive.rarity].border}55`
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: benchActive.accentColor }}>
                  {artifactManager.isArtifactRestored(benchActive.id) ? '✨ ' : ''}{benchActive.name}
                  <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 6, color: rarityColors[benchActive.rarity].border }}>
                    [{rarityColors[benchActive.rarity].label}] · {benchActive.points}分
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: '#b89b6e', margin: '3px 0 5px' }}>{benchActive.era}</div>
                <div style={{ fontSize: 11, color: '#d4c4a0', lineHeight: 1.45 }}>{benchActive.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <button onClick={() => handleSelectArtifact(null)} style={{
                    padding: '3px 10px', fontSize: 10.5,
                    background: 'rgba(60,35,15,0.7)',
                    border: '1px solid #8b6914', color: '#e8c88a',
                    borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit'
                  }}>清空工作台</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, color: '#c8a878', marginBottom: 8, fontWeight: 600, paddingLeft: 2 }}>
            📜 文物收藏 ({piecesByArtifact.size} 种)
          </div>

          {piecesByArtifact.size === 0 ? (
            <div style={{
              padding: '24px 14px', textAlign: 'center',
              color: 'rgba(230,200,150,0.45)', fontSize: 12,
              background: 'rgba(15,8,4,0.3)', borderRadius: 8,
              border: '1px dashed rgba(201,168,106,0.2)'
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⛏</div>
              还未收集任何碎片<br />
              在地形上点击/拖拽挖掘地层以发现文物
            </div>
          ) : (
            Array.from(piecesByArtifact.entries()).map(([aid, ps]) => {
              const def = ARTIFACT_DEFINITIONS[aid]; if (!def) return null;
              const allPieces = artifactManager.getPiecesByArtifact(aid);
              const restored = artifactManager.isArtifactRestored(aid);
              const isActive = effectiveActive === aid;
              return (
                <div key={aid} onClick={() => { if (!isActive) handleSelectArtifact(aid); }} style={{
                  marginBottom: 10, padding: '10px 12px',
                  background: isActive ? 'rgba(201,168,106,0.16)' : 'rgba(15,8,4,0.42)',
                  border: `1px solid ${isActive ? def.accentColor : 'rgba(201,168,106,0.25)'}`,
                  borderRadius: 9, cursor: 'pointer',
                  boxShadow: restored ? `0 0 14px ${def.glowColor}55` : 'inset 0 0 12px rgba(0,0,0,0.25)',
                  transition: 'all 0.25s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      flex: '0 0 auto', padding: 4, borderRadius: 8,
                      background: rarityColors[def.rarity].bg,
                      border: `1px solid ${rarityColors[def.rarity].border}66`
                    }}>
                      <ArtifactPieceView
                        piece={allPieces[0]} def={def} dragging={false}
                        restored={restored} showBg={false} small
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: restored ? def.glowColor : '#e8c88a' }}>
                        {restored && '✨ '}{def.name}
                        <span style={{ marginLeft: 5, fontSize: 9.5, color: rarityColors[def.rarity].border }}>
                          [{rarityColors[def.rarity].label}]
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: '#b89b6e', margin: '2px 0 4px' }}>{def.era}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {allPieces.map(p => (
                          <div key={p.id}>
                            {p.collected ? (
                              <ArtifactPieceView
                                piece={p} def={def} dragging={dragPieceId === p.id}
                                onDragStart={makeDragStart(p.id)}
                                onDragEnd={makeDragEnd(p.id)}
                                restored={restored} showBg={!p.placed} small
                              />
                            ) : (
                              <div style={{
                                width: 60, height: 60, borderRadius: 9,
                                border: '1px dashed rgba(201,168,106,0.3)',
                                background: 'rgba(0,0,0,0.18)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'rgba(230,200,150,0.35)', fontSize: 10
                              }}>?</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid rgba(201,168,106,0.3)',
          fontSize: 10, color: '#a8916a', textAlign: 'center',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.3), transparent)'
        }}>
          💡 操作提示：左键在地形上点击/拖拽 = 挖掘 · 右键拖动 = 旋转视角 · 滚轮 = 缩放 · 拖拽碎片到上方工作台拼合
        </div>
      </div>

      {dragPieceId && dragPos && (() => {
        const piece = artifactManager.getPiece(dragPieceId);
        const def = piece ? artifactManager.getDefinition(piece.artifactId) : null;
        if (!piece || !def) return null;
        return (
          <div style={{
            position: 'fixed',
            left: dragPos.x, top: dragPos.y,
            transform: 'translate(-50%, -50%) rotate(5deg) scale(1.25)',
            pointerEvents: 'none', zIndex: 99999,
            filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.65))'
          }}>
            <ArtifactPieceView piece={piece} def={def} dragging={true}
              restored={artifactManager.isArtifactRestored(def.id)} showBg />
          </div>
        );
      })()}
    </div>
  );
}

