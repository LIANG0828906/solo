import * as d3 from 'd3';
import type { DepEdge, DepGraph, FileNode, ImportType } from '../../types';
import { GraphEvents, type GraphEventCallbacks } from './GraphEvents';

type D3Node = d3.SimulationNodeDatum & FileNode;
type D3Edge = d3.SimulationLinkDatum<D3Node> & DepEdge;

const EDGE_COLORS: Record<ImportType, string> = {
  internal: '#A6E3A1',
  external: '#89B4FA',
  namespace: '#F38BA8',
};

export class GraphRenderer {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private gRoot: d3.Selection<SVGGElement, unknown, null, undefined>;
  private gEdges: d3.Selection<SVGGElement, unknown, null, undefined>;
  private gNodes: d3.Selection<SVGGElement, unknown, null, undefined>;
  private defs: d3.Selection<SVGDefsElement, unknown, null, undefined>;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private simulation: d3.Simulation<D3Node, D3Edge> | null = null;
  private events: GraphEvents;
  private width = 0;
  private height = 0;
  private currentGraph: DepGraph | null = null;
  private highlightNodeId: string | null = null;
  private searchQuery = '';

  constructor(container: HTMLElement, callbacks?: GraphEventCallbacks) {
    this.container = container;
    this.events = new GraphEvents(callbacks);

    this.svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('display', 'block')
      .style('cursor', 'grab');

    this.defs = this.svg.append('defs');

    this.buildArrowMarkers();

    this.gRoot = this.svg.append('g');
    this.gEdges = this.gRoot.append('g').attr('class', 'edges');
    this.gNodes = this.gRoot.append('g').attr('class', 'nodes');

    this.zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        this.gRoot.attr('transform', event.transform.toString());
        this.events.emit('onZoom', { k: event.transform.k, x: event.transform.x, y: event.transform.y });
      });

    this.svg.call(this.zoom);
    this.svg.on('click', () => this.events.emit('onBackgroundClick'));

    this.resize();
    window.addEventListener('resize', this.resize);
  }

  private buildArrowMarkers() {
    const types: ImportType[] = ['internal', 'external', 'namespace'];
    types.forEach((t) => {
      this.defs
        .append('marker')
        .attr('id', `arrow-${t}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', EDGE_COLORS[t]);
    });
  }

  private resize = () => {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`);
    if (this.simulation) {
      this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
      this.simulation.alpha(0.3).restart();
    }
  };

  setCallbacks(callbacks: GraphEventCallbacks) {
    this.events.setCallbacks(callbacks);
  }

  highlightNode(id: string | null) {
    this.highlightNodeId = id;
    this.updateNodeStyles();
    this.updateEdgeStyles();
  }

  setSearchQuery(q: string) {
    this.searchQuery = q;
    this.updateNodeStyles();
    this.updateEdgeStyles();
  }

  render(graph: DepGraph) {
    this.currentGraph = graph;
    const nodes: D3Node[] = graph.nodes
      .filter((n) => !n.isDirectory)
      .map((n, i) => ({
        ...n,
        x: n.x ?? this.width / 2 + Math.cos(i) * 100,
        y: n.y ?? this.height / 2 + Math.sin(i) * 100,
      }));

    const idSet = new Set(nodes.map((n) => n.id));
    const edges: D3Edge[] = graph.edges
      .filter((e) => idSet.has(e.source) && idSet.has(e.target))
      .map((e) => ({
        ...e,
        source: e.source,
        target: e.target,
      }));

    if (this.simulation) this.simulation.stop();

    this.simulation = d3
      .forceSimulation<D3Node>(nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Edge>(edges)
          .id((d) => d.id)
          .distance(120)
          .strength(0.6),
      )
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collide', d3.forceCollide().radius(38))
      .alphaDecay(0.02);

    this.drawEdges(edges);
    this.drawNodes(nodes);

    this.simulation.on('tick', () => {
      this.gEdges
        .selectAll<SVGLineElement, D3Edge>('line.edge')
        .attr('x1', (d) => (d.source as D3Node).x ?? 0)
        .attr('y1', (d) => (d.source as D3Node).y ?? 0)
        .attr('x2', (d) => (d.target as D3Node).x ?? 0)
        .attr('y2', (d) => (d.target as D3Node).y ?? 0);

      this.gNodes
        .selectAll<SVGGElement, D3Node>('g.node')
        .attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    setTimeout(() => this.fitToView(), 600);
  }

  update(graph: DepGraph) {
    this.render(graph);
  }

  private drawEdges(edges: D3Edge[]) {
    const sel = this.gEdges.selectAll<SVGLineElement, D3Edge>('line.edge').data(edges, (d) => d.id);

    sel.exit().remove();

    const enter = sel
      .enter()
      .append('line')
      .attr('class', 'edge')
      .attr('stroke', (d) => EDGE_COLORS[d.type])
      .attr('stroke-width', 1.6)
      .attr('stroke-opacity', 0)
      .attr('fill', 'none')
      .attr('marker-end', (d) => `url(#arrow-${d.type})`)
      .attr('stroke-dasharray', '1000')
      .attr('stroke-dashoffset', '1000');

    enter
      .transition()
      .duration(500)
      .delay((_, i) => i * 20)
      .attr('stroke-opacity', 0.8)
      .attr('stroke-dashoffset', 0);

    sel.merge(enter);
    this.updateEdgeStyles();
  }

  private drawNodes(nodes: D3Node[]) {
    const sel = this.gNodes.selectAll<SVGGElement, D3Node>('g.node').data(nodes, (d) => d.id);

    sel.exit().remove();

    const enter = sel
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('opacity', 0)
      .style('cursor', 'pointer');

    enter
      .append('circle')
      .attr('r', 0)
      .attr('fill', '#45475A')
      .attr('stroke', '#89B4FA')
      .attr('stroke-width', 2);

    enter
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 26)
      .attr('fill', '#CDD6F4')
      .attr('font-size', 11)
      .attr('font-family', 'Consolas, Menlo, monospace')
      .attr('pointer-events', 'none')
      .text((d) => d.name);

    enter
      .transition()
      .duration(500)
      .delay((_, i) => i * 15)
      .attr('opacity', 1)
      .select('circle')
      .attr('r', 16);

    const merged = enter.merge(sel);

    const drag = d3
      .drag<SVGGElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) this.simulation?.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        this.events.emit('onNodeDragStart', d);
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation?.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        this.events.emit('onNodeDragEnd', d);
      });

    merged.call(drag);

    let clickTimer: number | null = null;
    merged
      .on('click', (event, d) => {
        event.stopPropagation();
        if (clickTimer) {
          window.clearTimeout(clickTimer);
          clickTimer = null;
          this.events.emit('onNodeDoubleClick', d);
        } else {
          clickTimer = window.setTimeout(() => {
            clickTimer = null;
            this.events.emit('onNodeClick', d);
          }, 220);
        }
      })
      .on('mouseenter', function () {
        d3.select(this).select('circle').transition().duration(150).attr('r', 20).attr('stroke-width', 3);
      })
      .on('mouseleave', function (_, d) {
        const isSel = d.id === (this as GraphRenderer).highlightNodeId;
        d3.select(this)
          .select('circle')
          .transition()
          .duration(150)
          .attr('r', isSel ? 19 : 16)
          .attr('stroke-width', isSel ? 3 : 2);
      }.bind(this));

    this.updateNodeStyles();
  }

  private updateNodeStyles() {
    const query = this.searchQuery.toLowerCase().trim();
    const selected = this.highlightNodeId;

    this.gNodes.selectAll<SVGGElement, D3Node>('g.node').each(function (d) {
      const g = d3.select(this);
      const matches = !query || d.name.toLowerCase().includes(query) || d.path.toLowerCase().includes(query);
      const isSelected = d.id === selected;

      const hasSelNeighbor =
        selected &&
        (d.importedBy.includes(selected) ||
          this.currentGraph?.edges.some(
            (e) =>
              (e.source === selected && e.target === d.id) || (e.target === selected && e.source === d.id),
          ));

      const opacity = !query && !selected ? 1 : isSelected || matches || hasSelNeighbor ? 1 : 0.18;

      g.style('opacity', opacity);
      g.select('circle')
        .attr('stroke', isSelected ? '#CBA6F7' : matches && query ? '#F9E2AF' : '#89B4FA')
        .attr('stroke-width', isSelected ? 3 : 2)
        .attr('r', isSelected ? 19 : 16)
        .attr('fill', d.imports.length > d.importedBy.length ? '#585B70' : '#45475A');
    }, this);
  }

  private updateEdgeStyles() {
    const selected = this.highlightNodeId;
    const query = this.searchQuery.toLowerCase().trim();

    this.gEdges.selectAll<SVGLineElement, D3Edge>('line.edge').each(function (d) {
      const line = d3.select(this);
      const src = typeof d.source === 'object' ? (d.source as D3Node).id : d.source;
      const tgt = typeof d.target === 'object' ? (d.target as D3Node).id : d.target;

      const touched =
        !selected && !query
          ? true
          : selected && (src === selected || tgt === selected)
            ? true
            : query &&
                ((this.currentGraph?.nodes.find((n) => n.id === src)?.name.toLowerCase().includes(query) ?? false) ||
                  (this.currentGraph?.nodes.find((n) => n.id === tgt)?.name.toLowerCase().includes(query) ?? false));

      line.style('opacity', touched ? 0.85 : 0.08).attr(
        'stroke-width',
        selected && (src === selected || tgt === selected) ? 2.6 : 1.6,
      );
    }, this);
  }

  fitToView() {
    const bbox = this.gRoot.node()?.getBBox();
    if (!bbox || bbox.width === 0 || bbox.height === 0) return;
    const scale = Math.min(this.width / bbox.width, this.height / bbox.height, 1.2) * 0.85;
    const tx = this.width / 2 - ((bbox.x + bbox.width / 2) * scale);
    const ty = this.height / 2 - ((bbox.y + bbox.height / 2) * scale);
    this.svg
      .transition()
      .duration(500)
      .call(this.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
    if (this.simulation) this.simulation.stop();
    this.svg.remove();
  }
}
