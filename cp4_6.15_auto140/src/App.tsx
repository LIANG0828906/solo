import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TerrainCanvas } from './3d/TerrainCanvas';
import { MiningPanel } from './ui/MiningPanel';
import { artifactManager, ArtifactDefinition, ARTIFACT_DEFINITIONS } from './artifact/artifactManager';
import { terrainEngine } from './geo/terrainEngine';
import { sceneManager } from './3d/sceneManager';

type CursorMode = 'shovel' | 'grab' | 'default';

const HUD: React.FC<{
  cursorMode: CursorMode;
  setCursorMode: (m: CursorMode) => void;
  mineCount: number;
  lastEvent: string | null;
  topBarProgress: { collected: number; totalPieces: number; restored: number; totalArtifacts: number; points: number };
}> = ({ cursorMode, setCursorMode, mineCount, lastEvent, topBarProgress }) => {
  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        padding: '12px 20px',
        background: 'linear-gradient(180deg, rgba(42,26,12,0.88), rgba(30,18,8,0.55) 70%, transparent)',
        pointerEvents: 'none', zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#f5e6c8',
        borderBottom: '1px solid rgba(201,168,106,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            fontSize: 22, fontWeight: 700,
            color: '#e8c88a', letterSpacing: 2,
            textShadow: '0 2px 6px rgba(0,0,0,0.7), 0 0 14px rgba(201,168,106,0.25)'
          }}>
            ✦ 记忆地层 ✦
          </div>
          <div style={{ fontSize: 10.5, color: '#a8916a', lineHeight: 1.45, marginTop: 2 }}>
            Memory Strata · 交互式数字考古体验
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, pointerEvents: 'auto' }}>
          <div style={{
            display: 'flex', gap: 4,
            background: 'rgba(15,8,4,0.55)',
            border: '1px solid rgba(201,168,106,0.35)',
            borderRadius: 8, padding: 3
          }}>
            {(['shovel', 'grab', 'default'] as const).map(m => (
              <button key={m} onClick={() => setCursorMode(m)} style={{
                padding: '5px 10px',
                background: cursorMode === m ? 'linear-gradient(180deg, #c9a86a, #8b6914)' : 'transparent',
                border: cursorMode === m ? '1px solid #e8c88a' : '1px solid transparent',
                color: cursorMode === m ? '#2a1a0d' : '#c8a878',
                cursor: 'pointer', borderRadius: 6,
                fontSize: 11.5, fontWeight: cursorMode === m ? 700 : 500,
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                minWidth: 72
              }}>
                {m === 'shovel' && '⛏ 挖掘'}
                {m === 'grab' && '✋ 平移'}
                {m === 'default' && '🔍 浏览'}
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            fontSize: 11, lineHeight: 1.4
          }}>
            <div style={{ color: '#c8a878' }}>
              🧩 碎片 {topBarProgress.collected}/{topBarProgress.totalPieces}
              {' · '}🏺 复原 {topBarProgress.restored}/{topBarProgress.totalArtifacts}
            </div>
            <div style={{ color: '#e8c88a', fontWeight: 700 }}>
              ✨ {topBarProgress.points} 积分
            </div>
          </div>

          <div style={{
            padding: '3px 10px', borderRadius: 6,
            background: mineCount > 0 ? 'rgba(150,200,150,0.14)' : 'rgba(100,100,100,0.1)',
            border: `1px solid ${mineCount > 0 ? 'rgba(150,200,150,0.4)' : 'rgba(201,168,106,0.15)'}`,
            fontSize: 10.5, color: mineCount > 0 ? '#b8e0b8' : '#a8916a'
          }}>
            ⛏ 已挖掘 {mineCount} 次
          </div>
        </div>
      </div>

      {lastEvent && (
        <div style={{
          position: 'fixed', top: 74, left: '50%', transform: 'translateX(-50%)',
          padding: '7px 18px',
          background: 'linear-gradient(135deg, rgba(42,26,12,0.9), rgba(25,15,6,0.94))',
          border: '1px solid rgba(201,168,106,0.5)',
          borderRadius: 20,
          color: '#e8c88a', fontSize: 12.5,
          zIndex: 35, pointerEvents: 'none',
          boxShadow: '0 6px 20px rgba(0,0,0,0.55), 0 0 24px rgba(201,168,106,0.15)',
          fontFamily: 'Georgia, serif',
          letterSpacing: 0.3
        }}>
          {lastEvent}
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 14, left: 18,
        padding: '10px 14px',
        background: 'linear-gradient(135deg, rgba(42,26,12,0.78), rgba(25,15,6,0.85))',
        border: '1px solid rgba(201,168,106,0.35)',
        borderRadius: 10,
        color: '#d4c4a0', fontSize: 11,
        lineHeight: 1.7, fontFamily: 'Georgia, serif',
        zIndex: 25, pointerEvents: 'none',
        maxWidth: 290,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.45)'
      }}>
        <div style={{ color: '#e8c88a', fontWeight: 700, marginBottom: 5, fontSize: 12 }}>
          📖 操作指南
        </div>
        <div>• <b style={{ color: '#c8a878' }}>左键在地形上点击/拖拽</b>：⛏ 挖掘地层</div>
        <div>• <b style={{ color: '#c8a878' }}>右键拖动画面</b>：🔄 旋转视角</div>
        <div>• <b style={{ color: '#c8a878' }}>鼠标滚轮</b>：🔍 缩放场景</div>
        <div>• <b style={{ color: '#c8a878' }}>中键拖动画面</b>：✋ 平移视角</div>
        <div>• <b style={{ color: '#c8a878' }}>点击发光文物模型</b>：📦 收入碎片</div>
        <div>• <b style={{ color: '#c8a878' }}>拖拽碎片到工作台</b>：🧩 拼合复原</div>
      </div>
    </>
  );
};

