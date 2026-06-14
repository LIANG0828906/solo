import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCw, FlipHorizontal2, Star, Save, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useGameStore, calculateIntegrity, calculateStars } from '../stores/gameStore';
import { getArtifactById, getFragmentById } from '../data/artifacts';
import type { FragmentData, PlacedFragment } from '../types';

const DIST_TOL = 20;
const ANGLE_TOL = 10;
const PUZZLE_W = 600;
const PUZZLE_H = 480;

export default function Workbench() {
  const navigate = useNavigate();
  const excavatedFragments = useGameStore((s) => s.excavatedFragments);
  const placedFragments = useGameStore((s) => s.placedFragments);
  const placeFragment = useGameStore((s) => s.placeFragment);
  const updateFragment = useGameStore((s) => s.updateFragment);
  const rotateFragment = useGameStore((s) => s.rotateFragment);
  const flipFragment = useGameStore((s) => s.flipFragment);
  const matchFragment = useGameStore((s) => s.matchFragment);
  const selectedFragmentId = useGameStore((s) => s.selectedFragmentId);
  const setSelectedFragment = useGameStore((s) => s.setSelectedFragment);
  const currentArtifactId = useGameStore((s) => s.currentArtifactId);
  const workbenchProgress = useGameStore((s) => s.workbenchProgress);
  const setWorkbenchProgress = useGameStore((s) => s.setWorkbenchProgress);
  const showRating = useGameStore((s) => s.showRating);
  const setShowRating = useGameStore((s) => s.setShowRating);
  const lastRating = useGameStore((s) => s.lastRating);
  const setLastRating = useGameStore((s) => s.setLastRating);
  const matchFlash = useGameStore((s) => s.matchFlash);
  const setMatchFlash = useGameStore((s) => s.setMatchFlash);
  const endDigTimer = useGameStore((s) => s.endDigTimer);
  const digStartTime = useGameStore((s) => s.digStartTime);
  const currentSite = useGameStore((s) => s.currentSite);
  const currentTool = useGameStore((s) => s.currentTool);
  const addRecord = useGameStore((s) => s.addRecord);
  const resetGame = useGameStore((s) => s.resetGame);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotationAnim, setRotationAnim] = useState<Record<string, number>>({});
  const [flipAnim, setFlipAnim] = useState<Record<string, boolean>>({});
  const [matchAttempts, setMatchAttempts] = useState(0);
  const [matchSuccess, setMatchSuccess] = useState(0);
  const puzzleRef = useRef<HTMLDivElement>(null);
  const [digTime, setDigTime] = useState(0);

  const artifact = useMemo(
    () => (currentArtifactId ? getArtifactById(currentArtifactId) : null),
    [currentArtifactId]
  );

  useEffect(() => {
    if (digStartTime && !showRating) {
      const t = Math.floor((Date.now() - digStartTime) / 1000);
      setDigTime(t);
    }
  }, [digStartTime, showRating]);

  useEffect(() => {
    if (matchFlash) {
      const t = setTimeout(() => setMatchFlash(null), 300);
      return () => clearTimeout(t);
    }
  }, [matchFlash, setMatchFlash]);

  useEffect(() => {
    const placedIds = Object.keys(placedFragments);
    const matchedCount = placedIds.filter((id) => placedFragments[id]?.matched).length;
    const total = artifact?.fragmentCount ?? 1;
    const prog = Math.round((matchedCount / total) * 100);
    setWorkbenchProgress(prog);

    if (matchedCount === total && total > 0 && !showRating) {
      setTimeout(() => triggerRating(), 800);
    }
  }, [placedFragments, artifact, setWorkbenchProgress, showRating]);

  const triggerRating = async () => {
    const accuracy = matchAttempts > 0 ? Math.round((matchSuccess / matchAttempts) * 100) : 100;
    const digT = digStartTime ? endDigTimer() : digTime;
    const integrity =
      currentSite && currentTool ? calculateIntegrity(currentSite, currentTool) : 80;
    const stars = calculateStars(integrity, accuracy);
    setLastRating({ stars, integrity, accuracy, digTime: digT });
    setShowRating(true);
    try {
      const res = await axios.post('/api/records', {
        id: uuidv4(),
        artifactId: currentArtifactId,
        artifactName: artifact?.name ?? '未知文物',
        site: currentSite,
        tool: currentTool,
        integrity,
        stars,
        digTime: digT,
        restorationAccuracy: accuracy,
        createdAt: new Date().toISOString(),
      });
      if (res.data?.success && res.data?.data) {
        addRecord(res.data.data);
      }
    } catch (e) {
      addRecord({
        id: uuidv4(),
        artifactId: currentArtifactId ?? '',
        artifactName: artifact?.name ?? '未知文物',
        site: currentSite ?? 'desert',
        tool: currentTool,
        integrity,
        stars,
        digTime: digT,
        restorationAccuracy: accuracy,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const checkMatch = (placedId: string): boolean => {
    const fragData = getFragmentById(placedId);
    if (!fragData) return false;
    const placed = placedFragments[placedId];
    if (!placed) return false;
    const sig = fragData.edgeSignature;
    const neighbors = [sig.north?.matchId, sig.south?.matchId, sig.east?.matchId, sig.west?.matchId].filter(
      Boolean
    ) as string[];

    for (const nId of neighbors) {
      const nPlaced = placedFragments[nId];
      if (!nPlaced || !nPlaced.matched) continue;
      const dx = Math.abs(placed.x - nPlaced.x);
      const dy = Math.abs(placed.y - nPlaced.y);
      const angleDiff = Math.abs(((placed.rotation - nPlaced.rotation) % 360 + 360) % 360);
      if (Math.hypot(dx, dy) < 110 + DIST_TOL && angleDiff < ANGLE_TOL) {
        return true;
      }
    }
    if (neighbors.length === 0 || Object.keys(placedFragments).length === 1) {
      const cx = PUZZLE_W / 2;
      const cy = PUZZLE_H / 2;
      return Math.hypot(placed.x - cx, placed.y - cy) < 260;
    }
    return false;
  };

  const onInventoryDragStart = (e: React.DragEvent, frag: FragmentData) => {
    e.dataTransfer.setData('text/plain', frag.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(frag.id);
  };

  const onPuzzleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onPuzzleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const rect = puzzleRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!placedFragments[id]) {
      placeFragment(id, x, y);
      setMatchAttempts((m) => m + 1);
      if (checkMatchDelayed(id)) {
        matchFragment(id);
        setMatchSuccess((m) => m + 1);
        setMatchFlash(id);
      }
    }
    setDraggingId(null);
  };

  const checkMatchDelayed = (id: string) => {
    const fragData = getFragmentById(id);
    if (!fragData) return false;
    const placed = placedFragments[id];
    const sig = fragData.edgeSignature;
    const neighbors = [sig.north?.matchId, sig.south?.matchId, sig.east?.matchId, sig.west?.matchId].filter(
      Boolean
    ) as string[];
    for (const nId of neighbors) {
      const nPlaced = placedFragments[nId];
      if (!nPlaced || !nPlaced.matched) continue;
      if (!placed) continue;
      const dx = Math.abs(placed.x - nPlaced.x);
      const dy = Math.abs(placed.y - nPlaced.y);
      const angleDiff = Math.abs(((placed.rotation - nPlaced.rotation) % 360 + 360) % 360);
      if (Math.hypot(dx, dy) < 110 + DIST_TOL && angleDiff < ANGLE_TOL) {
        return true;
      }
    }
    if (Object.keys(placedFragments).filter((k) => placedFragments[k]?.matched).length === 0) {
      return true;
    }
    return false;
  };

  const onPlacedMouseDown = (e: React.MouseEvent, id: string) => {
    if (!placedFragments[id]?.matched) {
      setSelectedFragment(id);
      const rect = puzzleRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left - placedFragments[id].x,
          y: e.clientY - rect.top - placedFragments[id].y,
        });
      }
      setDraggingId(id);
    }
  };

  const onPuzzleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !placedFragments[draggingId]) return;
    const rect = puzzleRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(40, Math.min(PUZZLE_W - 40, e.clientX - rect.left - dragOffset.x));
    const y = Math.max(40, Math.min(PUZZLE_H - 40, e.clientY - rect.top - dragOffset.y));
    updateFragment(draggingId, { x, y });
  };

  const onPuzzleMouseUp = () => {
    if (draggingId && placedFragments[draggingId] && !placedFragments[draggingId].matched) {
      setMatchAttempts((m) => m + 1);
      if (checkMatch(draggingId)) {
        matchFragment(draggingId);
        setMatchSuccess((m) => m + 1);
        setMatchFlash(draggingId);
      }
    }
    setDraggingId(null);
    setSelectedFragment(null);
  };

  const onPuzzleWheel = (e: React.WheelEvent) => {
    if (!selectedFragmentId) return;
    if (placedFragments[selectedFragmentId]?.matched) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    const target = (rotationAnim[selectedFragmentId] ?? 0) + dir * 15;
    setRotationAnim({ ...rotationAnim, [selectedFragmentId]: target });
    rotateFragment(selectedFragmentId, dir * 15);
    setTimeout(() => {
      if (!placedFragments[selectedFragmentId]?.matched) {
        setMatchAttempts((m) => m + 1);
        if (checkMatch(selectedFragmentId)) {
          matchFragment(selectedFragmentId);
          setMatchSuccess((m) => m + 1);
          setMatchFlash(selectedFragmentId);
        }
      }
    }, 120);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && selectedFragmentId && !placedFragments[selectedFragmentId]?.matched) {
        setFlipAnim({ ...flipAnim, [selectedFragmentId]: true });
        flipFragment(selectedFragmentId);
        setTimeout(() => {
          setFlipAnim({ ...flipAnim, [selectedFragmentId]: false });
          setMatchAttempts((m) => m + 1);
          if (checkMatch(selectedFragmentId)) {
            matchFragment(selectedFragmentId);
            setMatchSuccess((m) => m + 1);
            setMatchFlash(selectedFragmentId);
          }
        }, 350);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const unplacedFragments = excavatedFragments.filter((f) => !placedFragments[f.id]);
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-full relative"
      style={{
        background:
          'radial-gradient(ellipse at 30% 0%, rgba(180,83,9,0.15), transparent 60%),linear-gradient(135deg,#3a2a1a 0%,#4b3824 40%,#5c462d 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%236b4423'/><g fill-opacity='0.12' fill='%232a1810'><path d='M0,0 L200,180 M0,50 L200,220 M0,100 L200,260 M0,150 L200,300 M-20,0 L180,200 M-60,0 L140,200 M-100,0 L100,200'/></g></svg>")`,
          backgroundSize: '200px 200px',
        }}
      />

      <header className="relative z-10 max-w-7xl mx-auto px-5 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 h-10 rounded-xl bg-black/30 backdrop-blur hover:bg-black/50 text-amber-100 transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-[Lora] text-sm">返回场地</span>
        </button>

        <div className="text-center">
          <h2 className="font-[Cinzel] text-xl text-amber-100 font-bold">修复工作台</h2>
          <p className="font-[Lora] text-xs text-amber-200/60 mt-0.5">
            {artifact?.name} · {artifact?.era}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-black/30 backdrop-blur font-[Cinzel] text-amber-100 text-sm tracking-wider">
            ⏱ {formatTime(digTime)}
          </div>
          <button
            onClick={() => navigate('/exhibition')}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-amber-600/40 hover:bg-amber-600/60 text-amber-100 transition-all hover:scale-105 border border-amber-500/40"
          >
            <Save className="w-4 h-4" />
            <span className="font-[Lora] text-sm">展览柜</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-5 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-4">
          {/* 库存 */}
          <div className="rounded-2xl p-4 bg-gradient-to-b from-amber-950/40 to-amber-900/20 border border-amber-800/40 backdrop-blur-sm shadow-xl">
            <h3 className="font-[Cinzel] text-amber-200 text-sm mb-3 font-semibold tracking-wider">
              碎片库存 ({unplacedFragments.length})
            </h3>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {unplacedFragments.length === 0 && (
                <p className="font-[Lora] text-amber-300/50 text-xs text-center py-8">
                  暂无碎片，前往挖掘场地
                </p>
              )}
              {unplacedFragments.map((f) => (
                <FragmentInventoryItem key={f.id} fragment={f} onDragStart={onInventoryDragStart} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-amber-800/40 space-y-2">
              <p className="font-[Lora] text-amber-300/80 text-xs flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> 滚轮旋转15°
              </p>
              <p className="font-[Lora] text-amber-300/80 text-xs flex items-center gap-1">
                <FlipHorizontal2 className="w-3.5 h-3.5" /> 按R键水平翻转
              </p>
              <p className="font-[Lora] text-amber-300/80 text-xs flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> 拖拽移动位置
              </p>
            </div>
          </div>

          {/* 拼图区 */}
          <div
            className="relative rounded-2xl overflow-hidden border border-amber-800/50 shadow-2xl"
            style={{
              background:
                'radial-gradient(ellipse at center,#fef3c7 0%,#fde68a 40%,#fcd34d 100%)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/30 to-transparent p-3">
              <div className="flex items-center justify-between">
                <span className="font-[Cinzel] text-amber-50 text-xs tracking-wider">修复拼图区</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${workbenchProgress}%` }}
                    />
                  </div>
                  <span className="font-[Cinzel] text-amber-50 text-xs">{workbenchProgress}%</span>
                </div>
              </div>
            </div>

            <div
              ref={puzzleRef}
              onDragOver={onPuzzleDragOver}
              onDrop={onPuzzleDrop}
              onMouseMove={onPuzzleMouseMove}
              onMouseUp={onPuzzleMouseUp}
              onMouseLeave={onPuzzleMouseUp}
              onWheel={onPuzzleWheel}
              className="relative w-full"
              style={{ height: PUZZLE_H, minWidth: PUZZLE_W }}
            >
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg,#000 1px,transparent 1px),linear-gradient(#000 1px,transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              {Object.keys(placedFragments).map((id) => (
                <PlacedFragmentView
                  key={id}
                  fragment={getFragmentById(id)!}
                  placed={placedFragments[id]}
                  onMouseDown={onPlacedMouseDown}
                  isSelected={selectedFragmentId === id}
                  isDragging={draggingId === id}
                  flash={matchFlash === id}
                  rotationTarget={rotationAnim[id]}
                  flipTriggered={flipAnim[id]}
                />
              ))}
            </div>
          </div>

          {/* 预览区 */}
          <div className="rounded-2xl p-4 bg-gradient-to-b from-amber-950/40 to-amber-900/20 border border-amber-800/40 backdrop-blur-sm shadow-xl space-y-4">
            <h3 className="font-[Cinzel] text-amber-200 text-sm font-semibold tracking-wider">
              文物预览
            </h3>
            {artifact && (
              <ArtifactThumbnail artifact={artifact} progress={workbenchProgress} />
            )}
            <div className="space-y-2">
              <InfoRow label="碎片总数" value={`${artifact?.fragmentCount ?? 0} 块`} />
              <InfoRow label="已拼接" value={`${Object.keys(placedFragments).filter(k => placedFragments[k]?.matched).length} 块`} />
              <InfoRow label="完整度" value={`${currentSite && currentTool ? calculateIntegrity(currentSite, currentTool) : 0}%`} />
              <InfoRow label="准确率" value={`${matchAttempts > 0 ? Math.round((matchSuccess / matchAttempts) * 100) : 100}%`} />
            </div>
          </div>
        </div>
      </main>

      {showRating && lastRating && (
        <RatingModal
          stars={lastRating.stars}
          integrity={lastRating.integrity}
          accuracy={lastRating.accuracy}
          digTime={lastRating.digTime}
          artifactName={artifact?.name ?? ''}
          onGoExhibition={() => navigate('/exhibition')}
          onRestart={() => {
            resetGame();
            navigate('/');
          }}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-amber-800/30 last:border-b-0">
      <span className="font-[Lora] text-amber-300/70 text-xs">{label}</span>
      <span className="font-[Cinzel] text-amber-100 text-sm font-semibold">{value}</span>
    </div>
  );
}

function FragmentInventoryItem({
  fragment,
  onDragStart,
}: {
  fragment: FragmentData;
  onDragStart: (e: React.DragEvent, frag: FragmentData) => void;
}) {
  const pathD =
    'M ' +
    fragment.shape
      .map((p, i) => {
        const sx = (p[0] / 160) * 60;
        const sy = (p[1] / 160) * 60;
        return `${i === 0 ? '' : 'L '}${sx.toFixed(1)} ${sy.toFixed(1)}`;
      })
      .join(' ') +
    ' Z';
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, fragment)}
      className="group relative rounded-xl p-2 bg-black/20 hover:bg-black/40 border border-amber-700/40 hover:border-amber-500/60 transition-all cursor-grab active:cursor-grabbing hover:scale-[1.04]"
    >
      <div className="flex items-center gap-2">
        <svg width="60" height="60" viewBox="0 0 70 70">
          <path d={pathD} fill={fragment.color} stroke="#fcd34d66" strokeWidth="1" />
        </svg>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block w-3 h-3 rounded-full border border-amber-300/50" style={{ background: fragment.color }} />
            <span className="font-[Cinzel] text-amber-100 text-xs font-semibold">
              #{fragment.index + 1}
            </span>
          </div>
          <span className="font-[Lora] text-amber-200/60 text-[10px] block">拖拽放置</span>
        </div>
      </div>
    </div>
  );
}

function PlacedFragmentView({
  fragment,
  placed,
  onMouseDown,
  isSelected,
  isDragging,
  flash,
  rotationTarget,
  flipTriggered,
}: {
  fragment: FragmentData;
  placed: PlacedFragment;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  isSelected: boolean;
  isDragging: boolean;
  flash: boolean;
  rotationTarget?: number;
  flipTriggered?: boolean;
}) {
  const pathD =
    'M ' +
    fragment.shape
      .map((p, i) => {
        const sx = (p[0] / 160) * 100;
        const sy = (p[1] / 160) * 100;
        return `${i === 0 ? '' : 'L '}${sx.toFixed(1)} ${sy.toFixed(1)}`;
      })
      .join(' ') +
    ' Z';
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (flipTriggered) {
      setScale(-1);
      const t = setTimeout(() => setScale(1), 320);
      return () => clearTimeout(t);
    }
  }, [flipTriggered]);
  void rotationTarget;
  return (
    <div
      className="absolute select-none"
      style={{
        left: placed.x,
        top: placed.y,
        transform: `translate(-50%,-50%) rotate(${placed.rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: placed.matched ? 'default' : isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected || isDragging ? 100 : 10 + fragment.index,
      }}
      onMouseDown={(e) => onMouseDown(e, fragment.id)}
    >
      <div
        className="relative"
        style={{
          transform: `scaleX(${placed.flipped ? -scale : scale})`,
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 110 110"
          style={{
            filter: isDragging
              ? 'drop-shadow(0 16px 24px rgba(0,0,0,0.6))'
              : placed.matched
                ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.4))'
                : 'drop-shadow(0 8px 18px rgba(0,0,0,0.5))',
            opacity: isDragging ? 0.9 : 1,
          }}
        >
          <path
            d={pathD}
            fill={fragment.color}
            stroke={placed.matched ? '#22c55e' : isSelected ? '#fbbf24' : '#fff6'}
            strokeWidth={placed.matched ? 3 : isSelected ? 2.4 : 1.2}
            style={{
              transition: 'stroke 0.3s,stroke-width 0.3s',
            }}
          />
        </svg>
        <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-amber-400/50">
          <span className="font-[Cinzel] text-amber-100 text-[10px] font-bold">
            {fragment.index + 1}
          </span>
        </div>
        {flash && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-28 h-28 rounded-full bg-green-400/60 animate-matchflash" />
          </div>
        )}
        {placed.matched && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-md">
            <span className="text-white text-[10px] font-bold">✓</span>
          </div>
        )}
      </div>
      <style>{`
        @keyframes matchflash {
          0% { transform: scale(0.2); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .animate-matchflash { animation: matchflash 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

function ArtifactThumbnail({ artifact, progress }: { artifact: ReturnType<typeof getArtifactById>; progress: number }) {
  if (!artifact) return null;
  const sortedFrags = [...artifact.fragments].sort((a, b) => a.index - b.index);
  return (
    <div
      className="rounded-xl overflow-hidden aspect-square relative"
      style={{
        background: 'linear-gradient(135deg,#78350f,#92400e,#b45309)',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 300 300">
        {sortedFrags.map((f) => {
          const pathD =
            'M ' +
            f.shape
              .map((p, i) => {
                const sx = p[0];
                const sy = p[1];
                return `${i === 0 ? '' : 'L '}${sx.toFixed(1)} ${sy.toFixed(1)}`;
              })
              .join(' ') +
            ' Z';
          const shown = progress >= ((f.index + 1) / artifact.fragmentCount) * 100;
          return (
            <path
              key={f.id}
              d={pathD}
              fill={shown ? f.color : 'rgba(0,0,0,0.3)'}
              stroke="#fff4"
              strokeWidth="1"
              style={{ transition: 'fill 0.5s ease' }}
            />
          );
        })}
      </svg>
      <div className="absolute bottom-2 left-2 right-2 h-1.5 bg-black/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-300 to-yellow-200 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function RatingModal({
  stars,
  integrity,
  accuracy,
  digTime,
  artifactName,
  onGoExhibition,
  onRestart,
  onClose,
}: {
  stars: number;
  integrity: number;
  accuracy: number;
  digTime: number;
  artifactName: string;
  onGoExhibition: () => void;
  onRestart: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative rounded-3xl p-8 w-[520px] max-w-[92vw] overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(253,224,71,0.25), transparent 60%),linear-gradient(145deg,#3f2a15 0%,#5a3b1e 100%)',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)',
        }}
      >
        <div className="absolute top-4 right-4 flex justify-end">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/40 text-amber-200 hover:bg-black/60 transition-all">
            ✕
          </button>
        </div>
        <div className="text-center">
          <p className="font-[Lora] text-amber-300/70 text-sm mb-2">修复完成</p>
          <h2 className="font-[Cinzel] text-3xl text-amber-100 font-bold mb-6">{artifactName}</h2>

          <div className="flex justify-center items-end gap-4 mb-8 h-32">
            {[1, 2, 3].map((i) => (
              <StarWithAnim key={i} lit={stars >= i} delay={i * 0.3} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard label="完整度" value={`${integrity}%`} />
            <StatCard label="修复准确率" value={`${accuracy}%`} />
            <StatCard
              label="挖掘用时"
              value={`${Math.floor(digTime / 60)}:${(digTime % 60).toString().padStart(2, '0')}`}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-950/60 border border-amber-700/50 text-amber-100 hover:bg-amber-900/70 hover:scale-105 transition-all font-[Cinzel] text-sm font-semibold"
            >
              再次探索
            </button>
            <button
              onClick={onGoExhibition}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-[Cinzel] text-sm font-semibold hover:scale-105 transition-all"
              style={{
                background: 'linear-gradient(135deg,#b45309,#d97706)',
                boxShadow: '0 12px 30px -8px rgba(217,119,6,0.55)',
              }}
            >
              <Save className="w-4 h-4" />
              放入展览柜
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 border border-amber-800/40 p-3 backdrop-blur-sm">
      <div className="font-[Lora] text-amber-300/70 text-[11px] mb-1">{label}</div>
      <div className="font-[Cinzel] text-amber-100 text-xl font-bold">{value}</div>
    </div>
  );
}

function StarWithAnim({ lit, delay }: { lit: boolean; delay: number }) {
  const [shown, setShown] = useState(false);
  const [rot, setRot] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => {
      setShown(lit);
    }, delay * 1000);
    let raf = 0;
    const t2 = setTimeout(() => {
      if (!lit) return;
      const start = performance.now();
      const dur = 1000;
      const anim = () => {
        const p = Math.min(1, (performance.now() - start) / dur);
        setRot(p * 360);
        if (p < 1) raf = requestAnimationFrame(anim);
      };
      raf = requestAnimationFrame(anim);
    }, delay * 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      cancelAnimationFrame(raf);
    };
  }, [lit, delay]);
  return (
    <div className="relative flex flex-col items-center">
      <div
        className="transition-all duration-500"
        style={{
          transform: `rotate(${rot}deg) scale(${shown ? 1 : 0.6})`,
          opacity: shown ? 1 : 0.25,
        }}
      >
        <div className="relative">
          <Star
            size={56}
            fill={shown ? '#fde047' : '#5c4a2f'}
            stroke={shown ? '#facc15' : '#7a6441'}
            strokeWidth={1.5}
            style={{
              filter: shown ? 'drop-shadow(0 0 18px rgba(253,224,71,0.75))' : 'none',
            }}
          />
          {shown && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 0deg, rgba(255,255,255,0.6) 0deg, transparent 60deg, transparent 360deg)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 35%, transparent 75%)',
                animation: 'sweep 1.6s linear infinite',
              }}
            />
          )}
        </div>
      </div>
      <style>{`
        @keyframes sweep { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
