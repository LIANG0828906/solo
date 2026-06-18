import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3Force from 'd3-force';
import type { Plant, SymbiosisType, SymbiosisPartnerInfo } from '@types/index';
import { PLANT_SPECIES, getSpeciesById, getSymbiosisPartners, getSymbiosisRelation } from '@data/plants';
import { FiX, FiNetwork } from 'react-icons/fi';

interface GraphNode extends d3Force.SimulationNodeDatum {
  id: string;
  speciesId: string;
  count: number;
  radius: number;
}

interface GraphLink extends d3Force.SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
  type: SymbiosisType;
  reason: string;
}

type FilterMode = 'all' | 'beneficial' | 'harmful' | 'neutral';

interface SymbiosisGraphProps {
  plants: Plant[];
}

const LINK_COLORS: Record<SymbiosisType, string> = {
  beneficial: '#4CAF50',
  harmful: '#F44336',
  neutral: '#9E9E9E',
};

const SYMBIOSIS_LABELS: Record<SymbiosisType, string> = {
  beneficial: '有益共生',
  harmful: '有害相克',
  neutral: '中性共处',
};

const SymbiosisGraph: React.FC<SymbiosisGraphProps> = ({ plants }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3Force.Simulation<GraphNode, GraphLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const [size, setSize] = useState({ w: 600, h: 400 });
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState<string>('');
  const [linkFilter, setLinkFilter] = useState<FilterMode>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [, forceTick] = useState(0);
  const [partnersForSelected, setPartnersForSelected] = useState<SymbiosisPartnerInfo[]>([]);

  const speciesInGarden = useMemo(() => {
    const map = new Map<string, number>();
    plants.forEach((p) => {
      map.set(p.speciesId, (map.get(p.speciesId) || 0) + 1);
    });
    return map;
  }, [plants]);

  const allSpeciesIds = useMemo(() => PLANT_SPECIES.map((s) => s.id), []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setSize({ w: r.width, h: Math.max(400, r.height - 120) });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const speciesIds = Array.from(speciesInGarden.keys());
    if (speciesIds.length === 0) {
      nodesRef.current = [];
      linksRef.current = [];
      if (simulationRef.current) simulationRef.current.stop();
      forceTick((v) => v + 1);
      return;
    }

    const maxCount = Math.max(...speciesInGarden.values());
    const nodes: GraphNode[] = speciesIds.map((sid) => {
      const count = speciesInGarden.get(sid) || 1;
      const radius = 30 + (count / Math.max(maxCount, 1)) * 20;
      return { id: sid, speciesId: sid, count, radius } as GraphNode;
    });

    const links: GraphLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const rel = getSymbiosisRelation(nodes[i].speciesId, nodes[j].speciesId);
        if (rel) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            type: rel.type,
            reason: rel.reason,
          });
        }
      }
    }

    nodesRef.current = nodes;
    linksRef.current = links;

    const width = size.w;
    const height = size.h;

    const simulation = d3Force
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3Force.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(120).strength(0.6),
      )
      .force('charge', d3Force.forceManyBody().strength(-520))
      .force('center', d3Force.forceCenter(width / 2, height / 2).strength(0.15))
      .force('collide', d3Force.forceCollide<GraphNode>().radius((d) => d.radius + 18).strength(0.8))
      .alphaDecay(0.025)
      .on('tick', () => forceTick((v) => v + 1));

    simulationRef.current = simulation;
    return () => {
      simulation.stop();
    };
  }, [speciesInGarden, size.w, size.h]);

  const showFilteredLink = useCallback(
    (type: SymbiosisType) => {
      if (linkFilter === 'all') return true;
      return type === linkFilter;
    },
    [linkFilter],
  );

  const isNodeFiltered = useCallback(
    (speciesId: string) => {
      if (!selectedSpeciesFilter) return false;
      return speciesId !== selectedSpeciesFilter;
    },
    [selectedSpeciesFilter],
  );

  const isLinkHighlighted = useCallback(
    (link: GraphLink) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      if (hoveredNode) return sourceId === hoveredNode || targetId === hoveredNode;
      if (selectedSpeciesFilter) return sourceId === selectedSpeciesFilter || targetId === selectedSpeciesFilter;
      return true;
    },
    [hoveredNode, selectedSpeciesFilter],
  );

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const sim = simulationRef.current;
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!sim || !node || !svgRef.current) return;
    setDraggingNode(nodeId);

    sim.alphaTarget(0.35).restart();
    node.fx = node.x;
    node.fy = node.y;

    const startX = e.clientX;
    const startY = e.clientY;
    const startFX = node.x;
    const startFY = node.y;
    const rect = svgRef.current.getBoundingClientRect();

    const onMove = (ev: MouseEvent) => {
      node.fx = startFX + (ev.clientX - startX);
      node.fy = startFY + (ev.clientY - startY);
    };
    const onUp = () => {
      sim.alphaTarget(0);
      node.fx = null;
      node.fy = null;
      setDraggingNode(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleNodeClick = (speciesId: string) => {
    if (selectedNode === speciesId) {
      setSelectedNode(null);
      setPartnersForSelected([]);
    } else {
      setSelectedNode(speciesId);
      setPartnersForSelected(getSymbiosisPartners(speciesId));
    }
  };

  const selectedSpeciesInfo = selectedNode ? getSpeciesById(selectedNode) : null;

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-graph-bg)',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--color-card-border)',
          backgroundColor: 'var(--color-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiNetwork size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>共生关系图</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {speciesInGarden.size} 个品种 · {linksRef.current.length} 种关系
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            className="form-input"
            value={selectedSpeciesFilter}
            onChange={(e) => setSelectedSpeciesFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 140, padding: '6px 10px', fontSize: 13 }}
          >
            <option value="">全部品种</option>
            {Array.from(speciesInGarden.keys()).map((sid) => {
              const sp = getSpeciesById(sid);
              return sp ? <option key={sid} value={sid}>{sp.name} ({speciesInGarden.get(sid)})</option> : null;
            })}
          </select>

          <div
            style={{
              display: 'flex',
              backgroundColor: '#ECE5D6',
              borderRadius: 8,
              padding: 3,
              gap: 2,
            }}
          >
            {(['all', 'beneficial', 'harmful', 'neutral'] as FilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLinkFilter(mode)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  ...(linkFilter === mode
                    ? { backgroundColor: 'white', color: mode === 'all' ? 'var(--color-text)' : LINK_COLORS[mode as Exclude<FilterMode, 'all'>], boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }
                    : { color: 'var(--color-text-secondary)' }),
                }}
              >
                {mode === 'all' ? '全部' : SYMBIOSIS_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          width={size.w}
          height={size.h}
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          <defs>
            {(['beneficial', 'harmful', 'neutral'] as SymbiosisType[]).map((t) => (
              <marker
                key={t}
                id={`arrow-${t}`}
                viewBox="0 -5 10 10"
                refX="20"
                refY="0"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0,-4L8,0L0,4" fill="none" stroke={LINK_COLORS[t]} strokeWidth="1.5" />
              </marker>
            ))}
          </defs>

          <g>
            {linksRef.current.map((link, idx) => {
              if (!showFilteredLink(link.type)) return null;
              const s = typeof link.source === 'string' ? nodesRef.current.find((n) => n.id === link.source) : link.source;
              const t = typeof link.target === 'string' ? nodesRef.current.find((n) => n.id === link.target) : link.target;
              if (!s || !t) return null;
              const sid = s.id;
              const tid = t.id;
              const filteredByNode = isNodeFiltered(sid) || isNodeFiltered(tid);
              const highlighted = isLinkHighlighted(link);
              const opacity = filteredByNode ? 0.08 : highlighted ? 1 : 0.5;
              const isDraggingLine = draggingNode && (sid === draggingNode || tid === draggingNode);
              const baseStrokeWidth = highlighted ? 3 : 2;
              const strokeDasharray =
                link.type === 'harmful' ? '8 6' : link.type === 'neutral' ? '2 6' : isDraggingLine ? '4 5' : undefined;
              return (
                <line
                  key={`link-${idx}`}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={LINK_COLORS[link.type]}
                  strokeWidth={baseStrokeWidth}
                  strokeOpacity={opacity}
                  strokeDasharray={strokeDasharray}
                  style={{ transition: 'stroke 0.3s ease, stroke-opacity 0.3s ease, stroke-width 0.2s ease' }}
                />
              );
            })}
          </g>

          <g>
            {nodesRef.current.map((node) => {
              const species = getSpeciesById(node.speciesId);
              if (!species) return null;
              const filtered = isNodeFiltered(node.id);
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode === node.id;
              const isDragging = draggingNode === node.id;
              const scale = isDragging ? 1.1 : isHovered || isSelected ? 1.2 : 1;
              const effectiveRadius = node.radius * scale;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x || 0}, ${node.y || 0})`}
                  style={{
                    cursor: 'grab',
                    opacity: filtered ? 0.3 : 1,
                    pointerEvents: filtered ? 'none' : 'auto',
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node.id);
                  }}
                >
                  {(isHovered || isSelected) && (
                    <circle
                      r={effectiveRadius + 8}
                      fill={species.color}
                      opacity={0.15}
                      style={{ transition: 'all 0.2s ease' }}
                    />
                  )}
                  <circle
                    r={effectiveRadius}
                    fill={species.color}
                    stroke="white"
                    strokeWidth={3}
                    style={{
                      transition: 'r 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s ease',
                      filter: isHovered ? `drop-shadow(0 6px 12px ${species.color}60)` : `drop-shadow(0 3px 8px ${species.color}35)`,
                    }}
                  />
                  <text
                    textAnchor="middle"
                    dy="0.1em"
                    fontSize={effectiveRadius * 0.9}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {species.icon}
                  </text>
                  <text
                    y={effectiveRadius + 18}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={700}
                    fill="white"
                    stroke={species.color}
                    strokeWidth={2.5}
                    paintOrder="stroke"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {species.name}×{node.count}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {speciesInGarden.size === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                color: '#A89A85',
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 12 }}>🌻🌿🥕</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>还没有植物数据</div>
              <div style={{ fontSize: 12 }}>在左侧花园创建植物后，这里会展示共生关系网</div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {selectedNode && selectedSpeciesInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 'min(280px, calc(100% - 32px))',
                backgroundColor: 'var(--color-card)',
                borderRadius: 14,
                padding: 14,
                boxShadow: 'var(--shadow-card-hover)',
                border: '1px solid var(--color-card-border)',
                zIndex: 5,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: selectedSpeciesInfo.color + '20',
                      border: `2px solid ${selectedSpeciesInfo.color}50`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                    }}
                  >
                    {selectedSpeciesInfo.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedSpeciesInfo.name} 共生伙伴</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      {partnersForSelected.length} 个关联品种
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    setPartnersForSelected([]);
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-secondary)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <FiX size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                {partnersForSelected.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', padding: 10 }}>
                    暂无共生记录
                  </div>
                ) : (
                  partnersForSelected.map((p) => {
                    const sp = getSpeciesById(p.speciesId);
                    const inGarden = speciesInGarden.has(p.speciesId);
                    if (!sp) return null;
                    return (
                      <div
                        key={p.speciesId}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 10,
                          backgroundColor: LINK_COLORS[p.type] + '0C',
                          border: `1px solid ${LINK_COLORS[p.type]}30`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            backgroundColor: sp.color + '20',
                            border: `1px solid ${sp.color}50`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            flexShrink: 0,
                          }}
                        >
                          {sp.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{sp.name}</span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: 999,
                                backgroundColor: LINK_COLORS[p.type],
                                color: 'white',
                              }}
                            >
                              {SYMBIOSIS_LABELS[p.type]}
                            </span>
                            {inGarden && (
                              <span style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 600 }}>
                                已种植
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                            {p.reason}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          style={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(6px)',
            borderRadius: 10,
            padding: '8px 12px',
            display: 'flex',
            gap: 14,
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--color-card-border)',
          }}
        >
          {(['beneficial', 'harmful', 'neutral'] as SymbiosisType[]).map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="26" height="10">
                <line
                  x1="2"
                  y1="5"
                  x2="24"
                  y2="5"
                  stroke={LINK_COLORS[t]}
                  strokeWidth={2.5}
                  strokeDasharray={t === 'harmful' ? '6 5' : t === 'neutral' ? '2 5' : undefined}
                />
              </svg>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                {SYMBIOSIS_LABELS[t]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SymbiosisGraph;
