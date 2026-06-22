import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlantStore } from '../store/plantStateStore';
import { useGeneWeightsStore, createChildFromBreeding, registerPlantGenes } from '../store/geneWeightsStore';
import { useLogStore } from '../store/logStore';
import { GENE_KEYS, GENE_LABELS } from '../core/types';
import type { GeneWeights, GrowthStage } from '../core/types';
import { createDefaultGeneWeights } from '../core/geneWeights';

const STAGE_LABELS: Record<GrowthStage, string> = {
  seed: '种子萌发',
  vegetative: '营养生长',
  reproductive: '生殖生长',
  fruiting: '果实成熟',
};

const STAGE_COLORS: Record<GrowthStage, string> = {
  seed: '#4FC3F7',
  vegetative: '#81C784',
  reproductive: '#F06292',
  fruiting: '#FF8A65',
};

const RADAR_SIZE = 220;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = RADAR_SIZE / 2 - 30;

function geneAngle(idx: number): [number, number] {
  const angle = (Math.PI * 2 * idx) / GENE_KEYS.length - Math.PI / 2;
  return [Math.cos(angle), Math.sin(angle)];
}

function polarToXY(value: number, idx: number): [number, number] {
  const [cx, cy] = geneAngle(idx);
  return [
    RADAR_CENTER + cx * RADAR_RADIUS * value,
    RADAR_CENTER + cy * RADAR_RADIUS * value,
  ];
}

interface RadarProps {
  weights: GeneWeights;
  selectedId: string;
  onDragEnd: (key: keyof GeneWeights, value: number) => void;
}

