import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TerrainCanvas } from './3d/TerrainCanvas';
import { MiningPanel } from './ui/MiningPanel';
import { artifactManager, ArtifactDefinition } from './artifact/artifactManager';
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
          letterSpacing: 0.3,
          animation: 'fadeDown 0.5s ease-out'
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
        maxWidth: 280,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.45)'
      }}>
        <div style={{ color: '#e8c88a', fontWeight: 700, marginBottom: 5, fontSize: 12 }}>
          📖 操作指南
        </div>
        <div>• <b style={{ color: '#c8a878' }}>左键点击/拖拽地表</b>：挖掘地层</div>
        <div>• <b style={{ color: '#c8a878' }}>右键拖动画面</b>：旋转观察视角</div>
        <div>• <b style={{ color: '#c8a878' }}>鼠标滚轮</b>：缩放场景</div>
        <div>• <b style={{ color: '#c8a878' }}>中键拖动</b>：平移视角</div>
        <div>• <b style={{ color: '#c8a878' }}>点击发光文物</b>：收入碎片</div>
        <div>• <b style={{ color: '#c8a878' }}>拖拽碎片到工作台</b>：拼合复原文物</div>
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
        minWidth: 200,
        animation: 'fadeIn 0.3s ease-out'
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
  const lastEventTimer = useRef<number | null>(null);
  const toastIdCounter = useRef(0);

  const pushToast = useCallback((text: string, color: string = '#c9a86a') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, { id, text, color }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
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
          pushToast(`🎉 已集齐【${def.name}】所有碎片！可前往工作台拼合`, def.accentColor);
        }
      }
      setProgress(artifactManager.getProgress());
    });
    const off2 = artifactManager.addArtifactRestoredListener((artifactId, def) => {
      flashEvent(`✨ 文物复原成功：${def.name} (+${def.points}分) ✨`);
      pushToast(`🏆 【${def.name}】已成功复原！获得 ${def.points} 积分`, def.glowColor);
      const allLocs = terrainEngine.getArtifactLocations().filter(l => l.artifactId === artifactId);
      const ids = allLocs.map(l => l.id);
      ids.forEach(id => {
        const loc = terrainEngine.getArtifactLocation(id);
        if (loc) {
          sceneManager.markArtifactRestored(id, artifactId);
          const sample = terrainEngine.sampleHeight(loc.x, loc.z);
          sceneManager.triggerRestoreParticles(loc.x, sample.height + 1.2, loc.z, def.accentColor, 40);
        }
      });
      setHighlightLocations(prev => Array.from(new Set([...prev, ...ids])).slice(-10));
      setProgress(artifactManager.getProgress());
    });
    const off3 = artifactManager.addWorkbenchChangedListener(() => {
      setProgress(artifactManager.getProgress());
    });
    return () => { off1(); off2(); off3(); };
  }, [flashEvent, pushToast]);

  const handleMined = useCallback((x: number, z: number) => {
    setMineCount(c => c + 1);
    const sample = terrainEngine.sampleHeight(x, z);
    const sname = terrainEngine.getStratumThicknessAt;
    const names = ['表土层', '文化层', '古土层', '岩石层', '基岩层'];
    const hitLocs = terrainEngine.getDiscoveredArtifacts().filter(l => {
      const dx = l.x - x, dz = l.z - z;
      return dx * dx + dz * dz < (2.5 + 1.5) ** 2;
    }).slice(-1);
    if (hitLocs.length > 0) {
      const loc = hitLocs[0];
      const def = artifactManager.getDefinition(loc.artifactId);
      if (def) {
        const rarity = def.rarity === 'legendary' ? '🌟传说级' : def.rarity === 'rare' ? '💎稀有' : '📦普通';
        pushToast(`${rarity} 发现文物：${def.name}！`, def.accentColor);
      }
    } else if (sample.stratum > 0 && mineCount % 7 === 3) {
      flashEvent(`⛏ 挖掘至：${names[Math.min(sample.stratum, 4)]}`);
    }
    setProgress(artifactManager.getProgress());
  }, [flashEvent, mineCount, pushToast]);

  const handleArtifactCollected = useCallback((locationId: string, artifactId: string, pieceId: string) => {
    const loc = terrainEngine.getArtifactLocation(locationId);
    if (loc && loc.restored) {
      setHighlightLocations(prev => Array.from(new Set([...prev, locationId])));
    }
    setProgress(artifactManager.getProgress());
  }, []);

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
