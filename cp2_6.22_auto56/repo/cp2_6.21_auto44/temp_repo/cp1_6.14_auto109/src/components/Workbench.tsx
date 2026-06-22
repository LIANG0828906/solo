import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, RotateCw, FlipHorizontal2, Star, Save, RotateCcw } from 'lucide-react';
import { useGameStore, calculateIntegrity, calculateStars } from '../stores/gameStore';
import { getArtifactById, getFragmentById } from '../data/artifacts';
import type { FragmentData, PlacedFragment } from '../types';

const DIST_TOL = 20;
const ANGLE_TOL = 10;
const PUZZLE_W = 600;
const PUZZLE_H = 500;
const EXPECTED_SPACING = 110;

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
  const rotationVelRef = useRef<Record<string, number>>({});
  const rotationTargetRef = useRef<Record<string, number>>({});
  const flipAnimRef = useRef<Record<string, number>>({});
  const [matchAttempts, setMatchAttempts] = useState(0);
  const [matchSuccess, setMatchSuccess] = useState(0);
  const [highlightPairs, setHighlightPairs] = useState<string[]>([]);
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
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const vels = rotationVelRef.current;
      const tgts = rotationTargetRef.current;
      const stored = useGameStore.getState().placedFragments;
      Object.keys(vels).forEach((id) => {
        if (Math.abs(vels[id]) < 0.05) {
          delete vels[id];
          delete tgts[id];
          return;
        }
        const curRot = stored[id]?.rotation ?? 0;
        const newRot = (curRot + vels[id] + 360) % 360;
        useGameStore.setState({
          placedFragments: { ...stored, [id]: { ...stored[id], rotation: newRot } },
        });
        vels[id] *= 0.92;
        if (tgts[id] !== undefined) {
          const diff = ((tgts[id] - newRot + 540) % 360) - 180;
          if (Math.abs(diff) < 0.2) {
            vels[id] = 0;
          }
        }
      });
      Object.keys(flipAnimRef.current).forEach((id) => {
        flipAnimRef.current[id] -= 0.04;
        if (flipAnimRef.current[id] <= 0) delete flipAnimRef.current[id];
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const placedIds = Object.keys(placedFragments);
    const matchedCount = placedIds.filter((id) => placedFragments[id]?.matched).length;
    const total = artifact?.fragmentCount ?? 1;
    const prog = Math.round((matchedCount / total) * 100);
    setWorkbenchProgress(prog);
    if (matchedCount === total && total > 0 && !showRating) {
      setTimeout(() => triggerRating(), 700);
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
    } catch (_e) {
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

  const getEdgeCenter = (id: string, edge: 'north' | 'south' | 'east' | 'west'): { x: number; y: number } | null => {
    const placed = placedFragments[id];
    if (!placed) return null;
    const rad = (placed.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const off = 52;
    const localOffsets = {
      north: [0, -off],
      south: [0, off],
      east: [off, 0],
      west: [-off, 0],
    } as const;
    const [lox, loy] = localOffsets[edge];
    return {
      x: placed.x + lox * cos - loy * sin,
      y: placed.y + lox * sin + loy * cos,
    };
  };

  const checkPairEdges = (idA: string, idB: string): boolean => {
    const a = getFragmentById(idA);
    const b = getFragmentById(idB);
    if (!a || !b) return false;
    const placedA = placedFragments[idA];
    const placedB = placedFragments[idB];
    if (!placedA || !placedB) return false;

    const edgesA: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];
    for (const ea of edgesA) {
      const sigA = a.edgeSignature[ea];
      if (!sigA || sigA.matchId !== idB) continue;
      const edgesB: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];
      for (const eb of edgesB) {
        const sigB = b.edgeSignature[eb];
        if (!sigB || sigB.matchId !== idA) continue;
        const cA = getEdgeCenter(idA, ea);
        const cB = getEdgeCenter(idB, eb);
        if (!cA || !cB) continue;
        const dist = Math.hypot(cA.x - cB.x, cA.y - cB.y);
        const angleDiff = Math.abs(((placedA.rotation - placedB.rotation) % 360 + 540) % 360 - 180);
        if (dist < DIST_TOL + 30 && angleDiff < ANGLE_TOL + 15) {
          return true;
        }
      }
    }
    return false;
  };

  const checkAllPairsNearby = () => {
    const ids = Object.keys(placedFragments);
    const newHighlight: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (placedFragments[ids[i]].matched && placedFragments[ids[j]].matched) continue;
        const pA = placedFragments[ids[i]];
        const pB = placedFragments[ids[j]];
        const dist = Math.hypot(pA.x - pB.x, pA.y - pB.y);
        if (dist < EXPECTED_SPACING + DIST_TOL + 30) {
          if (checkPairEdges(ids[i], ids[j])) {
            newHighlight.push(ids[i], ids[j]);
          }
        }
      }
    }
    setHighlightPairs(newHighlight);
  };

  useEffect(() => {
    checkAllPairsNearby();
  }, [placedFragments, checkAllPairsNearby]);

  const finalizeMatch = (id: string) => {
    if (placedFragments[id]?.matched) return;
    let found = false;
    Object.keys(placedFragments).forEach((otherId) => {
      if (otherId === id) return;
      const pair = [id, otherId].sort();
      const pairKey = pair.join('|');
      void pairKey;
      if (checkPairEdges(id, otherId)) found = true;
    });
    const matchedAny = Object.values(placedFragments).some((p) => p.matched);
    if (found || !matchedAny) {
      matchFragment(id);
      setMatchSuccess((m) => m + 1);
      setMatchFlash(id);
      void placedFragments;
    }
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
      finalizeMatch(id);
    }
    setDraggingId(null);
  };

  const onPlacedMouseDown = (e: React.MouseEvent, id: string) => {
    const placed = placedFragments[id];
    if (!placed) return;
    if (placed.matched) return;
    setSelectedFragment(id);
    const rect = puzzleRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - placed.x,
        y: e.clientY - rect.top - placed.y,
      });
    }
    setDraggingId(id);
  };

  const onPuzzleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !placedFragments[draggingId]) return;
    const rect = puzzleRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(50, Math.min(PUZZLE_W - 50, e.clientX - rect.left - dragOffset.x));
    const y = Math.max(50, Math.min(PUZZLE_H - 50, e.clientY - rect.top - dragOffset.y));
    updateFragment(draggingId, { x, y });
  };

  const onPuzzleMouseUp = () => {
    if (draggingId && placedFragments[draggingId] && !placedFragments[draggingId].matched) {
      setMatchAttempts((m) => m + 1);
      finalizeMatch(draggingId);
    }
    setDraggingId(null);
    setSelectedFragment(null);
  };

  const handleWheelRotate = (e: React.WheelEvent) => {
    if (!selectedFragmentId) return;
    if (placedFragments[selectedFragmentId]?.matched) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    const step = 15;
    rotateFragment(selectedFragmentId, dir * step);
    rotationVelRef.current[selectedFragmentId] = dir * (step * 0.7);
    const target = ((placedFragments[selectedFragmentId]?.rotation ?? 0) + dir * step * 2 + 720) % 360;
    rotationTargetRef.current[selectedFragmentId] = target;
    setTimeout(() => {
      if (!placedFragments[selectedFragmentId]?.matched) {
        setMatchAttempts((m) => m + 1);
        finalizeMatch(selectedFragmentId);
      }
    }, 300);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && selectedFragmentId && !placedFragments[selectedFragmentId]?.matched) {
        flipAnimRef.current[selectedFragmentId] = 1;
        flipFragment(selectedFragmentId);
        setTimeout(() => {
          setMatchAttempts((m) => m + 1);
          finalizeMatch(selectedFragmentId);
        }, 400);
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
    <div
      className="min-h-screen w-full relative"
      style={{
        background:
          'radial-gradient(ellipse at 30% 0%, rgba(180,83,9,0.15), transparent 60%),linear-gradient(135deg,#3a2a1a 0%,#4b3824 40%,#5c462d 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%236b4423'/><g fill-opacity='0.12' fill='%232a1810'><path d='M0,0 L200,180 M0,50 L200,220 M0,100 L200,260 M0,150 L200,300 M-20,0 L180,200 M-60,0 L140,200 M-100,0 L100,200'/></g></svg>\")",
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
          <div className="rounded-2xl p-4 bg-gradient-to-b from-amber-950/40 to-amber-900/20 border border-amber-800/40 backdrop-blur-sm shadow-xl">
            <h3 className="font-[Cinzel] text-amber-200 text-sm mb-3 font-semibold tracking-wider">
              碎片库存 ({unplacedFragments.length})
            </h3>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {unplacedFragments.length === 0 && (
                <p className="font-[Lora] text-amber-300/50 text-xs text-center py-8">暂无碎片，前往挖掘场地</p>
              )}
              {unplacedFragments.map((f) => (
                <FragmentInventoryItem key={f.id} fragment={f} onDragStart={onInventoryDragStart} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-amber-800/40 space-y-2">
              <p className="font-[Lora] text-amber-300/80 text-xs flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> 滚轮旋转15°+阻尼
              </p>
              <p className="font-[Lora] text-amber-300/80 text-xs flex items-center gap-1">
                <FlipHorizontal2 className="w-3.5 h-3.5" /> 按R键弹性翻转
              </p>
              <p className="font-[Lora] text-amber-300/80 text-xs flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> 拖拽自动吸附
              </p>
            </div>
          </div>

          <div
            className="relative rounded-2xl overflow-hidden border border-amber-800/50 shadow-2xl"
            style={{ background: 'radial-gradient(ellipse at center,#fef3c7 0%,#fde68a 40%,#fcd34d 100%)' }}
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
              onWheel={handleWheelRotate}
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
              {highlightPairs.length > 0 &&
                highlightPairs.map((id) => {
                  const p = placedFragments[id];
                  if (!p || p.matched) return null;
                  return (
                    <div
                      key={`hl-${id}`}
                      className="absolute pointer-events-none animate-pulse"
                      style={{
                        left: p.x - 65,
                        top: p.y - 65,
                        width: 130,
                        height: 130,
                        border: '3px solid rgba(34,197,94,0.7)',
                        borderRadius: '20px',
                        boxShadow: '0 0 30px 4px rgba(34,197,94,0.45)',
                      }}
                    />
                  );
                })}
              {Object.keys(placedFragments).map((id) => (
                <PlacedFragmentView
                  key={id}
                  fragment={getFragmentById(id)!}
                  placed={placedFragments[id]}
                  onMouseDown={onPlacedMouseDown}
                  isSelected={selectedFragmentId === id}
                  isDragging={draggingId === id}
                  flash={matchFlash === id}
                  highlighted={highlightPairs.includes(id) && !placedFragments[id].matched}
                  flipAnimating={!!flipAnimRef.current[id]}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-gradient-to-b from-amber-950/40 to-amber-900/20 border border-amber-800/40 backdrop-blur-sm shadow-xl space-y-4">
            <h3 className="font-[Cinzel] text-amber-200 text-sm font-semibold tracking-wider">文物预览</h3>
            {artifact && <ArtifactThumbnail artifact={artifact} progress={workbenchProgress} />}
            <div className="space-y-2">
              <InfoRow label="碎片总数" value={`${artifact?.fragmentCount ?? 0} 块`} />
              <InfoRow label="已拼接" value={`${Object.keys(placedFragments).filter((k) => placedFragments[k]?.matched).length} 块`} />
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
            <span className="font-[Cinzel] text-amber-100 text-xs font-semibold">#{fragment.index + 1}</span>
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
  highlighted,
  flipAnimating,
}: {
  fragment: FragmentData;
  placed: PlacedFragment;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  isSelected: boolean;
  isDragging: boolean;
  flash: boolean;
  highlighted: boolean;
  flipAnimating: boolean;
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
  return (
    <div
      className="absolute select-none"
      style={{
        left: placed.x,
        top: placed.y,
        transform: `translate(-50%,-50%) rotate(${placed.rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.3s',
        cursor: placed.matched ? 'default' : isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected || isDragging ? 100 : 10 + fragment.index,
      }}
      onMouseDown={(e) => onMouseDown(e, fragment.id)}
    >
      <div
        className="relative"
        style={{
          transform: `scaleX(${placed.flipped ? -1 : 1})`,
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          style={{
            transform: flipAnimating ? 'perspective(500px) rotateY(180deg)' : 'perspective(500px) rotateY(0)',
            transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
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
                  ? 'drop-shadow(0 6px 14px rgba(22,163,74,0.45))'
                  : highlighted
                    ? 'drop-shadow(0 8px 22px rgba(34,197,94,0.65))'
                    : 'drop-shadow(0 8px 18px rgba(0,0,0,0.5))',
              opacity: isDragging ? 0.92 : 1,
            }}
          >
            <path
              d={pathD}
              fill={fragment.color}
              stroke={placed.matched ? '#16a34a' : highlighted ? '#22c55e' : isSelected ? '#fbbf24' : '#ffffff88'}
              strokeWidth={placed.matched || highlighted ? 3 : isSelected ? 2.4 : 1.2}
              style={{ transition: 'stroke 0.3s,stroke-width 0.3s' }}
            />
          </svg>
        </div>
        <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-amber-400/50">
          <span className="font-[Cinzel] text-amber-100 text-[10px] font-bold">{fragment.index + 1}</span>
        </div>
        {flash && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              left: -15,
              top: -15,
              right: -15,
              bottom: -15,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74,222,128,0.85) 0%, rgba(34,197,94,0.45) 45%, rgba(34,197,94,0) 80%)',
              animation: 'matchflash 0.3s ease-out forwards',
            }}
          />
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
      `}</style>
    </div>
  );
}

function ArtifactThumbnail({ artifact, progress }: { artifact: ReturnType<typeof getArtifactById>; progress: number }) {
  if (!artifact) return null;
  const sortedFrags = [...artifact.fragments].sort((a, b) => a.index - b.index);
  return (
    <div className="rounded-xl overflow-hidden aspect-square relative" style={{ background: 'linear-gradient(135deg,#78350f,#92400e,#b45309)' }}>
      <Canvas camera={{ position: [0, 0, 220], fov: 50 }} dpr={[1, 1.5]} gl={{ alpha: true }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[50, 50, 40]} intensity={1.1} />
        <ThumbnailPieces frags={sortedFrags} progress={progress} />
      </Canvas>
      <div className="absolute bottom-2 left-2 right-2 h-1.5 bg-black/40 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-300 to-yellow-200 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function ThumbnailPieces({ frags, progress }: { frags: FragmentData[]; progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.25;
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.6) * 0.15;
    }
    meshesRef.current.forEach((m, i) => {
      const f = frags[i];
      if (!f || !m) return;
      const threshold = ((f.index + 1) / frags.length) * 100;
      const shown = progress >= threshold;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.opacity = shown ? 1 : 0.08;
      mat.needsUpdate = true;
      m.scale.setScalar(shown ? 1 : 0.02);
    });
  });
  return (
    <group ref={groupRef}>
      {frags.map((f, i) => {
        const posX = (f.shape.reduce((a, p) => a + p[0], 0) / f.shape.length - 80) * 0.6;
        const posY = (90 - f.shape.reduce((a, p) => a + p[1], 0) / f.shape.length) * 0.6;
        return (
          <mesh
            key={f.id}
            position={[posX, posY, (i % 3) * 0.02]}
            scale={0.02}
            ref={(el) => {
              if (el) meshesRef.current[i] = el;
            }}
          >
            <boxGeometry args={[14 + (i % 2) * 2, 14 + (i % 3) * 2, 6 + (i % 2)]} />
            <meshStandardMaterial color={f.color} flatShading roughness={0.65} metalness={0.1} transparent opacity={0.08} />
          </mesh>
        );
      })}
    </group>
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
        className="relative rounded-3xl p-8 w-[540px] max-w-[92vw] overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(253,224,71,0.25), transparent 60%),linear-gradient(145deg,#3f2a15 0%,#5a3b1e 100%)',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)',
        }}
      >
        <div className="absolute top-4 right-4">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/40 text-amber-200 hover:bg-black/60 transition-all">
            ✕
          </button>
        </div>
        <div className="text-center">
          <p className="font-[Lora] text-amber-300/70 text-sm mb-2">修复完成</p>
          <h2 className="font-[Cinzel] text-3xl text-amber-100 font-bold mb-6">{artifactName}</h2>
          <div className="flex justify-center items-end gap-5 mb-8" style={{ height: '130px' }}>
            {[1, 2, 3].map((i) => (
              <RotatingStar key={i} index={i} lit={stars >= i} delay={i * 0.32} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard label="完整度" value={`${integrity}%`} />
            <StatCard label="修复准确率" value={`${accuracy}%`} />
            <StatCard label="挖掘用时" value={`${Math.floor(digTime / 60)}:${(digTime % 60).toString().padStart(2, '0')}`} />
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

function RotatingStar({ lit, delay, index }: { lit: boolean; delay: number; index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(false);
  const [finalLit, setFinalLit] = useState(false);
  useFrame(({ clock }) => {
    const et = clock.getElapsedTime();
    if (ref.current && finalLit) {
      const local = Math.max(0, et - delay - index * 0.5) * 1.8;
      ref.current.rotation.z = Math.min(local, Math.PI * 2);
      const s = 1 + 0.08 * Math.sin(Math.min(local * 1.2, Math.PI));
      ref.current.scale.setScalar(s);
    }
    if (haloRef.current && finalLit) {
      haloRef.current.rotation.z += 0.02;
      const m = haloRef.current.material as THREE.MeshBasicMaterial;
      const t = (et * 0.7) % 1;
      m.opacity = 0.15 + Math.sin(t * Math.PI * 2) * 0.12;
      m.needsUpdate = true;
    }
  });
  useEffect(() => {
    const t1 = setTimeout(() => {
      setVisible(true);
    }, delay * 1000);
    const t2 = setTimeout(() => {
      setFinalLit(lit);
    }, (delay + 0.05) * 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [lit, delay]);
  return (
    <div style={{ width: '110px', height: '120px' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }} dpr={[1, 1.6]} gl={{ alpha: true }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[0, 2, 3]} intensity={2} color="#fde68a" />
        <StarGeometry ref={ref} visible={visible} lit={finalLit} />
        {finalLit && (
          <mesh ref={haloRef} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.95, 1.25, 3, 1, Math.PI * 0.15, Math.PI * 0.4]} />
            <meshBasicMaterial color="#fff8a3" transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
        )}
      </Canvas>
    </div>
  );
}

const StarGeometry = function StarGeometryInner({
  ref,
  visible,
  lit,
}: {
  ref: React.RefObject<THREE.Mesh>;
  visible: boolean;
  lit: boolean;
}) {
  const matColor = lit ? '#fde047' : '#4a3a22';
  const emissive = lit ? '#facc15' : '#000000';
  return (
    <mesh ref={ref} scale={visible ? 1 : 0.2}>
      <extrudeGeometry
        args={[
          new THREE.Shape(
            Array.from({ length: 10 }, (_, i) => {
              const r = i % 2 === 0 ? 0.95 : 0.4;
              const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
              return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
            })
          ),
          { depth: 0.15, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.03, bevelSegments: 2 },
        ]}
      />
      <meshStandardMaterial color={matColor} metalness={0.55} roughness={0.18} emissive={emissive} emissiveIntensity={lit ? 0.65 : 0} />
    </mesh>
  );
};
