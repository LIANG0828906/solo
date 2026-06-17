import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import type { PlantNode, SymbiosisLink, SymbiosisType } from '../data/plantData';
import { symbiosisTypeColor, symbiosisShortLabel } from '../data/plantData';
import { useAppStore } from '../stores/appStore';

const NODE_RADIUS = 24;
const NODE_RADIUS_SELECTED = 30;

interface SimNode extends PlantNode {
  index?: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  type: SymbiosisType;
  description: string;
  source: SimNode | string;
  target: SimNode | string;
}

export default function GraphCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const newPlantIdsRef = useRef<Set<string>>(new Set());
  const prevPlantCountRef = useRef<number>(0);
  const nodesGroupRef = useRef<SVGGElement | null>(null);
  const linksGroupRef = useRef<SVGGElement | null>(null);
  const linkLabelsGroupRef = useRef<SVGGElement | null>(null);

  const {
    plants,
    links,
    selectedNodeId,
    setSelectedNode,
    searchQuery,
    filterType,
    dragConnection,
    startDragConnection,
    updateDragConnection,
    endDragConnection,
    simulationResetKey,
    fitViewKey,
    resetSimulation,
    fitView,
  } = useAppStore();

  const matchedIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    const set = new Set<string>();
    plants.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.scientificName.toLowerCase().includes(q)) {
        set.add(p.id);
      }
    });
    return set;
  }, [plants, searchQuery]);

  useEffect(() => {
    if (plants.length > prevPlantCountRef.current && prevPlantCountRef.current > 0) {
      const prevIds = new Set(plants.slice(0, prevPlantCountRef.current).map((p) => p.id));
      plants.forEach((p) => {
        if (!prevIds.has(p.id)) {
          newPlantIdsRef.current.add(p.id);
          setTimeout(() => newPlantIdsRef.current.delete(p.id), 1000);
        }
      });
    }
    prevPlantCountRef.current = plants.length;
  }, [plants]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;

    svg.selectAll('*').remove();

    const { width, height } = container.getBoundingClientRect();
    svg.attr('width', width).attr('height', height);

    const gridSize = 40;
    const gridPattern = svg
      .append('defs')
      .append('pattern')
      .attr('id', 'grid-pattern')
      .attr('width', gridSize)
      .attr('height', gridSize)
      .attr('patternUnits', 'userSpaceOnUse');

    gridPattern
      .append('path')
      .attr('d', `M ${gridSize} 0 L 0 0 0 ${gridSize}`)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-grid)')
      .attr('stroke-width', 0.5);

    svg
      .append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#grid-pattern)');

    const g = svg.append('g').attr('class', 'graph-root');
    gRef.current = g.node() as SVGGElement;

    const linksGroup = g.append('g').attr('class', 'links-group');
    const linkLabelsGroup = g.append('g').attr('class', 'link-labels-group');
    const nodesGroup = g.append('g').attr('class', 'nodes-group');
    const dragLineGroup = g.append('g').attr('class', 'drag-line-group');

    linksGroupRef.current = linksGroup.node() as SVGGElement;
    linkLabelsGroupRef.current = linkLabelsGroup.node() as SVGGElement;
    nodesGroupRef.current = nodesGroup.node() as SVGGElement;

    let simNodes: SimNode[] = [];
    let simLinks: SimLink[] = [];

    const buildSimData = () => {
      simNodes = plants.map((p) => ({
        ...p,
        x: p.x ?? width / 2 + (Math.random() - 0.5) * 200,
        y: p.y ?? height / 2 + (Math.random() - 0.5) * 200,
      }));

      const nodeMap = new Map(simNodes.map((n) => [n.id, n]));
      simLinks = links
        .filter((link) => nodeMap.has(link.source) && nodeMap.has(link.target))
        .map((link) => ({
          ...link,
          source: nodeMap.get(link.source)!,
          target: nodeMap.get(link.target)!,
        }));
    };

    buildSimData();

    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => {
            if (d.type === 'antagonism') return 160;
            if (d.type === 'commensalism') return 120;
            return 100;
          })
          .strength(0.5)
      )
      .force('charge', d3.forceManyBody<SimNode>().strength(-350))
      .force('center', d3.forceCenter<SimNode>(width / 2, height / 2).strength(0.08))
      .force('collision', d3.forceCollide<SimNode>().radius(NODE_RADIUS + 16).strength(0.7))
      .alphaDecay(0.028)
      .velocityDecay(0.4);

    simulationRef.current = simulation;

    const linkSelection = linksGroup
      .selectAll<SVGPathElement, SimLink>('path.link-path')
      .data(simLinks, (d) => d.id)
      .join('path')
      .attr('class', 'link-path')
      .attr('stroke', (d) => symbiosisTypeColor[d.type])
      .attr('stroke-opacity', 0.85);

    const linkLabelGroups = linkLabelsGroup
      .selectAll<SVGGElement, SimLink>('g.link-label-group')
      .data(simLinks, (d) => d.id)
      .join('g')
      .attr('class', 'link-label-group')
      .style('opacity', 0);

    linkLabelGroups
      .append('rect')
      .attr('class', 'link-label-bg')
      .attr('rx', 4)
      .attr('ry', 4);

    const labelTexts = linkLabelGroups
      .append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text((d) => symbiosisShortLabel[d.type]);

    labelTexts.each(function () {
      const el = this as SVGTextElement;
      const bbox = el.getBBox();
      const parent = el.parentNode as SVGGElement;
      const rect = parent.querySelector('rect') as SVGRectElement;
      if (rect) {
        rect.setAttribute('x', String(bbox.x - 4));
        rect.setAttribute('y', String(bbox.y - 2));
        rect.setAttribute('width', String(bbox.width + 8));
        rect.setAttribute('height', String(bbox.height + 4));
      }
    });

    const nodeSelection = nodesGroup
      .selectAll<SVGGElement, SimNode>('g.graph-node')
      .data(simNodes, (d) => d.id)
      .join(
        (enter) => {
          const nodeG = enter
            .append('g')
            .attr('class', (d) => `graph-node ${newPlantIdsRef.current.has(d.id) ? 'fade-in-node' : ''}`)
            .attr('data-id', (d) => d.id);

          nodeG
            .append('circle')
            .attr('class', 'halo-circle')
            .attr('r', NODE_RADIUS_SELECTED + 6)
            .attr('fill', 'none')
            .attr('stroke', 'var(--color-accent)')
            .attr('stroke-width', 3)
            .style('display', 'none');

          nodeG
            .append('circle')
            .attr('class', 'node-bg')
            .attr('r', NODE_RADIUS)
            .attr('fill', '#2A2A3E')
            .attr('stroke', (d) => (selectedNodeId === d.id ? 'var(--color-accent)' : '#3D3D5C'))
            .attr('stroke-width', 2);

          nodeG
            .append('text')
            .attr('class', 'node-emoji')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', 20)
            .style('pointer-events', 'none')
            .style('user-select', 'none')
            .text((d) => d.icon);

          nodeG
            .append('text')
            .attr('class', 'node-label')
            .attr('dy', NODE_RADIUS + 14)
            .text((d) => d.name);

          return nodeG;
        },
        (update) => update,
        (exit) => exit.remove()
      );

    const dragLineSel = dragLineGroup
      .append('path')
      .attr('class', 'drag-line')
      .style('display', 'none');

    const dragBehavior = d3
      .drag<SVGGElement, SimNode>()
      .on('start', function (event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3.select(this).select('circle.node-bg').attr('stroke', 'var(--color-accent)');
      })
      .on('drag', function (event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function (event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        d3.select(this)
          .select('circle.node-bg')
          .attr('stroke', (dn: any) =>
            selectedNodeId === dn.id ? 'var(--color-accent)' : '#3D3D5C'
          );
      });

    nodeSelection.call(dragBehavior);

    nodeSelection.on('click', function (event: MouseEvent, d) {
      event.stopPropagation();
      if (selectedNodeId === d.id) {
        setSelectedNode(null);
      } else {
        setSelectedNode(d.id);
      }
    });

    let isCtrlDragging = false;
    let ctrlDragSourceId: string | null = null;
    let ctrlStartX = 0;
    let ctrlStartY = 0;

    nodeSelection.on('mousedown', function (event: MouseEvent, d) {
      if (event.ctrlKey || event.metaKey) {
        event.stopPropagation();
        isCtrlDragging = true;
        ctrlDragSourceId = d.id;
        ctrlStartX = event.clientX;
        ctrlStartY = event.clientY;
        const sourceNode = d;
        const screenPos = toScreenPosition(sourceNode.x, sourceNode.y);
        startDragConnection(d.id, screenPos.x, screenPos.y);
      }
    });

    svg.on('mousemove', function (event: MouseEvent) {
      if (isCtrlDragging && ctrlDragSourceId) {
        const screenX = event.clientX;
        const screenY = event.clientY;
        const worldPos = toWorldPosition(screenX, screenY);

        let targetId: string | null = null;
        const el = document.elementFromPoint(screenX, screenY) as SVGElement | null;
        if (el) {
          const nodeEl = el.closest('g.graph-node') as SVGGElement | null;
          if (nodeEl) {
            const id = nodeEl.getAttribute('data-id');
            if (id && id !== ctrlDragSourceId) targetId = id;
          }
        }

        const sourceNode = simNodes.find((n) => n.id === ctrlDragSourceId);
        if (sourceNode) {
          const sx = sourceNode.x;
          const sy = sourceNode.y;
          const ex = worldPos.x;
          const ey = worldPos.y;
          dragLineSel
            .style('display', null)
            .attr('d', `M ${sx} ${sy} L ${ex} ${ey}`);
        }

        updateDragConnection(screenX, screenY, targetId);
      }
    });

    svg.on('mouseup', function (event: MouseEvent) {
      if (isCtrlDragging) {
        isCtrlDragging = false;
        dragLineSel.style('display', 'none');
        const moved = Math.hypot(event.clientX - ctrlStartX, event.clientY - ctrlStartY) > 5;
        if (moved) {
          endDragConnection();
        } else {
          startDragConnection('', 0, 0);
          updateDragConnection(0, 0, null);
        }
        ctrlDragSourceId = null;
      }
    });

    svg.on('click', () => {
      setSelectedNode(null);
    });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    function toScreenPosition(worldX: number, worldY: number) {
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const transform = d3.zoomTransform(svgRef.current!);
      return {
        x: rect.left + transform.applyX(worldX),
        y: rect.top + transform.applyY(worldY),
      };
    }

    function toWorldPosition(screenX: number, screenY: number): { x: number; y: number } {
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const transform = d3.zoomTransform(svgRef.current!);
      const [wx, wy] = transform.invert([screenX - rect.left, screenY - rect.top]);
      return { x: wx, y: wy };
    }

    const renderTick = () => {
      const root = d3.select(gRef.current!);
      const sim = simulationRef.current!;
      const curNodes = sim.nodes() as SimNode[];
      const nodeMap = new Map(curNodes.map((n) => [n.id, n]));
      const linkForce = sim.force('link') as d3.ForceLink<SimNode, SimLink> | undefined;
      const curLinks = linkForce ? linkForce.links() : [];

      const curLinkSelection = d3
        .select(linksGroupRef.current!)
        .selectAll<SVGPathElement, SimLink>('path.link-path')
        .data(curLinks, (d: any) => d.id);

      curLinkSelection.attr('d', (d: any) => {
        const src = (typeof d.source === 'object' ? d.source : nodeMap.get(d.source)) as SimNode;
        const tgt = (typeof d.target === 'object' ? d.target : nodeMap.get(d.target)) as SimNode;
        if (!src || !tgt) return '';
        if (src.id === tgt.id) {
          const r = NODE_RADIUS + 18;
          const cx = src.x;
          const cy = src.y - r * 0.5;
          return `M ${cx - r * 0.7} ${cy} A ${r} ${r} 0 1 1 ${cx + r * 0.7} ${cy}`;
        }
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const offsetX = (-dy / dist) * 12;
        const offsetY = (dx / dist) * 12;
        const midX = (src.x + tgt.x) / 2 + offsetX;
        const midY = (src.y + tgt.y) / 2 + offsetY;
        return `M ${src.x} ${src.y} Q ${midX} ${midY} ${tgt.x} ${tgt.y}`;
      });

      const curLabelSelection = d3
        .select(linkLabelsGroupRef.current!)
        .selectAll<SVGGElement, SimLink>('g.link-label-group')
        .data(curLinks, (d: any) => d.id);

      curLabelSelection.each(function (d: any) {
        const src = (typeof d.source === 'object' ? d.source : nodeMap.get(d.source)) as SimNode;
        const tgt = (typeof d.target === 'object' ? d.target : nodeMap.get(d.target)) as SimNode;
        if (!src || !tgt) return;
        let mx: number, my: number;
        if (src.id === tgt.id) {
          mx = src.x;
          my = src.y - (NODE_RADIUS + 36);
        } else {
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const offsetX = (-dy / dist) * 12;
          const offsetY = (dx / dist) * 12;
          mx = (src.x + tgt.x) / 2 + offsetX;
          my = (src.y + tgt.y) / 2 + offsetY;
        }
        d3.select(this).attr('transform', `translate(${mx}, ${my})`);
      });

      const curNodeSelection = d3
        .select(nodesGroupRef.current!)
        .selectAll<SVGGElement, SimNode>('g.graph-node')
        .data(curNodes, (d) => d.id);

      curNodeSelection.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    };

    const performFitView = () => {
      if (!svgRef.current || !simulationRef.current) return;
      const curNodes = simulationRef.current.nodes() as SimNode[];
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      curNodes.forEach((n) => {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x);
        maxY = Math.max(maxY, n.y);
      });
      const padding = 80;
      const boundsW = maxX - minX + padding * 2;
      const boundsH = maxY - minY + padding * 2;
      if (!isFinite(boundsW) || !isFinite(boundsH) || boundsW <= 0 || boundsH <= 0) return;
      const { width: vw, height: vh } = container!.getBoundingClientRect();
      const scaleX = vw / boundsW;
      const scaleY = vh / boundsH;
      const scale = Math.min(scaleX, scaleY, 3);
      const translateX = vw / 2 - ((minX + maxX) / 2) * scale;
      const translateY = vh / 2 - ((minY + maxY) / 2) * scale;
      const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
      svg.transition().duration(500).call(zoom.transform, transform);
    };

    (svgRef.current as any).__fitViewFn = performFitView;
    (svgRef.current as any).__renderTick = renderTick;

    simulation.on('tick', renderTick);

    const handleResize = () => {
      if (!container) return;
      const { width: w, height: h } = container.getBoundingClientRect();
      svg.attr('width', w).attr('height', h);
      simulation.force('center', d3.forceCenter<SimNode>(w / 2, h / 2).strength(0.08));
      simulation.alpha(0.3).restart();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;
    const simulation = simulationRef.current;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current!);

    const nodesGroup = g.select<SVGGElement>('g.nodes-group');
    const linksGroup = g.select<SVGGElement>('g.links-group');
    const linkLabelsGroup = g.select<SVGGElement>('g.link-labels-group');

    const simNodes = plants.map((p) => {
      const existing = (simulation.nodes() as SimNode[]).find((n) => n.id === p.id);
      return {
        ...p,
        x: existing?.x ?? p.x,
        y: existing?.y ?? p.y,
        vx: existing?.vx,
        vy: existing?.vy,
      } as SimNode;
    });

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));
    const simLinks = links
      .filter((link) => nodeMap.has(link.source) && nodeMap.has(link.target))
      .map((link) => ({
        ...link,
        source: nodeMap.get(link.source)!,
        target: nodeMap.get(link.target)!,
      })) as SimLink[];

    simulation.nodes(simNodes);

    const linkForce = simulation.force('link') as d3.ForceLink<SimNode, SimLink>;
    if (linkForce) {
      linkForce.links(simLinks);
    }

    simulation.alpha(0.9).restart();
    if ((svgRef.current as any).__renderTick) {
      (svgRef.current as any).__renderTick();
    }

    const linkSelection = linksGroup
      .selectAll<SVGPathElement, SimLink>('path.link-path')
      .data(simLinks, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('class', 'link-path')
            .attr('stroke', (d) => symbiosisTypeColor[d.type])
            .attr('stroke-opacity', 0)
            .transition()
            .duration(300)
            .attr('stroke-opacity', 0.85)
            .selection(),
        (update) => update,
        (exit) => exit.transition().duration(300).attr('stroke-opacity', 0).remove()
      );

    linkSelection.attr('stroke', (d) => symbiosisTypeColor[d.type]);

    const labelGroups = linkLabelsGroup
      .selectAll<SVGGElement, SimLink>('g.link-label-group')
      .data(simLinks, (d) => d.id)
      .join(
        (enter) => {
          const grp = enter.append('g').attr('class', 'link-label-group').style('opacity', 0);
          grp
            .append('rect')
            .attr('class', 'link-label-bg')
            .attr('rx', 4)
            .attr('ry', 4);
          const text = grp
            .append('text')
            .attr('class', 'link-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .text((d) => symbiosisShortLabel[d.type]);
          text.each(function () {
            const el = this as SVGTextElement;
            const bbox = el.getBBox();
            const parent = el.parentNode as SVGGElement;
            const rect = parent.querySelector('rect') as SVGRectElement;
            if (rect) {
              rect.setAttribute('x', String(bbox.x - 4));
              rect.setAttribute('y', String(bbox.y - 2));
              rect.setAttribute('width', String(bbox.width + 8));
              rect.setAttribute('height', String(bbox.height + 4));
            }
          });
          return grp.transition().duration(500).style('opacity', 1).selection();
        },
        (update) => update,
        (exit) => exit.transition().duration(300).style('opacity', 0).remove()
      );

    const nodeSelection = nodesGroup
      .selectAll<SVGGElement, SimNode>('g.graph-node')
      .data(simNodes, (d) => d.id)
      .join(
        (enter) => {
          const nodeG = enter
            .append('g')
            .attr('class', (d) => `graph-node fade-in-node`)
            .attr('data-id', (d) => d.id)
            .style('opacity', 0);

          nodeG
            .append('circle')
            .attr('class', 'halo-circle')
            .attr('r', NODE_RADIUS_SELECTED + 6)
            .attr('fill', 'none')
            .attr('stroke', 'var(--color-accent)')
            .attr('stroke-width', 3)
            .style('display', 'none');

          nodeG
            .append('circle')
            .attr('class', 'node-bg')
            .attr('r', NODE_RADIUS)
            .attr('fill', '#2A2A3E')
            .attr('stroke', selectedNodeId ? '#3D3D5C' : '#3D3D5C')
            .attr('stroke-width', 2);

          nodeG
            .append('text')
            .attr('class', 'node-emoji')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', 20)
            .style('pointer-events', 'none')
            .style('user-select', 'none')
            .text((d) => d.icon);

          nodeG
            .append('text')
            .attr('class', 'node-label')
            .attr('dy', NODE_RADIUS + 14)
            .text((d) => d.name);

          return nodeG.transition().duration(500).style('opacity', 1).selection();
        },
        (update) => update,
        (exit) => exit.transition().duration(300).style('opacity', 0).remove()
      );

    nodeSelection.each(function (d) {
      const nodeG = d3.select(this);
      const halo = nodeG.select<SVGCircleElement>('circle.halo-circle');
      const bg = nodeG.select<SVGCircleElement>('circle.node-bg');
      const isSelected = selectedNodeId === d.id;

      halo.style('display', isSelected ? '' : 'none');
      bg.attr('r', isSelected ? NODE_RADIUS_SELECTED : NODE_RADIUS)
        .attr('stroke', isSelected ? 'var(--color-accent)' : '#3D3D5C')
        .attr('fill', isSelected ? '#34344A' : '#2A2A3E');

      if (isSelected) {
        nodeG.classed('selected', true);
      } else {
        nodeG.classed('selected', false);
      }

      let opacity = 1;
      if (matchedIds) {
        opacity = matchedIds.has(d.id) ? 1 : 0.2;
      }
      nodeG.classed('faded', opacity < 0.5);
      nodeG.style('opacity', opacity);
    });

    const dragBehavior = d3
      .drag<SVGGElement, SimNode>()
      .on('start', function (event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function (event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function (event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeSelection.call(dragBehavior);

    nodeSelection.on('click', function (event: MouseEvent, d) {
      event.stopPropagation();
      if (selectedNodeId === d.id) {
        setSelectedNode(null);
      } else {
        setSelectedNode(d.id);
      }
    });

    linkSelection.each(function (d) {
      const path = d3.select(this);
      let show = true;
      if (filterType !== 'all' && d.type !== filterType) show = false;
      if (matchedIds) {
        const src = d.source as SimNode;
        const tgt = d.target as SimNode;
        if (!matchedIds.has(src.id) && !matchedIds.has(tgt.id)) show = false;
      }
      path.classed('faded', !show);
    });

    labelGroups.each(function (d) {
      const grp = d3.select(this);
      let show = true;
      if (filterType !== 'all' && d.type !== filterType) show = false;
      if (matchedIds) {
        const src = d.source as SimNode;
        const tgt = d.target as SimNode;
        if (!matchedIds.has(src.id) && !matchedIds.has(tgt.id)) show = false;
      }
      grp.style('opacity', show ? '' : 0);
    });

    svg.on('click', () => setSelectedNode(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plants, links, selectedNodeId, matchedIds, filterType]);

  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;
    simulationRef.current.alpha(0.8).restart();
  }, [simulationResetKey]);

  useEffect(() => {
    if (svgRef.current && (svgRef.current as any).__fitViewFn) {
      (svgRef.current as any).__fitViewFn();
    }
  }, [fitViewKey]);

  const handleReset = () => resetSimulation();
  const handleFit = () => fitView();

  return (
    <div className="canvas-wrapper" ref={containerRef}>
      <div className="toolbar-left">
        <button className="tool-btn" onClick={handleReset} title="重置布局" type="button">
          ↻
        </button>
        <button className="tool-btn" onClick={handleFit} title="自适应缩放" type="button">
          ⊡
        </button>
      </div>

      <div className="search-panel">
        <input
          className="search-input"
          type="text"
          placeholder="🔍 搜索植物名称..."
          value={useAppStore.getState().searchQuery}
          onChange={(e) => useAppStore.getState().setSearchQuery(e.target.value)}
        />
        <select
          className="filter-select"
          value={useAppStore.getState().filterType}
          onChange={(e) =>
            useAppStore.getState().setFilterType(e.target.value as SymbiosisType | 'all')
          }
        >
          <option value="all">全部共生类型</option>
          <option value="mutualism">互惠互利</option>
          <option value="commensalism">单方受益</option>
          <option value="antagonism">拮抗抑制</option>
        </select>
      </div>

      <div className="hint-bar">
        <kbd>滚轮</kbd> 缩放 · <kbd>拖拽</kbd> 平移 · 点击节点查看详情 · 按住 <kbd>Ctrl</kbd> 拖拽节点创建连线
      </div>

      <svg ref={svgRef} className="graph-canvas" />
    </div>
  );
}
