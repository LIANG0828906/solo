import React, { memo, useMemo } from 'react';
import type { GameState, Material, Recipe } from './types';
import { CHAOS_MATERIAL_ID } from './data/initialRecipes';

interface RecipeGraphProps {
  state: GameState;
  onSelectNode: (materialId: string | null) => void;
}

interface TreeNode {
  materialId: string;
  level: number;
  row: number;
  rowCount: number;
  parentIds: string[];
}

const CANVAS_W = 300;
const CANVAS_H = 400;
const NODE_R = 25;
const LEVEL_H = 72;
const MARGIN_TOP = 50;
const MARGIN_LEFT = 20;

function buildTree(
  discoveredRecipeIds: string[],
  recipes: Record<string, Recipe>,
  discoveredMaterialIds: string[]
): TreeNode[] {
  const derivedBy: Record<string, string[]> = {};
  discoveredRecipeIds.forEach((rid) => {
    const r = recipes[rid];
    if (!r) return;
    if (!derivedBy[r.output]) derivedBy[r.output] = [];
    r.input.forEach((pid) => {
      if (!derivedBy[r.output]!.includes(pid)) derivedBy[r.output]!.push(pid);
    });
  });

  const levels: string[][] = [[CHAOS_MATERIAL_ID]];
  const assigned: Set<string> = new Set([CHAOS_MATERIAL_ID]);
  let changed = true;
  let guard = 0;
  while (changed && guard < 20) {
    changed = false;
    guard++;
    const nextLevel: string[] = [];
    const prevIds = levels[levels.length - 1];
    prevIds.forEach((mid) => {
      discoveredMaterialIds.forEach((cand) => {
        if (assigned.has(cand)) return;
        const parents = derivedBy[cand] || [];
        if (parents.length === 0) return;
        const inPrevLevel = parents.some((p) => prevIds.includes(p) || assigned.has(p));
        if (inPrevLevel) {
          assigned.add(cand);
          if (!nextLevel.includes(cand)) nextLevel.push(cand);
          changed = true;
        }
      });
    });
    if (nextLevel.length > 0) {
      levels.push(nextLevel);
    } else {
      const remaining = discoveredMaterialIds.filter(
        (id) => !assigned.has(id) && id !== CHAOS_MATERIAL_ID
      );
      if (remaining.length > 0) {
        levels.push(remaining);
        remaining.forEach((id) => assigned.add(id));
        changed = true;
      }
    }
  }

  const nodes: TreeNode[] = [];
  levels.forEach((row, levelIdx) => {
    row.forEach((mid, rowIdx) => {
      const parents = derivedBy[mid] || (mid === CHAOS_MATERIAL_ID ? [] : [CHAOS_MATERIAL_ID]);
      nodes.push({
        materialId: mid,
        level: levelIdx,
        row: rowIdx,
        rowCount: row.length,
        parentIds: parents,
      });
    });
  });
  return nodes;
}

function layoutNode(n: TreeNode, w: number): { x: number; y: number } {
  const usableW = w - MARGIN_LEFT - 20;
  const xStep = usableW / Math.max(n.rowCount, 1);
  const x = MARGIN_LEFT + xStep * (n.row + 0.5);
  const y = MARGIN_TOP + n.level * LEVEL_H;
  return { x, y };
}

