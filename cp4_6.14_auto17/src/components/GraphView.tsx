import { useEffect, useMemo, useRef } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from 'd3-force';
import type { Note } from '../types';
import { formatDate } from '../utils/markdown';

interface GraphViewProps {
  notes: Note[];
  currentNoteId: string | null;
  onSelectNote: (id: string) => void;
}

interface GNode extends SimulationNodeDatum {
  id: string;
  title: string;
  createdAt: string;
  radius: number;
  refCount: number;
  isCurrent: boolean;
}

interface GLink extends SimulationLinkDatum<GNode> {
  source: string | GNode;
  target: string | GNode;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const TRANSITION_MS = 600;

export default function GraphView({ notes, currentNoteId, onSelectNote }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<Simulation<GNode, GLink> | null>(null);
  const nodesRef = useRef<GNode[]>([]);
  const linksRef = useRef<GLink[]>([]);
  const zoomRef = useRef({ k: 0.85, tx: 0, ty: 0 });
  const transformRef = useRef<{ k: number; tx: number; ty: number }>({ k: 0.85, tx: 0, ty: 0 });
  const transitioningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 800, h: 600 });

  const { nodes, links, idSet } = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach((n) => {
      if (!counts.has(n.id)) counts.set(n.id, 0);
      n.linkedIds.forEach((lid) => {
        if (!counts.has(lid)) counts.set(lid, 0);
        counts.set(lid, (counts.get(lid) as number) + 1);
      });
    });
    const idSet = new Set(notes.map((n) => n.id));
    const nodes: GNode[] = notes.map((n) => {
      const refCount = counts.get(n.id) ?? 0;
      const radius = 10 + Math.sqrt(refCount + 1) * 4.5;
      return {
        id: n.id,
        title: n.title,
        createdAt: n.createdAt,
        radius: Math.max(8, Math.min(radius, 32)),
        refCount,
        isCurrent: n.id === currentNoteId,
      };
    });
    const linkSet = new Set<string>();
    const links: GLink[] = [];
    notes.forEach((n) => {
      n.linkedIds.forEach((lid) => {
        if (!idSet.has(lid)) return;
        const key = [n.id, lid].sort().join('|');
        if (linkSet.has(key)) return;
        linkSet.add(key);
        links.push({ source: n.id, target: lid });
      });
    });
    return { nodes, links, idSet };
    void idSet;
  }, [notes, currentNoteId]);

  useEffect(() => {
    nodesRef.current = nodes;
    linksRef.current = links;
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    const nodeMap = new Map(nodes.map((n) => [n.id, { ...n }]));
    const simNodes: GNode[] = Array.from(nodeMap.values());
    const simLinks: GLink[] = links.map((l) => ({
      source: (l.source as GNode).id ?? (l.source as string),
      target: (l.target as GNode).id ?? (l.target as string),
    }));

    const { w, h } = sizeRef.current;

    if (simulationRef.current) simulationRef.current.stop();

    const sim = forceSimulation<GNode>(simNodes)
      .force(
        'link',
        forceLink<GNode, GLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => {
            const s = d.source as GNode;
            const t = d.target as GNode;
            return Math.max(80, (s.radius + t.radius) * 3.5);
          })
          .strength(0.55),
      )
      .force('charge', forceManyBody().strength(-260))
      .force('center', forceCenter(w / 2, h / 2).strength(0.08))
      .force('collide', forceCollide<GNode>().radius((d) => d.radius + 10).strength(0.8))
      .velocityDecay(0.28)
      .alpha(1)
      .alphaDecay(0.018);

    simulationRef.current = sim;
    nodesRef.current = simNodes;
    linksRef.current = simLinks;

    const rootGroup = svg.querySelector<SVGGElement>('g.root');
    const linksGroup = svg.querySelector<SVGGElement>('g.links');
    const nodesGroup = svg.querySelector<SVGGElement>('g.nodes');
    if (!rootGroup || !linksGroup || !nodesGroup) {
      ro.disconnect();
      return;
    }

    // Build links
    while (linksGroup.firstChild) linksGroup.removeChild(linksGroup.firstChild);
    simLinks.forEach(() => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', 'rgba(74,144,217,0.35)');
      line.setAttribute('stroke-width', '1.2');
      linksGroup.appendChild(line);
    });

    // Build nodes
    while (nodesGroup.firstChild) nodesGroup.removeChild(nodesGroup.firstChild);
    simNodes.forEach((node, idx) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'graph-node');
      g.style.cursor = 'pointer';

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', String(node.radius));
      const isCurrent = node.id === currentNoteId;
      if (isCurrent) {
        circle.setAttribute('fill', 'url(#currentGrad)');
        circle.setAttribute('stroke', '#e94560');
        circle.setAttribute('stroke-width', '2.5');
      } else {
        circle.setAttribute('fill', 'url(#nodeGrad)');
        circle.setAttribute('stroke', 'rgba(74,144,217,0.5)');
        circle.setAttribute('stroke-width', '1.2');
      }
      circle.style.transition = 'all 300ms ease';
      g.appendChild(circle);

      // inner label
      if (node.radius >= 14) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dy', '0.35em');
        label.setAttribute('fill', '#fff');
        label.setAttribute('font-size', String(Math.max(9, Math.min(12, node.radius * 0.38))));
        label.setAttribute('font-weight', '600');
        label.setAttribute('pointer-events', 'none');
        label.textContent = node.title.length > 2 ? node.title.slice(0, 1) : node.title;
        g.appendChild(label);
      }

      // outer title label
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('text-anchor', 'middle');
      title.setAttribute('dy', String(node.radius + 16));
      title.setAttribute('fill', 'rgba(224,224,224,0.9)');
      title.setAttribute('font-size', '11');
      title.setAttribute('font-family', 'var(--font-sans)');
      title.setAttribute('pointer-events', 'none');
      const truncatedTitle = node.title.length > 14 ? node.title.slice(0, 13) + '…' : node.title;
      title.textContent = truncatedTitle;
      g.appendChild(title);

      // tooltip group (on hover)
      const tip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      tip.setAttribute('class', 'graph-tip');
      tip.setAttribute('opacity', '0');
      tip.style.transition = 'opacity 200ms ease';
      tip.style.pointerEvents = 'none';
      const tipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const tipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tipText.setAttribute('fill', '#fff');
      tipText.setAttribute('font-size', '12');
      tipText.setAttribute('font-family', 'var(--font-sans)');
      const titleLine = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      titleLine.setAttribute('x', '0');
      titleLine.setAttribute('dy', '1em');
      titleLine.setAttribute('font-weight', '700');
      titleLine.textContent = node.title;
      const dateLine = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      dateLine.setAttribute('x', '0');
      dateLine.setAttribute('dy', '1.5em');
      dateLine.setAttribute('font-size', '11');
      dateLine.setAttribute('fill', 'rgba(255,255,255,0.75)');
      dateLine.textContent = `📅 ${formatDate(node.createdAt)} · 被引用 ${node.refCount}`;
      tipText.appendChild(titleLine);
      tipText.appendChild(dateLine);
      tipRect.setAttribute('rx', '6');
      tipRect.setAttribute('ry', '6');
      tipRect.setAttribute('fill', 'rgba(15, 52, 96, 0.95)');
      tipRect.setAttribute('stroke', 'rgba(74,144,217,0.4)');
      tipRect.setAttribute('stroke-width', '1');
      tip.appendChild(tipRect);
      tip.appendChild(tipText);
      setTimeout(() => {
        const w = Math.max(120, Math.max(node.title.length * 14, 150));
        tipRect.setAttribute('x', String(-w / 2 - 8));
        tipRect.setAttribute('y', String(-node.radius - 52));
        tipRect.setAttribute('width', String(w + 16));
        tipRect.setAttribute('height', '48');
        tip.setAttribute('transform', `translate(0, ${-node.radius - 30})`);
      }, 0);
      g.appendChild(tip);

      // Interaction handlers
      g.addEventListener('mouseenter', () => {
        circle.style.filter = 'drop-shadow(0 0 10px rgba(233,69,96,0.6))';
        g.setAttribute('transform-origin', 'center');
        tip.setAttribute('opacity', '1');
      });
      g.addEventListener('mouseleave', () => {
        circle.style.filter = '';
        tip.setAttribute('opacity', '0');
      });
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = simNodes[idx];
        if (!target) return;
        const { w: cw, h: ch } = sizeRef.current;
        const desiredK = Math.min(1.6, MAX_ZOOM);
        const desiredTx = cw / 2 - target.x! * desiredK;
        const desiredTy = ch / 2 - target.y! * desiredK;
        animateTransform(desiredK, desiredTx, desiredTy);
        setTimeout(() => onSelectNote(target.id), 100);
      });

      // Drag
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let startNodeX = 0;
      let startNodeY = 0;
      g.addEventListener('mousedown', (ev: MouseEvent) => {
        ev.stopPropagation();
        dragging = true;
        startX = ev.clientX;
        startY = ev.clientY;
        startNodeX = node.x ?? 0;
        startNodeY = node.y ?? 0;
        sim.alphaTarget(0.3).restart();
        node.fx = node.x;
        node.fy = node.y;
        const onMove = (e: MouseEvent) => {
          if (!dragging) return;
          const dx = (e.clientX - startX) / transformRef.current.k;
          const dy = (e.clientY - startY) / transformRef.current.k;
          node.fx = startNodeX + dx;
          node.fy = startNodeY + dy;
        };
        const onUp = () => {
          dragging = false;
          node.fx = null;
          node.fy = null;
          sim.alphaTarget(0);
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });

      nodesGroup.appendChild(g);
    });

    // Tick render
    const linkEls = Array.from(linksGroup.children) as SVGLineElement[];
    const nodeEls = Array.from(nodesGroup.children) as SVGGElement[];
    let lastTs = 0;
    const tick = (ts: number) => {
      if (ts - lastTs < 16) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastTs = ts;
      simLinks.forEach((l, i) => {
        const line = linkEls[i];
        if (!line) return;
        const s = l.source as GNode;
        const t = l.target as GNode;
        line.setAttribute('x1', String(s.x));
        line.setAttribute('y1', String(s.y));
        line.setAttribute('x2', String(t.x));
        line.setAttribute('y2', String(t.y));
      });
      simNodes.forEach((n, i) => {
        const g = nodeEls[i];
        if (!g) return;
        g.setAttribute('transform', `translate(${n.x},${n.y})`);
      });
      if (sim.alpha() > 0.005) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    // Zoom & Pan
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cur = transformRef.current;
      const delta = -e.deltaY * 0.001;
      const targetK = clamp(cur.k * Math.exp(delta), MIN_ZOOM, MAX_ZOOM);
      const ratio = targetK / cur.k;
      const tx = mx - (mx - cur.tx) * ratio;
      const ty = my - (my - cur.ty) * ratio;
      setTransform(targetK, tx, ty);
      rootGroup?.setAttribute('transform', `translate(${tx},${ty}) scale(${targetK})`);
    };

    let panning = false;
    let panStart = { x: 0, y: 0, tx: 0, ty: 0 };
    const onSvgMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      panning = true;
      panStart = { x: e.clientX, y: e.clientY, tx: transformRef.current.tx, ty: transformRef.current.ty };
      svg.style.cursor = 'grabbing';
    };
    const onSvgMouseMove = (e: MouseEvent) => {
      if (!panning) return;
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      const tx = panStart.tx + dx;
      const ty = panStart.ty + dy;
      setTransform(transformRef.current.k, tx, ty);
      rootGroup?.setAttribute('transform', `translate(${tx},${ty}) scale(${transformRef.current.k})`);
    };
    const onSvgMouseUp = () => {
      panning = false;
      svg.style.cursor = 'default';
    };

    svg.addEventListener('wheel', onWheel, { passive: false });
    svg.addEventListener('mousedown', onSvgMouseDown);
    window.addEventListener('mousemove', onSvgMouseMove);
    window.addEventListener('mouseup', onSvgMouseUp);

    // Initial centered transform
    const { w: iw, h: ih } = sizeRef.current;
    setTimeout(() => {
      animateTransform(0.85, iw / 2 - (iw / 2) * 0.85, ih / 2 - (ih / 2) * 0.85);
    }, 200);

    return () => {
      ro.disconnect();
      sim.stop();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      svg.removeEventListener('wheel', onWheel);
      svg.removeEventListener('mousedown', onSvgMouseDown);
      window.removeEventListener('mousemove', onSvgMouseMove);
      window.removeEventListener('mouseup', onSvgMouseUp);
    };
  }, [notes.length, currentNoteId]);

  const setTransform = (k: number, tx: number, ty: number) => {
    transformRef.current = { k, tx, ty };
    zoomRef.current = { k, tx, ty };
    const root = svgRef.current?.querySelector<SVGGElement>('g.root');
    root?.setAttribute('transform', `translate(${tx},${ty}) scale(${k})`);
  };

  const animateTransform = (toK: number, toTx: number, toTy: number) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    const from = { ...transformRef.current };
    const start = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / TRANSITION_MS);
      const ease = easeInOutCubic(t);
      const k = from.k + (toK - from.k) * ease;
      const tx = from.tx + (toTx - from.tx) * ease;
      const ty = from.ty + (toTy - from.ty) * ease;
      setTransform(k, tx, ty);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        transitioningRef.current = false;
      }
    };
    requestAnimationFrame(step);
  };

  // Build grid defs
  const gridLines: JSX.Element[] = [];
  const spacing = 40;
  const lines = 40;
  for (let i = -lines; i <= lines; i++) {
    gridLines.push(
      <line
        key={`gx${i}`}
        x1={i * spacing}
        y1={-lines * spacing}
        x2={i * spacing}
        y2={lines * spacing}
        stroke="var(--grid-color)"
        strokeWidth="1"
      />,
    );
    gridLines.push(
      <line
        key={`gy${i}`}
        x1={-lines * spacing}
        y1={i * spacing}
        x2={lines * spacing}
        y2={i * spacing}
        stroke="var(--grid-color)"
        strokeWidth="1"
      />,
    );
  }

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%', minHeight: 0, minWidth: 0, position: 'relative',
      background: 'linear-gradient(135deg, rgba(26,26,46,1), rgba(22,33,62,0.8)', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 12, left: 14, zIndex: 5,
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 10px', background: 'rgba(15,52,96,0.6)', borderRadius: 6, backdropFilter: 'blur(8px)' }}>
          🔗 关系图谱 · {nodes.length} 个节点 · {links.length} 条连接
        </span>
      </div>
      <div style={{
        position: 'absolute', top: 12, right: 14, zIndex: 5, display: 'flex', gap: 4,
      }}>
        <button
          onClick={() => {
            const { w, h } = sizeRef.current;
            animateTransform(1, w / 2 - (w / 2) * 1, h / 2 - (h / 2) * 1);
          }}
          title="重置视图"
          style={zoomBtnStyle}
        >⟳</button>
        <button onClick={() => {
          const { k, tx, ty } = transformRef.current;
          const nk = clamp(k * 1.2, MIN_ZOOM, MAX_ZOOM);
          animateTransform(nk, tx, ty);
        }} style={zoomBtnStyle}>＋</button>
        <button onClick={() => {
          const { k, tx, ty } = transformRef.current;
          const nk = clamp(k / 1.2, MIN_ZOOM, MAX_ZOOM);
          animateTransform(nk, tx, ty);
        }} style={zoomBtnStyle}>－</button>
      </div>
      <div style={{
        position: 'absolute', bottom: 12, left: 14, zIndex: 5, fontSize: 11,
        color: 'var(--text-muted)', padding: '6px 10px', background: 'rgba(15,52,96,0.5)',
        borderRadius: 6, backdropFilter: 'blur(8px)', lineHeight: 1.6,
      }}>
        滚轮缩放 · 拖拽平移 · 点击节点跳转<br />
        节点大小 = 被引用次数
      </div>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <radialGradient id="nodeGrad" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#3d5a80" />
            <stop offset="100%" stopColor="#0f3460" />
          </radialGradient>
          <radialGradient id="currentGrad" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ff6b8a" />
            <stop offset="100%" stopColor="#e94560" />
          </radialGradient>
        </defs>
        <g className="root">
          <g className="grid">{gridLines}</g>
          <g className="links" />
          <g className="nodes" />
        </g>
      </svg>
    </div>
  );
}

function clamp(v: number, mn: number, mx: number) { return Math.max(mn, Math.min(mx, v)); }
function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

const zoomBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  background: 'rgba(15,52,96,0.7)', color: '#fff',
  backdropFilter: 'blur(8px)', fontWeight: 700,
  border: '1px solid var(--border-color)',
};
