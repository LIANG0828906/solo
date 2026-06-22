import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { ReadingRecord, MOOD_CONFIG, buildResonanceLinks, StarNode, ResonanceLink } from '../types';

interface Props {
  records: ReadingRecord[];
  highlightId: string | null;
  selectedId: string | null;
  pinnedId: string | null;
  activeRecord: ReadingRecord | null;
  onSetPinned: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  record: ReadingRecord;
  size: number;
  color: string;
}

interface SimLink {
  source: SimNode;
  target: SimNode;
  keywordCount: number;
  width: number;
}

function computeBookPageTotals(records: ReadingRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.bookName, (map.get(r.bookName) || 0) + r.page);
  }
  return map;
}

function lerpSize(total: number, minTotal: number, maxTotal: number): number {
  if (maxTotal <= minTotal) return 18;
  const t = Math.max(0, Math.min(1, (total - minTotal) / (maxTotal - minTotal)));
  return 8 + t * 20;
}

export default function StarCanvas({
  records,
  highlightId,
  selectedId,
  pinnedId,
  activeRecord: _activeRecord,
  onSetPinned,
  onSelect,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootGRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const nodeElsRef = useRef<Map<string, SVGGElement>>(new Map());
  const linkElsRef = useRef<SimLink[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [detailPosition, setDetailPosition] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const selectedIdRef = useRef<string | null>(null);

  selectedIdRef.current = selectedId;

  const bookTotals = useMemo(() => computeBookPageTotals(records), [records]);
  const links = useMemo(() => buildResonanceLinks(records) as ResonanceLink[], [records]);

  const pinnedOrHover = pinnedId ?? hoveredNodeId;

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const updateDim = () => {
      setDimensions({ w: el.clientWidth, h: el.clientHeight });
    };
    updateDim();
    const ro = new ResizeObserver(updateDim);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const { w, h } = dimensions;
    if (w === 0 || h === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    nodeElsRef.current.clear();

    const starsBg = svg.append('defs').append('radialGradient')
      .attr('id', 'starBgGradient')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
    starsBg.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(108,99,255,0.15)');
    starsBg.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(0,0,0,0)');

    const bgRect = svg.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', w).attr('height', h)
      .attr('fill', 'url(#starBgGradient)');

    const staticStars = svg.append('g').attr('class', 'static-stars');
    const numBgStars = Math.floor(w * h / 25000);
    for (let i = 0; i < numBgStars; i++) {
      staticStars.append('circle')
        .attr('cx', Math.random() * w)
        .attr('cy', Math.random() * h)
        .attr('r', Math.random() * 1 + 0.3)
        .attr('fill', '#FFFFFF')
        .attr('opacity', Math.random() * 0.4 + 0.1);
    }

    const rootG = svg.append('g').attr('class', 'root-group');
    rootGRef.current = rootG.node() as SVGGElement;

    const linksG = rootG.append('g').attr('class', 'links-group');
    const nodesG = rootG.append('g').attr('class', 'nodes-group');
    const nodeGs: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>[] = [];

    const totals = Array.from(bookTotals.values());
    const minTotal = totals.length ? Math.min(...totals) : 0;
    const maxTotal = totals.length ? Math.max(...totals) : 1;

    const nodes: SimNode[] = records.map((r) => {
      const cfg = MOOD_CONFIG[r.mood];
      const bookTotal = bookTotals.get(r.bookName) || r.page;
      return {
        id: r.id,
        record: r,
        size: lerpSize(bookTotal, minTotal, maxTotal),
        color: cfg.color,
        x: w / 2 + (Math.random() - 0.5) * w * 0.4,
        y: h / 2 + (Math.random() - 0.5) * h * 0.4,
      };
    });

    const idToNode = new Map(nodes.map(n => [n.id, n]));

    const simLinks: SimLink[] = links
      .map((l) => {
        const sid = typeof l.source === 'string' ? l.source : l.source.id;
        const tid = typeof l.target === 'string' ? l.target : l.target.id;
        const s = idToNode.get(sid);
        const t = idToNode.get(tid);
        if (!s || !t) return null;
        return {
          source: s,
          target: t,
          keywordCount: l.keywordCount,
          width: l.width,
        };
      })
      .filter(Boolean) as SimLink[];
    linkElsRef.current = simLinks;

    const linkSel = linksG.selectAll<SVGLineElement, SimLink>('line.resonance-link')
      .data(simLinks)
      .join('line')
      .attr('class', 'resonance-link')
      .attr('stroke-width', (d) => d.width)
      .attr('stroke-linecap', 'round');

    const nodeSel = nodesG.selectAll<SVGGElement, SimNode>('g.star-node-g')
      .data(nodes, (d: SimNode) => d.id)
      .join('g')
      .attr('class', 'star-node-g')
      .style('cursor', 'pointer');

    nodeSel.each(function (d) {
      nodeElsRef.current.set(d.id, this);
      const g = d3.select(this);

      const defs = svg.select('defs');
      const glowId = `glow-${d.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const existingFilter = defs.select(`#${glowId}`);
      if (existingFilter.empty()) {
        const newFilter = defs.append('filter').attr('id', glowId).attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
        newFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
        const merge = newFilter.append('feMerge');
        merge.append('feMergeNode').attr('in', 'coloredBlur');
        merge.append('feMergeNode').attr('in', 'SourceGraphic');
      }

      g.append('circle')
        .attr('class', 'star-glow')
        .attr('r', d.size * 1.8)
        .attr('fill', d.color)
        .attr('opacity', 0.18);

      g.append('circle')
        .attr('class', 'star-node')
        .attr('r', d.size)
        .attr('fill', d.color)
        .attr('stroke', '#FFFFFF')
        .attr('stroke-opacity', 0.25)
        .attr('stroke-width', 1)
        .attr('filter', `url(#${glowId})`);

      g.append('circle')
        .attr('class', 'star-shine')
        .attr('r', d.size * 0.3)
        .attr('cx', -d.size * 0.3)
        .attr('cy', -d.size * 0.3)
        .attr('fill', '#FFFFFF')
        .attr('opacity', 0.6);
    });

    nodeGs.push(nodeSel as any);

    const sim = d3.forceSimulation<SimNode>(nodes)
      .force('charge', d3.forceManyBody<SimNode>().strength(-300))
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(100).strength(0.1))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collide', d3.forceCollide<SimNode>().radius((d) => d.size + 6))
      .alphaDecay(0.02)
      .velocityDecay(0.4)
      .on('tick', () => {
        linkSel
          .attr('x1', (d) => (d.source as SimNode).x ?? 0)
          .attr('y1', (d) => (d.source as SimNode).y ?? 0)
          .attr('x2', (d) => (d.target as SimNode).x ?? 0)
          .attr('y2', (d) => (d.target as SimNode).y ?? 0);

        nodeSel.attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
      });

    simRef.current = sim;

    const drag = d3.drag<SVGGElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    nodeSel.call(drag);

    nodeSel
      .on('mouseenter', function (event, d) {
        setHoveredNodeId(d.id);
        const pt = getSvgPoint(event, svgRef.current!);
        setDetailPosition({ x: pt.x, y: pt.y });
      })
      .on('mousemove', function (event) {
        const pt = getSvgPoint(event, svgRef.current!);
        setDetailPosition({ x: pt.x, y: pt.y });
      })
      .on('mouseleave', function () {
        setHoveredNodeId(null);
        if (!pinnedId) setDetailPosition(null);
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        const cur = pinnedId;
        if (cur === d.id) {
          onSetPinned(null);
          setDetailPosition(null);
        } else {
          onSetPinned(d.id);
          onSelect(d.id);
          const pt = getSvgPoint(event, svgRef.current!);
          setDetailPosition({ x: pt.x, y: pt.y });
        }
      });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        rootG.attr('transform', event.transform);
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    svg.on('click', () => {
      onSetPinned(null);
      setDetailPosition(null);
    });

    return () => {
      sim.stop();
      bgRect.remove();
    };
  }, [records, dimensions, bookTotals, links, onSetPinned, onSelect, pinnedId]);

  useEffect(() => {
    if (!rootGRef.current || !svgRef.current || !selectedId) {
      return;
    }
    const el = nodeElsRef.current.get(selectedId);
    if (!el) return;
    const sim = simRef.current;
    if (!sim) return;
    const node = (sim.nodes() as SimNode[]).find(n => n.id === selectedId);
    if (!node) return;

    const targetX = node.x ?? dimensions.w / 2;
    const targetY = node.y ?? dimensions.h / 2;
    const scale = 1.3;
    const tx = dimensions.w / 2 - targetX * scale;
    const ty = dimensions.h / 2 - targetY * scale;
    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
    d3.select(svgRef.current).transition().duration(600).call(
      (zoomRef.current as any)?.transform as any,
      transform
    );
  }, [selectedId, dimensions]);

  useEffect(() => {
    const active = pinnedOrHover;
    nodeElsRef.current.forEach((gEl, id) => {
      const d3sel = d3.select(gEl);
      const isActive = id === active;
      const hasActive = !!active;

      const nodeCircle = d3sel.select<SVGCircleElement>('circle.star-node');
      const glowCircle = d3sel.select<SVGCircleElement>('circle.star-glow');

      if (hasActive) {
        nodeCircle.classed('dimmed', !isActive);
        glowCircle.classed('dimmed', !isActive);
      } else {
        nodeCircle.classed('dimmed', false);
        glowCircle.classed('dimmed', false);
      }

      if (isActive) {
        nodeCircle
          .transition().duration(200)
          .attr('r', function () { return (parseFloat(d3.select(this).attr('r') || '10')); });
        d3sel.classed('is-active', true);
      } else {
        d3sel.classed('is-active', false);
      }

      const isHighlight = id === highlightId;
      if (isHighlight && !isActive) {
        d3sel.classed('pulse', true);
      } else {
        d3sel.classed('pulse', false);
      }

      const baseR = (simRef.current?.nodes() as SimNode[] | undefined)?.find(n => n.id === id)?.size ?? 10;
      const currentR = isActive ? baseR * 1.5 : baseR;
      nodeCircle
        .transition()
        .duration(200)
        .attr('r', currentR);
      glowCircle
        .transition()
        .duration(200)
        .attr('r', currentR * 1.8);
    });
  }, [pinnedOrHover, highlightId]);

  const showingRecord = pinnedId ? records.find(r => r.id === pinnedId) : (hoveredNodeId ? records.find(r => r.id === hoveredNodeId) : null);
  const detailVisible = !!showingRecord && !!detailPosition;

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      <svg
        ref={svgRef}
        className="star-canvas"
        width={dimensions.w}
        height={dimensions.h}
        onWheel={() => {
          // handled by d3.zoom
        }}
      />
      <AnimatePresence>
        {detailVisible && showingRecord && detailPosition && (
          <DetailCard
            key={showingRecord.id}
            record={showingRecord}
            x={detailPosition.x}
            y={detailPosition.y}
            containerW={dimensions.w}
            containerH={dimensions.h}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function getSvgPoint(event: React.MouseEvent | MouseEvent, svg: SVGSVGElement): { x: number; y: number } {
  const rect = svg.getBoundingClientRect();
  const clientX = 'clientX' in event ? event.clientX : (event as MouseEvent).clientX;
  const clientY = 'clientY' in event ? event.clientY : (event as MouseEvent).clientY;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX - rect.left, y: clientY - rect.top };
  const local = pt.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}

function DetailCard({
  record,
  x,
  y,
  containerW,
  containerH,
}: {
  record: ReadingRecord;
  x: number;
  y: number;
  containerW: number;
  containerH: number;
}) {
  const cfg = MOOD_CONFIG[record.mood];
  const cardW = 260;
  const cardH = 160;
  const margin = 16;
  let left = x + 16;
  let top = y + 16;
  if (left + cardW > containerW - margin) left = Math.max(margin, containerW - cardW - margin);
  if (top + cardH > containerH - margin) top = Math.max(margin, containerH - cardH - margin);
  if (left < margin) left = margin;
  if (top < margin) top = margin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="detail-card"
      style={{ left, top }}
    >
      <div className="detail-card-header">
        <span className="detail-card-mood">{cfg.emoji}</span>
        <span className="detail-card-title">{record.bookName}</span>
      </div>
      <div className="detail-card-info">
        <span style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: cfg.color,
        }} />
        <span>第 {record.page} 页</span>
        <span>·</span>
        <span>{cfg.label}</span>
      </div>
      <div className="detail-card-thought">
        {record.thought.length > 30
          ? record.thought.slice(0, 30) + '...'
          : record.thought}
      </div>
    </motion.div>
  );
}

export type { StarNode, ResonanceLink };
