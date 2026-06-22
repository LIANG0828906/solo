import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapGrid, getHexCorners } from './MapModule/MapGrid';
import { MapInteraction, ViewportState } from './MapModule/MapInteraction';
import { RuneCollector, createRandomShard } from './RuneModule/RuneCollector';
import { RuneAltar, AltarResult } from './RuneModule/RuneAltar';
import { RuneAnimationManager } from './RuneModule/RuneAnimation';
import {
  RuneShard,
  AltarSlot,
  HexCell,
  MapNode,
  LightPillarAnimation,
  SecretEntranceAnimation,
  FogAnimation,
  CombinationFormula,
  SecretRealm,
  SAVE_KEY,
  RUNE_DEFINITIONS,
  COMBINATION_FORMULAS,
  HEX_SIZE,
  BACKPACK_CELL_SIZE,
  ALTAR_SLOT_RADIUS,
  SECRET_REALM_SIZE,
  SaveData,
} from './types';

const GRID_COLS = 10;
const GRID_ROWS = 8;

export default function App() {
  const mapGridRef = useRef<MapGrid>(new MapGrid(GRID_COLS, GRID_ROWS));
  const interactionRef = useRef<MapInteraction>(
    new MapInteraction(800, 600, GRID_COLS * HEX_SIZE * 1.8, GRID_ROWS * HEX_SIZE * 1.6)
  );
  const collectorRef = useRef<RuneCollector>(new RuneCollector());
  const altarRef = useRef<RuneAltar>(new RuneAltar(2));
  const animMgrRef = useRef<RuneAnimationManager>(new RuneAnimationManager());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [viewport, setViewport] = useState<ViewportState>({ offsetX: 50, offsetY: 50, scale: 1.0 });
  const [inventory, setInventory] = useState<RuneShard[]>(collectorRef.current.inventory);
  const [altarSlots, setAltarSlots] = useState<AltarSlot[]>(altarRef.current.slots);
  const [fogAnims, setFogAnims] = useState<FogAnimation[]>([]);
  const [pillars, setPillars] = useState<LightPillarAnimation[]>([]);
  const [secretEntrances, setSecretEntrances] = useState<SecretEntranceAnimation[]>([]);
  const [secretRealms, setSecretRealms] = useState<SecretRealm[]>([]);
  const [activeRealm, setActiveRealm] = useState<SecretRealm | null>(null);
  const [realmReward, setRealmReward] = useState<RuneShard | null>(null);
  const [realmParticles, setRealmParticles] = useState<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const [showRealmMap, setShowRealmMap] = useState(false);
  const [realmChestOpened, setRealmChestOpened] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [dragShardId, setDragShardId] = useState<string | null>(null);
  const [hoverShardId, setHoverShardId] = useState<string | null>(null);
  const [pressShardId, setPressShardId] = useState<string | null>(null);

  const mapWRef = useRef(800);
  const mapHRef = useRef(600);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  }, []);

  const saveGame = useCallback(() => {
    const data: SaveData = {
      runeInventory: collectorRef.current.inventory,
      activatedNodeIds: mapGridRef.current.nodes.filter(n => n.isActivated).map(n => n.id),
      revealedCellIds: mapGridRef.current.cells.filter(c => c.isRevealed).map(c => c.id),
      unlockedSecretIds: secretRealms.filter(s => s.isOpened).map(s => s.id),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }, [secretRealms]);

  const loadGame = useCallback(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const data: SaveData = JSON.parse(raw);
      if (data.runeInventory?.length) {
        collectorRef.current.loadState(data.runeInventory);
        setInventory([...collectorRef.current.inventory]);
      }
      if (data.activatedNodeIds?.length || data.revealedCellIds?.length) {
        mapGridRef.current.loadState(data.revealedCellIds || [], data.activatedNodeIds || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  useEffect(() => {
    const mgr = animMgrRef.current;
    mgr.start((now) => {
      mapGridRef.current.updateFogAnimations(now);
      const activePillars = mgr.updatePillars(now);
      setPillars([...activePillars]);
      drawCanvas(now);
    });
    return () => mgr.stop();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    mapWRef.current = rect.width;
    mapHRef.current = rect.height;
    interactionRef.current.updateMapSize(rect.width, rect.height);
  }, []);

  useEffect(() => {
    saveGame();
  }, [inventory, altarSlots, secretRealms, saveGame]);

  const drawCanvas = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vp = interactionRef.current.getState();
    const mapW = canvas.width;
    const mapH = canvas.height;

    ctx.clearRect(0, 0, mapW, mapH);

    const grad = ctx.createLinearGradient(0, mapH, 0, 0);
    grad.addColorStop(0, '#0d0d1a');
    grad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, mapW, mapH);

    ctx.save();
    ctx.translate(vp.offsetX, vp.offsetY);
    ctx.scale(vp.scale, vp.scale);

    const visibleCells = mapGridRef.current.getVisibleCells(vp.offsetX, vp.offsetY, mapW, mapH, vp.scale);

    for (const cell of visibleCells) {
      const corners = getHexCorners(cell.cx, cell.cy, HEX_SIZE);
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(74, 74, 106, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (cell.fogOpacity > 0.01) {
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
        ctx.closePath();
        ctx.fillStyle = `rgba(42, 42, 58, ${cell.fogOpacity})`;
        ctx.fill();
      }

      if (cell.isRevealed && cell.hasHiddenPath && cell.hiddenPathPos) {
        ctx.beginPath();
        ctx.arc(cell.hiddenPathPos.x, cell.hiddenPathPos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const nodes = mapGridRef.current.nodes;
    for (const node of nodes) {
      const pulse = Math.sin(now / 500 + node.cx) * 0.3 + 0.7;
      if (node.type === 'altar') {
        ctx.beginPath();
        ctx.arc(node.cx, node.cy, 20, 0, Math.PI * 2);
        if (node.isActivated) {
          ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
        } else {
          const flashAlpha = (Math.sin(now / 300) + 1) / 2;
          ctx.strokeStyle = `rgba(255, 170, 0, ${flashAlpha * 0.8})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = `rgba(30, 30, 48, ${pulse * 0.5})`;
        }
        ctx.fill();
        ctx.font = '14px MedievalSharp, serif';
        ctx.fillStyle = node.isActivated ? '#00ff88' : '#ffaa00';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.isActivated ? '✓' : '⛩', node.cx, node.cy);
      } else if (node.type === 'exploration') {
        ctx.beginPath();
        ctx.arc(node.cx, node.cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 100, 160, 0.5)';
        ctx.fill();
        ctx.font = '10px MedievalSharp, serif';
        ctx.fillStyle = '#8888cc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⛏', node.cx, node.cy);
      } else if (node.type === 'secret') {
        const rot = (now / 5000) * Math.PI * 2;
        ctx.save();
        ctx.translate(node.cx, node.cy);
        ctx.rotate(rot);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI / 2) * i;
          const px = Math.cos(a) * 14;
          const py = Math.sin(a) * 14;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#aa66ff';
        ctx.shadowColor = '#aa66ff';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    for (const pillar of pillars) {
      const elapsed = now - pillar.startTime;
      const t = Math.min(elapsed / pillar.duration, 1);
      const alpha = 1 - t * 0.8;
      const node = nodes.find(n => n.id === pillar.altarNodeId);
      if (!node) continue;
      const grad2 = ctx.createRadialGradient(node.cx, node.cy, 0, node.cx, node.cy, 60 + t * 40);
      grad2.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad2.addColorStop(0.5, `rgba(150, 180, 255, ${alpha * 0.5})`);
      grad2.addColorStop(1, `rgba(100, 150, 255, 0)`);
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, 60 + t * 40, 0, Math.PI * 2);
      ctx.fillStyle = grad2;
      ctx.fill();
    }

    for (const se of animMgrRef.current.getActiveSecretEntrances(now)) {
      const node = nodes.find(n => n.id === se.nodeId);
      if (!node) continue;
      const rot = (now / se.rotationSpeed) * Math.PI * 2;
      ctx.save();
      ctx.translate(node.cx, node.cy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.strokeStyle = '#aa88ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#aa88ff';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.font = '18px MedievalSharp, serif';
      ctx.fillStyle = '#cc99ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🗝', 0, 0);
      ctx.restore();
    }

    ctx.restore();

    setFogAnims([...mapGridRef.current.fogAnimations]);
  }, [pillars]);

  const handleMapMouseDown = useCallback((e: React.MouseEvent) => {
    interactionRef.current.onMouseDown(e);
  }, []);

  const handleMapMouseMove = useCallback((e: React.MouseEvent) => {
    const state = interactionRef.current.onMouseMove(e);
    if (state) setViewport({ ...state });
  }, []);

  const handleMapMouseUp = useCallback(() => {
    interactionRef.current.onMouseUp();
  }, []);

  const handleMapWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const state = interactionRef.current.onWheel(e, mx, my);
    setViewport({ ...state });
  }, []);

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left - viewport.offsetX) / viewport.scale;
    const my = (e.clientY - rect.top - viewport.offsetY) / viewport.scale;

    const nodes = mapGridRef.current.nodes;

    for (const node of nodes) {
      const dist = Math.hypot(mx - node.cx, my - node.cy);
      if (dist > 30) continue;

      if (node.type === 'exploration' && !node.isActivated) {
        node.isActivated = true;
        const luck = Math.random();
        if (luck < 0.6) {
          const shard = createRandomShard();
          if (collectorRef.current.addShard(shard)) {
            setInventory([...collectorRef.current.inventory]);
            showToast(`获得${RUNE_DEFINITIONS[shard.type].name}符文碎片！`);
          } else {
            showToast('背包已满，无法获取更多同类碎片');
          }
        } else {
          showToast('探索完毕，未发现碎片');
        }
        return;
      }

      if (node.type === 'secret' && node.isActivated) {
        const realm = secretRealms.find(s => s.entryNodeId === node.id);
        if (realm && !realm.isOpened) {
          setActiveRealm(realm);
          setShowRealmMap(true);
          setRealmChestOpened(false);
          setRealmReward(null);
          setRealmParticles([]);
        } else if (realm?.isOpened) {
          showToast('此秘境已被探索');
        }
        return;
      }
    }
  }, [viewport, secretRealms, showToast]);

  const handleDragStart = useCallback((shardId: string) => {
    setDragShardId(shardId);
  }, []);

  const handleDropOnSlot = useCallback((slotId: number) => {
    if (!dragShardId) return;
    const shard = collectorRef.current.getShardById(dragShardId);
    if (!shard) return;
    const currentSlotShard = altarRef.current.slots.find(s => s.id === slotId)?.shard;
    if (currentSlotShard) {
      collectorRef.current.addShard(currentSlotShard);
    }
    const removed = collectorRef.current.removeShard(dragShardId);
    if (!removed) return;
    altarRef.current.insertShard(slotId, removed);
    setInventory([...collectorRef.current.inventory]);
    setAltarSlots([...altarRef.current.slots]);
    setDragShardId(null);
  }, [dragShardId]);

  const handleRemoveFromSlot = useCallback((slotId: number) => {
    const shard = altarRef.current.removeShardFromSlot(slotId);
    if (shard) {
      collectorRef.current.addShard(shard);
      setInventory([...collectorRef.current.inventory]);
      setAltarSlots([...altarRef.current.slots]);
    }
  }, []);

  const handleActivate = useCallback(() => {
    const result: AltarResult = altarRef.current.activate();
    if (!result.success) {
      showToast('组合无效，请尝试其他符文搭配');
      const returned = altarRef.current.clearAllSlots();
      for (const s of returned) collectorRef.current.addShard(s);
      setInventory([...collectorRef.current.inventory]);
      setAltarSlots([...altarRef.current.slots]);
      return;
    }

    const formula = result.formula!;
    showToast(`激活${formula.resultName}！区域迷雾消散！`);

    const now = performance.now();
    const altarNode = mapGridRef.current.nodes.find(n =>
      n.type === 'altar' && !n.isActivated &&
      n.runeTypesNeeded &&
      altarMatchesFormula(n.runeTypesNeeded, formula.inputs)
    );

    if (altarNode) {
      mapGridRef.current.activateAltarNode(altarNode.id, now);

      animMgrRef.current.addPillar({
        altarNodeId: altarNode.id,
        cx: altarNode.cx,
        cy: altarNode.cy,
        startTime: now,
        duration: 2000,
        color: formula.resultColor,
      });

      for (const cellId of altarNode.connectedCellIds) {
        const cell = mapGridRef.current.cells.find(c => c.id === cellId);
        if (cell && cell.hasSecretEntrance && !cell.isRevealed) {
          // already handled by reveal
        }
      }

      const hasSecretNear = altarNode.connectedCellIds.some(cid => {
        const c = mapGridRef.current.cells.find(cc => cc.id === cid);
        return c?.hasSecretEntrance;
      });

      if (hasSecretNear) {
        const secretNode = mapGridRef.current.nodes.find(
          n => n.type === 'secret' && !n.isActivated &&
            altarNode.connectedCellIds.some(cid => n.connectedCellIds.includes(cid))
        );
        if (secretNode) {
          secretNode.isActivated = true;
          animMgrRef.current.addSecretEntrance({
            nodeId: secretNode.id,
            cx: secretNode.cx,
            cy: secretNode.cy,
            startTime: now,
            rotationSpeed: 5000,
          });

          const reward = createRandomShard();
          const newRealm: SecretRealm = {
            id: `realm_${secretNode.id}`,
            entryNodeId: secretNode.id,
            mapSize: SECRET_REALM_SIZE,
            bgColor: '#0a0a1a',
            reward,
            isOpened: false,
          };
          setSecretRealms(prev => [...prev, newRealm]);
          setSecretEntrances([...animMgrRef.current.secretEntrances]);
        }
      }
    } else {
      const unactivated = mapGridRef.current.nodes.filter(n => n.type === 'altar' && !n.isActivated);
      if (unactivated.length > 0) {
        const target = unactivated[0];
        mapGridRef.current.activateAltarNode(target.id, now);
        animMgrRef.current.addPillar({
          altarNodeId: target.id,
          cx: target.cx,
          cy: target.cy,
          startTime: now,
          duration: 2000,
          color: formula.resultColor,
        });
      }
    }

    setAltarSlots([...altarRef.current.slots]);
  }, [showToast]);

  const handleOpenChest = useCallback(() => {
    if (!activeRealm || realmChestOpened) return;
    setRealmChestOpened(true);
    if (activeRealm.reward) {
      const reward = activeRealm.reward;
      collectorRef.current.addShard(reward);
      setInventory([...collectorRef.current.inventory]);
      setRealmReward(reward);

      setSecretRealms(prev =>
        prev.map(s => s.id === activeRealm.id ? { ...s, isOpened: true } : s)
      );

      const particles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
          x: 100,
          y: 100,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
        });
      }
      setRealmParticles(particles);
      showToast(`获得${RUNE_DEFINITIONS[reward.type].name}高级符文碎片！`);
    }
  }, [activeRealm, realmChestOpened, showToast]);

  useEffect(() => {
    if (realmParticles.length === 0) return;
    const timer = setInterval(() => {
      setRealmParticles(prev => {
        const next = prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.02 }))
          .filter(p => p.life > 0);
        if (next.length === 0) clearInterval(timer);
        return next;
      });
    }, 16);
    return () => clearInterval(timer);
  }, [realmParticles.length > 0]);

  const handleResizeMap = useCallback(() => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    mapWRef.current = rect.width;
    mapHRef.current = rect.height;
    interactionRef.current.updateMapSize(rect.width, rect.height);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }, []);

  useEffect(() => {
    handleResizeMap();
    window.addEventListener('resize', handleResizeMap);
    return () => window.removeEventListener('resize', handleResizeMap);
  }, [handleResizeMap]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      fontFamily: "'MedievalSharp', serif",
      overflow: 'hidden',
    }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '70%',
          height: '100%',
          position: 'relative',
          cursor: 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseUp={handleMapMouseUp}
        onMouseLeave={handleMapMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={mapWRef.current}
          height={mapHRef.current}
          style={{ width: '100%', height: '100%', display: 'block' }}
          onWheel={handleMapWheel}
          onClick={handleMapClick}
        />
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          color: '#6a6a8a',
          fontSize: 12,
          pointerEvents: 'none',
        }}>
          缩放: {viewport.scale.toFixed(1)}x | 拖拽平移 | 点击探索点
        </div>
      </div>

      <div style={{
        width: '30%',
        height: '100%',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #12121f 100%)',
        borderLeft: '1px solid #2a2a4a',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: '#555 #1a1a2e',
      } as React.CSSProperties}>
        <div style={{
          background: '#1e1e30',
          borderRadius: 12,
          margin: 12,
          padding: 16,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
        }}>
          <h3 style={{
            color: '#ffaa00',
            fontSize: 16,
            marginBottom: 12,
            textAlign: 'center',
            letterSpacing: 2,
          }}>⛩ 祭坛</h3>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 12,
          }}>
            {altarSlots.map(slot => (
              <div
                key={slot.id}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDropOnSlot(slot.id)}
                onClick={() => slot.shard && handleRemoveFromSlot(slot.id)}
                style={{
                  width: ALTAR_SLOT_RADIUS * 2 + 10,
                  height: ALTAR_SLOT_RADIUS * 2 + 10,
                  borderRadius: '50%',
                  border: slot.shard
                    ? `2px solid ${slot.shard.color}`
                    : '2px dashed #ffaa00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: slot.shard
                    ? `rgba(${hexToRgb(slot.shard.color)}, 0.15)`
                    : 'rgba(26, 26, 46, 0.6)',
                  cursor: slot.shard ? 'pointer' : 'default',
                  animation: !slot.shard ? 'altarPulse 1.5s ease-in-out infinite' : 'none',
                  fontSize: 22,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                {slot.shard ? slot.shard.symbol : ''}
              </div>
            ))}
          </div>

          <div style={{
            color: '#8888aa',
            fontSize: 11,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            拖拽碎片到插槽 · 点击插槽取回
          </div>

          <button
            onClick={handleActivate}
            style={{
              width: '100%',
              padding: '8px 0',
              background: 'linear-gradient(135deg, #ffaa00 0%, #ff6600 100%)',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: 8,
              fontFamily: "'MedievalSharp', serif",
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 'bold',
              letterSpacing: 1,
            }}
          >
            激活祭坛
          </button>

          <div style={{
            marginTop: 10,
            maxHeight: 100,
            overflowY: 'auto',
            fontSize: 10,
            color: '#6a6a8a',
            scrollbarWidth: 'thin' as any,
            scrollbarColor: '#555 #1e1e30',
          }}>
            {COMBINATION_FORMULAS.map((f, i) => (
              <div key={i} style={{ padding: '2px 0' }}>
                {f.inputs.map(t => RUNE_DEFINITIONS[t].symbol).join(' + ')} → {f.resultName}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          margin: '0 12px',
          padding: 16,
          background: '#1e1e30',
          borderRadius: 12,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin' as any,
          scrollbarColor: '#555 #1e1e30',
        }}>
          <h3 style={{
            color: '#aa88ff',
            fontSize: 16,
            marginBottom: 12,
            textAlign: 'center',
            letterSpacing: 2,
          }}>🎒 符文背包</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, ${BACKPACK_CELL_SIZE}px)`,
            gap: 6,
            justifyContent: 'center',
          }}>
            {inventory.map(shard => (
              <div
                key={shard.id}
                draggable
                onDragStart={() => handleDragStart(shard.id)}
                onMouseEnter={() => setHoverShardId(shard.id)}
                onMouseLeave={() => { setHoverShardId(null); setPressShardId(null); }}
                onMouseDown={() => setPressShardId(shard.id)}
                onMouseUp={() => setPressShardId(null)}
                style={{
                  width: BACKPACK_CELL_SIZE,
                  height: BACKPACK_CELL_SIZE,
                  background: 'rgba(26, 26, 46, 0.8)',
                  border: `2px solid ${hoverShardId === shard.id ? '#aa88ff' : '#3a3a5e'}`,
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  transform: pressShardId === shard.id
                    ? 'scale(0.95)'
                    : hoverShardId === shard.id
                      ? 'translateY(-2px)'
                      : 'none',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                  fontSize: 24,
                  position: 'relative',
                }}
              >
                <span>{shard.symbol}</span>
                <span style={{
                  fontSize: 9,
                  color: shard.color,
                  marginTop: 2,
                }}>
                  {RUNE_DEFINITIONS[shard.type].name}
                </span>
              </div>
            ))}

            {Array.from({ length: Math.max(0, 12 - inventory.length) }).map((_, i) => (
              <div
                key={`empty_${i}`}
                style={{
                  width: BACKPACK_CELL_SIZE,
                  height: BACKPACK_CELL_SIZE,
                  background: 'rgba(26, 26, 46, 0.4)',
                  border: '2px dashed #2a2a4a',
                  borderRadius: 8,
                }}
              />
            ))}
          </div>
        </div>

        {toastMsg && (
          <div style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30, 30, 48, 0.95)',
            color: '#ffcc44',
            padding: '8px 24px',
            borderRadius: 8,
            fontSize: 14,
            fontFamily: "'MedievalSharp', serif",
            border: '1px solid #ffaa00',
            zIndex: 1000,
            pointerEvents: 'none',
          }}>
            {toastMsg}
          </div>
        )}
      </div>

      {showRealmMap && activeRealm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRealmMap(false);
              setActiveRealm(null);
            }
          }}
        >
          <div style={{
            width: SECRET_REALM_SIZE + 40,
            height: SECRET_REALM_SIZE + 80,
            background: '#0a0a1a',
            borderRadius: 12,
            border: '2px solid #aa66ff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              color: '#cc99ff',
              fontSize: 14,
              marginBottom: 8,
              letterSpacing: 2,
            }}>秘境</div>

            <div style={{
              width: SECRET_REALM_SIZE,
              height: SECRET_REALM_SIZE,
              background: '#0a0a1a',
              position: 'relative',
              border: '1px solid #2a2a4a',
              borderRadius: 8,
            }}>
              <svg width={SECRET_REALM_SIZE} height={SECRET_REALM_SIZE} style={{ position: 'absolute', top: 0, left: 0 }}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <circle
                    key={i}
                    cx={Math.random() * SECRET_REALM_SIZE}
                    cy={Math.random() * SECRET_REALM_SIZE}
                    r={0.5 + Math.random()}
                    fill={`rgba(200,200,255,${0.2 + Math.random() * 0.5})`}
                  />
                ))}
              </svg>

              <div
                onClick={handleOpenChest}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) scale(${realmChestOpened ? 1.2 : 1})`,
                  fontSize: realmChestOpened ? 40 : 36,
                  cursor: realmChestOpened ? 'default' : 'pointer',
                  transition: 'transform 0.3s ease',
                  zIndex: 2,
                }}
              >
                {realmChestOpened ? '🎁' : '📦'}
              </div>

              {realmParticles.map((p, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: p.x,
                    top: p.y,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: `rgba(255, 215, 0, ${p.life})`,
                    boxShadow: `0 0 6px rgba(255, 215, 0, ${p.life})`,
                    pointerEvents: 'none',
                    zIndex: 3,
                  }}
                />
              ))}

              {realmReward && (
                <div style={{
                  position: 'absolute',
                  top: '70%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: realmReward.color,
                  fontSize: 14,
                  textAlign: 'center',
                  zIndex: 2,
                }}>
                  <div style={{ fontSize: 24 }}>{realmReward.symbol}</div>
                  <div style={{ fontSize: 10, marginTop: 2 }}>
                    {RUNE_DEFINITIONS[realmReward.type].name}符文
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => { setShowRealmMap(false); setActiveRealm(null); }}
              style={{
                marginTop: 8,
                padding: '4px 16px',
                background: '#2a2a4a',
                color: '#aa88ff',
                border: '1px solid #555',
                borderRadius: 6,
                fontFamily: "'MedievalSharp', serif",
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              离开秘境
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes altarPulse {
          0%, 100% { border-color: rgba(255, 170, 0, 0.4); }
          50% { border-color: rgba(255, 170, 0, 1); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #1a1a2e; }
        ::-webkit-scrollbar-thumb { background: #555; border-radius: 2px; }
      `}</style>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function altarMatchesFormula(needed: string[], formulaInputs: string[]): boolean {
  const sorted1 = [...needed].sort();
  const sorted2 = [...formulaInputs].sort();
  return sorted1.length === sorted2.length && sorted1.every((v, i) => v === sorted2[i]);
}