function GeneRadarChart({ weights, onDragEnd, selectedId }: RadarProps) {
  const [hoverKey, setHoverKey] = useState<keyof GeneWeights | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragKeyRef = useRef<keyof GeneWeights | null>(null);
  const startValRef = useRef(0);
  const startPosRef = useRef<[number, number]>([0, 0]);

  const points = useMemo(() => {
    return GENE_KEYS.map((k, i) => {
      const [x, y] = polarToXY(weights[k], i);
      return { key: k, x, y, value: weights[k] };
    });
  }, [weights]);

  const polygonStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  const getSVGCoord = (clientX: number, clientY: number): [number, number] | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const sx = (clientX - rect.left) * (RADAR_SIZE / rect.width);
    const sy = (clientY - rect.top) * (RADAR_SIZE / rect.height);
    return [sx, sy];
  };

  const valueFromCoord = (sx: number, sy: number, keyIdx: number): number => {
    const [dx, dy] = geneAngle(keyIdx);
    const vx = sx - RADAR_CENTER;
    const vy = sy - RADAR_CENTER;
    const proj = (vx * dx + vy * dy) / RADAR_RADIUS;
    return Math.max(0, Math.min(1, proj));
  };

  const handlePointerDown = (e: React.PointerEvent, key: keyof GeneWeights, idx: number) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragKeyRef.current = key;
    const p = getSVGCoord(e.clientX, e.clientY);
    if (p) {
      startPosRef.current = p;
      startValRef.current = valueFromCoord(p[0], p[1], idx);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragKeyRef.current) return;
    const key = dragKeyRef.current;
    const idx = GENE_KEYS.indexOf(key);
    const p = getSVGCoord(e.clientX, e.clientY);
    if (!p) return;
    const v = valueFromCoord(p[0], p[1], idx);
    onDragEnd(key, v);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragKeyRef.current) return;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    dragKeyRef.current = null;
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', position: 'relative',
      userSelect: 'none',
    }}>
      <svg
        ref={svgRef}
        width={RADAR_SIZE}
        height={RADAR_SIZE}
        style={{ touchAction: 'none' }}
      >
        <defs>
          <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1B5E20" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        <circle cx={RADAR_CENTER} cy={RADAR_CENTER} r={RADAR_RADIUS} fill="url(#radar-bg)" />
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <circle
            key={r}
            cx={RADAR_CENTER} cy={RADAR_CENTER} r={RADAR_RADIUS * r}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 3"
          />
        ))}

        {GENE_KEYS.map((_, i) => {
          const [ex, ey] = polarToXY(1, i);
          return (
            <line
              key={i}
              x1={RADAR_CENTER} y1={RADAR_CENTER} x2={ex} y2={ey}
              stroke="rgba(255,255,255,0.12)"
            />
          );
        })}

        <polygon
          points={polygonStr}
          fill="rgba(76, 175, 80, 0.35)"
          stroke="#4CAF50"
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.6))' }}
        />

        {points.map((p, idx) => (
          <g key={p.key}>
            <line
              x1={RADAR_CENTER} y1={RADAR_CENTER} x2={p.x} y2={p.y}
              stroke="#4CAF50" strokeOpacity={0.4} strokeWidth={1}
            />
            <circle
              cx={p.x} cy={p.y} r={hoverKey === p.key ? 8 : 6}
              fill="#FFFFFF"
              stroke="#4CAF50" strokeWidth={2}
              style={{ cursor: 'grab', transition: 'r 0.15s' }}
              onPointerDown={(e) => handlePointerDown(e, p.key, idx)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerEnter={() => setHoverKey(p.key)}
              onPointerLeave={() => setHoverKey(null)}
            />
          </g>
        ))}

        {GENE_KEYS.map((k, i) => {
          const [lx, ly] = polarToXY(1.18, i);
          const isHover = hoverKey === k;
          return (
            <g key={`l-${k}`}>
              <text
                x={lx} y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isHover ? '#4CAF50' : '#BDBDBD'}
                fontSize={11}
                fontWeight={isHover ? 700 : 500}
                style={{ pointerEvents: 'none', transition: 'all 0.15s' }}
              >
                {GENE_LABELS[k]}
              </text>
              <text
                x={lx} y={ly + 13}
                textAnchor="middle"
                fill="#90A4AE"
                fontSize={10}
                fontFamily="monospace"
                style={{ pointerEvents: 'none' }}
              >
                {(weights[k] * 100).toFixed(0)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface BreedDialogProps {
  open: boolean;
  onClose: () => void;
  currentId: string;
  plants: { id: string; label: string; color: string }[];
  onSelect: (motherId: string) => void;
}

function BreedDialog({ open, onClose, currentId, plants, onSelect }: BreedDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#2C2C2C', borderRadius: 8, padding: 20,
              minWidth: 280, maxWidth: 360,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{
              color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 12,
            }}>
              🌱 选择另一株植物作为亲本
            </div>
            <div style={{ color: '#90A4AE', fontSize: 12, marginBottom: 14 }}>
              当前作为<span style={{ color: TAG_COLOR_DISP.P }}>父本（P）</span>：
              <span style={{ fontFamily: 'monospace', marginLeft: 6 }}>{currentId}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {plants
                .filter((p) => p.id !== currentId)
                .map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${p.color}55`,
                      color: '#E0E0E0', cursor: 'pointer',
                      textAlign: 'left', fontSize: 13,
                    }}
                  >
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: p.color, display: 'inline-block',
                    }} />
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.id}</span>
                    <span style={{ color: '#90A4AE', fontSize: 11 }}>
                      作为<span style={{ color: TAG_COLOR_DISP.M, margin: '0 4px' }}>母本（M）</span>
                    </span>
                  </motion.button>
                ))}
              {plants.filter((p) => p.id !== currentId).length === 0 && (
                <div style={{ color: '#78909C', fontSize: 12, padding: 16, textAlign: 'center' }}>
                  没有其他植物可供杂交
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 14, width: '100%', padding: '8px',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                color: '#90A4AE', borderRadius: 4, cursor: 'pointer', fontSize: 12,
              }}
            >
              取消
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const TAG_COLOR_DISP = { P: '#E91E63', M: '#2196F3', F: '#4CAF50' };

export function GenePanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [breedOpen, setBreedOpen] = useState(false);

  const plants = usePlantStore((s) => s.plants);
  const order = usePlantStore((s) => s.order);
  const selectedId = usePlantStore((s) => s.selectedId);
  const selectPlant = usePlantStore((s) => s.selectPlant);
  const addPlant = usePlantStore((s) => s.addPlant);

  const geneStore = useGeneWeightsStore((s) => s.plants);
  const setGene = useGeneWeightsStore((s) => s.setPlantGene);
  const mutatePlant = useGeneWeightsStore((s) => s.mutatePlant);

  const addLog = useLogStore((s) => s.addLog);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const selectedPlant = selectedId ? plants[selectedId] : null;
  const currentGenes: GeneWeights = selectedId
    ? (geneStore[selectedId] ?? selectedPlant?.geneWeights ?? createDefaultGeneWeights())
    : createDefaultGeneWeights();

  const stageProgress = selectedPlant
    ? Math.round(selectedPlant.state.stageProgress * 100)
    : 0;

  const handleBreed = (motherId: string) => {
    if (!selectedId) return;
    const childGenes = createChildFromBreeding(selectedId, motherId);
    const childId = addPlant({
      geneWeights: childGenes,
      tagRole: 'filial',
      parentIds: [selectedId, motherId],
      initialGrowthTime: 0,
    });
    if (childId) {
      registerPlantGenes(childId, childGenes);
      addLog(
        'breed',
        `父本${selectedId}与母本${motherId}杂交，子代${childId}诞生，主茎高度权重${childGenes.stemHeight.toFixed(2)}`,
        {
          parentA: selectedId, parentB: motherId, child: childId,
          genes: childGenes,
        }
      );
      selectPlant(childId);
    }
    setBreedOpen(false);
  };

  const handleMutate = () => {
    if (!selectedId) return;
    const before = { ...currentGenes };
    mutatePlant(selectedId);
    const after = geneStore[selectedId];
    addLog(
      'breed',
      `植物${selectedId}发生随机变异`,
      { before, after }
    );
  };

  const plantListForBreed = order.map((id) => ({
    id,
    label: id,
    color: plants[id]?.tagColor ?? '#888',
  }));

  const progressSection = selectedPlant ? (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 6,
      }}>
        <span style={{
          color: STAGE_COLORS[selectedPlant.state.stage],
          fontSize: 13, fontWeight: 600,
        }}>
          ● {STAGE_LABELS[selectedPlant.state.stage]}
        </span>
        <span style={{ color: '#90A4AE', fontSize: 11, fontFamily: 'monospace' }}>
          {stageProgress}%
        </span>
      </div>
      <div style={{
        height: 6, background: 'rgba(255,255,255,0.06)',
        borderRadius: 3, overflow: 'hidden',
      }}>
        <motion.div
          animate={{ width: `${stageProgress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${STAGE_COLORS[selectedPlant.state.stage]}, ${STAGE_COLORS[selectedPlant.state.stage]}88)`,
            borderRadius: 3,
          }}
        />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 8, color: '#78909C', fontSize: 10,
      }}>
        <span>高度: {selectedPlant.state.currentHeight.toFixed(1)}u</span>
        <span>生长: {selectedPlant.growthTime.toFixed(1)}s</span>
      </div>
    </div>
  ) : null;

  const content = (
    <>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
      }}>
        <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
          🧬 基因编辑
        </div>
        {selectedPlant && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 8px', borderRadius: 4,
            background: `${selectedPlant.tagColor}22`,
            border: `1px solid ${selectedPlant.tagColor}55`,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: selectedPlant.tagColor,
            }} />
            <span style={{
              color: '#fff', fontSize: 12, fontFamily: 'monospace',
              fontWeight: 600,
            }}>
              {selectedPlant.id}
            </span>
          </div>
        )}
      </div>

      {selectedPlant ? (
        <>
          {progressSection}

          <GeneRadarChart
            key={selectedId}
            weights={currentGenes}
            selectedId={selectedId ?? ''}
            onDragEnd={(k, v) => {
              if (selectedId) setGene(selectedId, k, v);
            }}
          />

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            marginTop: 18,
          }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setBreedOpen(true)}
              disabled={order.length < 2}
              style={{
                padding: '10px', borderRadius: 6, border: 'none',
                background: order.length < 2 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#E91E63,#2196F3)',
                color: order.length < 2 ? '#78909C' : '#fff',
                fontSize: 12, fontWeight: 600, cursor: order.length < 2 ? 'not-allowed' : 'pointer',
                boxShadow: order.length < 2 ? 'none' : '0 4px 12px rgba(33,150,243,0.25)',
              }}
            >
              🌸 杂交育种
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleMutate}
              style={{
                padding: '10px', borderRadius: 6, border: 'none',
                background: 'linear-gradient(135deg,#7B1FA2,#FF6F00)',
                color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(156, 39, 176, 0.25)',
              }}
            >
              ⚡ 随机变异
            </motion.button>
          </div>
        </>
      ) : (
        <div style={{
          padding: 40, textAlign: 'center', color: '#78909C', fontSize: 12,
        }}>
          点击场景中的植物查看基因信息
        </div>
      )}

      <BreedDialog
        open={breedOpen}
        onClose={() => setBreedOpen(false)}
        currentId={selectedId ?? ''}
        plants={plantListForBreed}
        onSelect={handleBreed}
      />
    </>
  );

  if (isMobile) {
    return (
      <>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed', top: 56, right: 12, zIndex: 40,
            width: 40, height: 40, borderRadius: '50%',
            background: '#2C2C2C', color: '#fff', border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)', cursor: 'pointer',
            fontSize: 18,
          }}
        >
          🧬
        </motion.button>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 100,
              }}
              onClick={() => setMobileOpen(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute', top: 0, right: 0, bottom: 0,
                  width: '85%', maxWidth: 360,
                  background: '#2C2C2C', padding: 20, overflowY: 'auto',
                  borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
                }}
              >
                {content}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <AnimatePresence initial={false}>
      <motion.div
        initial={false}
        animate={{
          x: collapsed ? 320 : 0,
          width: collapsed ? 0 : 300,
          opacity: collapsed ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed', top: 52, right: 12, bottom: 12,
          background: 'rgba(44, 44, 44, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 8, padding: collapsed ? 0 : 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          overflow: collapsed ? 'visible' : 'auto',
          zIndex: 30,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', top: 8, left: collapsed ? -40 : -40,
            width: 32, height: 32, borderRadius: '50%',
            background: collapsed ? '#2C2C2C' : 'rgba(255,255,255,0.08)',
            border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: collapsed ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {collapsed ? '🧬' : '▶'}
        </motion.button>
        {!collapsed && content}
      </motion.div>
    </AnimatePresence>
  );
}