const ToastLayer: React.FC<{ toasts: { id: number; text: string; color: string }[] }> = ({ toasts }) => (
  <div style={{ position: 'fixed', top: 110, right: 400, zIndex: 45, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding: '8px 14px',
        background: `linear-gradient(135deg, ${t.color}22, rgba(30,18,8,0.92))`,
        border: `1px solid ${t.color}99`,
        borderRadius: 8,
        color: '#f5e6c8', fontSize: 12,
        boxShadow: `0 5px 14px rgba(0,0,0,0.5), 0 0 16px ${t.color}40`,
        fontFamily: 'Georgia, serif',
        minWidth: 200
      }}>
        {t.text}
      </div>
    ))}
  </div>
);

const StrataLegend: React.FC = () => {
  const strata = sceneManager.getStratumLegendColors();
  return (
    <div style={{
      position: 'fixed', bottom: 14, right: 400,
      padding: '10px 13px',
      background: 'linear-gradient(135deg, rgba(42,26,12,0.78), rgba(25,15,6,0.85))',
      border: '1px solid rgba(201,168,106,0.35)',
      borderRadius: 10,
      color: '#d4c4a0', fontSize: 10.5,
      lineHeight: 1.7, fontFamily: 'Georgia, serif',
      zIndex: 25, pointerEvents: 'none',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      boxShadow: '0 6px 18px rgba(0,0,0,0.45)'
    }}>
      <div style={{ color: '#e8c88a', fontWeight: 700, marginBottom: 6, fontSize: 11.5 }}>
        🌏 地层图例
      </div>
      {strata.slice(0, 5).map((s, i) => (
        <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 18, height: 14, borderRadius: 2,
            background: s.color,
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: `inset 0 0 4px rgba(0,0,0,0.35)`
          }} />
          <span style={{ color: '#c8a878' }}>{5 - i}. </span>
          <span>{s.name}</span>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [cursorMode, setCursorMode] = useState<CursorMode>('shovel');
  const [highlightLocations, setHighlightLocations] = useState<string[]>([]);
  const [mineCount, setMineCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string; color: string }[]>([]);
  const [progress, setProgress] = useState(artifactManager.getProgress());
  const [, forceRerender] = useState(0);

  const lastEventTimer = useRef<number | null>(null);
  const toastIdCounter = useRef(0);
  const recentDiscoveredSet = useRef<Set<string>>(new Set());

  const pushToast = useCallback((text: string, color: string = '#c9a86a') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, { id, text, color }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3400);
  }, []);

  const flashEvent = useCallback((text: string) => {
    setLastEvent(text);
    if (lastEventTimer.current) window.clearTimeout(lastEventTimer.current);
    lastEventTimer.current = window.setTimeout(() => setLastEvent(null), 2800);
  }, []);

  useEffect(() => {
    const off1 = artifactManager.addPieceCollectedListener((piece) => {
      const def = artifactManager.getDefinition(piece.artifactId);
      if (def) {
        flashEvent(`📦 获得碎片：${def.name} #${piece.pieceIndex + 1}/${piece.totalPieces}`);
        const total = artifactManager.getPiecesByArtifact(def.id).length;
        const collected = artifactManager.getCollectedPiecesByArtifact(def.id).length;
        if (collected >= total) {
          pushToast(`🎉 已集齐【${def.name}】所有 ${total} 片碎片！前往工作台拼合 →`, def.accentColor);
        }
      }
      setProgress(artifactManager.getProgress());
      forceRerender(n => n + 1);
    });

    const off2 = artifactManager.addArtifactRestoredListener((artifactId: string, def: ArtifactDefinition) => {
      flashEvent(`✨ 文物复原成功：${def.name} (+${def.points}分) ✨`);
      pushToast(`🏆 【${def.name}】成功复原！获得 ${def.points} 积分`, def.glowColor);

      const relatedLocs = terrainEngine.getArtifactLocations().filter(l => l.artifactId === artifactId);
      const locIds: string[] = [];
      relatedLocs.forEach(loc => {
        locIds.push(loc.id);
        sceneManager.markArtifactRestored(loc.id, artifactId);
        const sample = terrainEngine.sampleHeight(loc.x, loc.z);
        sceneManager.triggerRestoreParticles(loc.x, Math.max(sample.height, 0) + 1.3, loc.z, def.accentColor, 42);
      });
      if (locIds.length > 0) {
        setHighlightLocations(prev => {
          const s = new Set([...prev, ...locIds]);
          return Array.from(s).slice(-12);
        });
      }
      setProgress(artifactManager.getProgress());
      forceRerender(n => n + 1);
    });

    const off3 = artifactManager.addWorkbenchChangedListener(() => {
      setProgress(artifactManager.getProgress());
      forceRerender(n => n + 1);
    });

    const off4 = artifactManager.addAssembleAttemptListener((r) => {
      if (r.message) flashEvent(`🧩 ${r.message}`);
    });

    const off5 = sceneManager.addTerrainUpdateListener(() => {
      const discovered = terrainEngine.getDiscoveredArtifacts();
      discovered.forEach(loc => {
        if (!recentDiscoveredSet.current.has(loc.id)) {
          recentDiscoveredSet.current.add(loc.id);
          const def = ARTIFACT_DEFINITIONS[loc.artifactId];
          if (def) {
            const rarityTag = def.rarity === 'legendary' ? '🌟传说' : def.rarity === 'rare' ? '💎稀有' : '📦普通';
            pushToast(`${rarityTag} 发现文物：${def.name}！点击拾取`, def.accentColor);
          }
        }
      });
      forceRerender(n => n + 1);
    });

    return () => { off1(); off2(); off3(); off4(); off5(); };
  }, [flashEvent, pushToast]);

  useEffect(() => {
    (window as unknown as { __memoryStrataDebug?: unknown }).__memoryStrataDebug = {
      collectArtifact: (artifactId: string) => {
        const pieces = artifactManager.getPiecesByArtifact(artifactId);
        const firstLoc = terrainEngine.getArtifactLocations().find(l => l.artifactId === artifactId);
        pieces.forEach(p => {
          if (!p.collected) {
            artifactManager.collectPiece(p.id);
            if (firstLoc) terrainEngine.claimArtifactPiece(firstLoc.id, p.pieceIndex);
          }
        });
        return `Collected ${pieces.length} pieces for ${artifactId}`;
      },
      placeAllPieces: (artifactId: string) => {
        artifactManager.setActiveArtifact(artifactId);
        const pieces = artifactManager.getPiecesByArtifact(artifactId);
        pieces.forEach(p => {
          const correct = artifactManager.getCorrectScreenPosition(p);
          artifactManager.tryPlacePieceOnWorkbench(p.id, correct.x, correct.y);
        });
        return `Placed all for ${artifactId}, restored: ${artifactManager.isArtifactRestored(artifactId)}`;
      },
      getStatus: () => artifactManager.getProgress(),
      listDiscovered: () => terrainEngine.getDiscoveredArtifacts().map(l => l.artifactId)
    };
    return () => {
      const w = window as unknown as { __memoryStrataDebug?: unknown };
      delete w.__memoryStrataDebug;
    };
  }, []);

  const handleMined = useCallback((x: number, z: number) => {
    setMineCount(c => c + 1);
    const sample = terrainEngine.sampleHeight(x, z);
    const names = ['表土层', '文化层', '古土层', '岩石层', '基岩层'];
    if (sample.stratum > 0) {
      const layerStr = names[Math.min(sample.stratum, 4)];
      const depth = Math.round((terrainEngine.getHeightAt(x, z) > -500
        ? -terrainEngine.sampleHeight(x, z).height
        : 0) * 10) / 10;
      if (mineCount % 8 === 3) {
        flashEvent(`⛏ 挖掘至：${layerStr} (深度约 ${Math.abs(depth)}m)`);
      }
    }
    setProgress(artifactManager.getProgress());
  }, [flashEvent, mineCount]);

  const handleArtifactCollected = useCallback((locationId: string, artifactId: string, pieceId: string) => {
    const def = ARTIFACT_DEFINITIONS[artifactId];
    const collected = artifactManager.collectPiece(pieceId);
    if (collected && def) {
      flashEvent(`🎁 拾取【${def.name}】碎片成功`);
    }

    const loc = terrainEngine.getArtifactLocation(locationId);
    if (loc && loc.restored) {
      setHighlightLocations(prev => Array.from(new Set([...prev, locationId])).slice(-12));
    }
    setProgress(artifactManager.getProgress());
    forceRerender(n => n + 1);
  }, [flashEvent]);

  const p = progress;
  const topBarProgress = {
    collected: p.collectedPieces, totalPieces: p.totalPieces,
    restored: p.restoredArtifacts, totalArtifacts: p.totalArtifacts,
    points: p.totalPoints
  };

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#1a0f08' }}>
      <div style={{
        position: 'absolute', inset: 0,
        cursor: cursorMode === 'shovel' ? 'crosshair' : cursorMode === 'grab' ? 'grab' : 'default'
      }}>
        <TerrainCanvas
          onArtifactCollected={handleArtifactCollected}
          onMined={handleMined}
          highlightLocationIds={highlightLocations}
          cursorMode={cursorMode}
          setCursorMode={setCursorMode}
        />
      </div>

      <HUD
        cursorMode={cursorMode}
        setCursorMode={setCursorMode}
        mineCount={mineCount}
        lastEvent={lastEvent}
        topBarProgress={topBarProgress}
      />

      <StrataLegend />

      <MiningPanel />

      <ToastLayer toasts={toasts} />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeDown { from { opacity: 0; transform: translate(-50%, -14px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fadeOut { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
        @keyframes ping { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; } }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #8b6914; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #c9a86a; }
      `}</style>
    </div>
  );
};

export default App;