const RecipeGraphComponent: React.FC<RecipeGraphProps> = ({ state, onSelectNode }) => {
  const { recipes, materials, discoveredRecipeIds, discoveredMaterialIds, selectedGraphNodeId } = state;

  const nodes = useMemo(
    () => buildTree(discoveredRecipeIds, recipes, discoveredMaterialIds),
    [discoveredRecipeIds, recipes, discoveredMaterialIds]
  );

  const nodePositions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => {
      map[n.materialId] = layoutNode(n, CANVAS_W);
    });
    return map;
  }, [nodes]);

  const selectedNode = selectedGraphNodeId ? nodes.find((n) => n.materialId === selectedGraphNodeId) : null;
  const selectedMat: Material | undefined = selectedGraphNodeId ? materials[selectedGraphNodeId] : undefined;

  const selectedParents = selectedNode
    ? selectedNode.parentIds.map((pid) => materials[pid]).filter(Boolean) as Material[]
    : [];
  const selectedRecipes = discoveredRecipeIds
    .map((rid) => recipes[rid])
    .filter(
      (r): r is Recipe =>
        !!r &&
        (r.output === selectedGraphNodeId ||
          r.input.includes(selectedGraphNodeId || ''))
    );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🌳 配方树</h2>
        <span style={styles.count}>{discoveredMaterialIds.length} 节点</span>
      </div>
      <div style={styles.canvasWrap}>
        <svg width={CANVAS_W} height={CANVAS_H} style={styles.svg}>
          <defs>
            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7a7aaa" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#5a5a8a" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          {nodes.map((n) => {
            const pos = nodePositions[n.materialId];
            if (!pos) return null;
            return n.parentIds.map((pid, i) => {
              const parent = nodePositions[pid];
              if (!parent) return null;
              const startX = parent.x;
              const startY = parent.y + NODE_R;
              const endX = pos.x;
              const endY = pos.y - NODE_R;
              const midY = (startY + endY) / 2;
              const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
              const isHighlighted =
                selectedGraphNodeId === n.materialId || selectedGraphNodeId === pid;
              return (
                <path
                  key={`${pid}-${n.materialId}-${i}`}
                  d={d}
                  stroke={isHighlighted ? '#ffd54f' : 'url(#edgeGradient)'}
                  strokeWidth={isHighlighted ? 2.5 : 2}
                  fill="none"
                  opacity={isHighlighted ? 0.95 : 0.6}
                  style={{
                    transition: 'stroke 0.3s, stroke-width 0.3s, opacity 0.3s',
                  }}
                />
              );
            });
          })}
          {nodes.map((n) => {
            const pos = nodePositions[n.materialId];
            if (!pos) return null;
            const mat = materials[n.materialId];
            if (!mat) return null;
            const isSelected = selectedGraphNodeId === n.materialId;
            const isHighlighted =
              isSelected ||
              (selectedNode &&
                (selectedNode.parentIds.includes(n.materialId) ||
                  n.parentIds.includes(selectedGraphNodeId!)));

            return (
              <g
                key={n.materialId}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(isSelected ? null : n.materialId);
                }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? NODE_R * 1.2 : NODE_R}
                  fill={isSelected ? '#ffd54f' : '#2a2a4a'}
                  stroke={isHighlighted ? '#ffd54f' : '#7a7aaa'}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  style={{
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    filter: isHighlighted
                      ? 'drop-shadow(0 0 8px rgba(255, 213, 79, 0.5))'
                      : 'none',
                  }}
                />
                <text
                  x={pos.x}
                  y={pos.y + 8}
                  textAnchor="middle"
                  fontSize="22"
                  style={{ pointerEvents: 'none' }}
                >
                  {mat.emoji}
                </text>
              </g>
            );
          })}
        </svg>

        {selectedMat && selectedNode && (() => {
          const pos = nodePositions[selectedNode.materialId];
          if (!pos) return null;
          const panelX = Math.min(Math.max(pos.x - 100, 5), CANVAS_W - 210);
          const panelY = Math.min(pos.y + NODE_R * 1.2 + 10, CANVAS_H - 150);
          const unlockTime = selectedMat.discoveredAt
            ? new Date(selectedMat.discoveredAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : '初始';
          return (
            <div
              style={{
                ...styles.detailPanel,
                left: panelX,
                top: panelY,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.detailHeader}>
                <span style={{ fontSize: 24 }}>{selectedMat.emoji}</span>
                <div style={{ flex: 1, marginLeft: 8 }}>
                  <div style={styles.detailName}>{selectedMat.name}</div>
                  <div style={styles.detailElement}>
                    {elementLabel(selectedMat.elementType)}
                  </div>
                </div>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>解锁时间</span>
                <span style={styles.detailValue}>{unlockTime}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>合成次数</span>
                <span style={styles.detailValue}>{selectedMat.synthesisCount}</span>
              </div>
              {selectedParents.length > 0 && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>配方来源</span>
                  <span style={styles.detailValue}>
                    {selectedParents.map((p) => p.emoji).join(' + ')}
                  </span>
                </div>
              )}
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>参与配方</span>
                <span style={styles.detailValue}>{selectedRecipes.length} 条</span>
              </div>
              <button
                style={styles.detailClose}
                onClick={() => onSelectNode(null)}
              >
                关闭
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

function elementLabel(t: string): string {
  const m: Record<string, string> = {
    fire: '🔥火元素',
    water: '💧水元素',
    earth: '🪨土元素',
    air: '💨风元素',
    chaos: '🔮混沌',
    spirit: '✨灵魂',
    metal: '⚙️金属',
    nature: '🌿自然',
  };
  return m[t] || t;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: 400,
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    gap: 8,
    background: 'linear-gradient(180deg, #0f0f1e 0%, #0a0a18 100%)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
  },
  title: {
    fontFamily: "'Cinzel', serif",
    fontSize: 15,
    fontWeight: 700,
    color: '#ffd54f',
    margin: 0,
    letterSpacing: 0.5,
  },
  count: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 12,
    color: '#7a7aaa',
    background: '#1e1e3e',
    padding: '2px 8px',
    borderRadius: 10,
    border: '1px solid #3a3a5a',
  },
  canvasWrap: {
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
    background: 'rgba(15, 15, 30, 0.6)',
    border: '1px solid #2a2a4a',
  },
  svg: {
    display: 'block',
    width: '100%',
    height: '100%',
    maxWidth: CANVAS_W,
    margin: '0 auto',
  },
  detailPanel: {
    position: 'absolute',
    width: 200,
    background: '#1e1e2e',
    border: '1px solid #4a4a6a',
    borderRadius: 8,
    padding: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
    zIndex: 10,
    animation: 'fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottom: '1px solid #3a3a5a',
  },
  detailName: {
    fontFamily: "'Cinzel', serif",
    fontSize: 14,
    fontWeight: 700,
    color: '#ffd54f',
  },
  detailElement: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 11,
    color: '#b8b8d0',
    marginTop: 2,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    gap: 8,
  },
  detailLabel: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 11,
    color: '#7a7aaa',
  },
  detailValue: {
    fontFamily: "'Crimson Text', serif",
    fontSize: 12,
    color: '#e8e8f0',
    textAlign: 'right',
    fontWeight: 600,
  },
  detailClose: {
    marginTop: 8,
    width: '100%',
    background: 'transparent',
    border: '1px solid #4a4a6a',
    color: '#b8b8d0',
    fontFamily: "'Crimson Text', serif",
    fontSize: 12,
    padding: '5px 0',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.3s ease-out',
  },
};

export const RecipeGraph = memo(RecipeGraphComponent);
