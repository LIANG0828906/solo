import G6, { Graph as G6Graph, INode, IEdge } from '@antv/g6';
import type { GraphNode, GraphEdge } from '../../types';

export interface GraphRendererOptions {
  container: HTMLElement;
  width: number;
  height: number;
  onNodeDoubleClick?: (nodeId: string) => void;
  onCanvasClick?: () => void;
}

export class GraphRenderer {
  private graph: G6Graph | null = null;
  private options: GraphRendererOptions;
  private isHighlighted: boolean = false;

  constructor(options: GraphRendererOptions) {
    this.options = options;
    this.init();
  }

  private init() {
    G6.registerNode(
      'custom-circle',
      {
        draw(cfg: any, group: any) {
          const r = cfg.size / 2 || 10;
          const shape = group.addShape('circle', {
            attrs: {
              x: 0,
              y: 0,
              r,
              fill: cfg.style?.fill || '#FF6B6B',
              stroke: cfg.style?.stroke || 'transparent',
              lineWidth: cfg.style?.lineWidth || 0,
              shadowColor: cfg.style?.shadowColor || 'transparent',
              shadowBlur: cfg.style?.shadowBlur || 0,
              opacity: cfg.style?.opacity ?? 1,
            },
            name: 'circle-shape',
          });

          if (cfg.label) {
            group.addShape('text', {
              attrs: {
                x: 0,
                y: r + 14,
                text: cfg.label,
                textAlign: 'center',
                textBaseline: 'middle',
                fill: '#FFFFFF',
                fontSize: 11,
                opacity: cfg.style?.opacity ?? 1,
              },
              name: 'label-shape',
            });
          }
          return shape;
        },
        setState(name, value, item: any) {
          if (!item) return;
          const group = item.getContainer();
          const circle = group.find((ele: any) => ele.get('name') === 'circle-shape');
          const label = group.find((ele: any) => ele.get('name') === 'label-shape');
          const model = item.getModel();

          if (name === 'highlighted') {
            if (value) {
              circle.attr('stroke', '#FFD700');
              circle.attr('lineWidth', 3);
              circle.attr('shadowColor', '#FFD700');
              circle.attr('shadowBlur', 15);
              circle.attr('r', (model.size / 2 || 10) * 1.2);
              circle.attr('opacity', 1);
              if (label) label.attr('opacity', 1);
            } else {
              circle.attr('stroke', 'transparent');
              circle.attr('lineWidth', 0);
              circle.attr('shadowBlur', 0);
              circle.attr('r', model.size / 2 || 10);
            }
          }
          if (name === 'dimmed') {
            if (value) {
              circle.attr('opacity', 0.3);
              if (label) label.attr('opacity', 0.3);
            } else {
              circle.attr('opacity', 1);
              if (label) label.attr('opacity', 1);
            }
          }
        },
      },
      'single-node'
    );

    G6.registerEdge(
      'custom-line',
      {
        draw(cfg: any, group: any) {
          const startPoint = cfg.startPoint;
          const endPoint = cfg.endPoint;
          return group.addShape('line', {
            attrs: {
              x1: startPoint.x,
              y1: startPoint.y,
              x2: endPoint.x,
              y2: endPoint.y,
              stroke: cfg.style?.stroke || '#4A4A5A',
              lineWidth: cfg.style?.lineWidth || 1,
              opacity: cfg.style?.opacity ?? 1,
              cursor: 'pointer',
            },
            name: 'line-shape',
          });
        },
        setState(name, value, item: any) {
          if (!item) return;
          const shape = item.getContainer().find((ele: any) => ele.get('name') === 'line-shape');
          if (name === 'hover') {
            if (value) {
              shape.attr('stroke', '#00FFAA');
              shape.attr('lineWidth', 2);
            } else {
              shape.attr('stroke', '#4A4A5A');
              shape.attr('lineWidth', 1);
            }
          }
          if (name === 'visible') {
            shape.attr('opacity', value ? 1 : 0);
          }
        },
      },
      'single-edge'
    );

    const { container, width, height } = this.options;

    this.graph = new G6.Graph({
      container,
      width,
      height,
      fitView: true,
      fitViewPadding: 40,
      minZoom: 0.5,
      maxZoom: 3,
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
      },
      defaultNode: {
        type: 'custom-circle',
        size: 20,
      },
      defaultEdge: {
        type: 'custom-line',
        style: {
          stroke: '#4A4A5A',
          lineWidth: 1,
        },
      },
      nodeStateStyles: {},
      edgeStateStyles: {},
    });

    this.graph.on('node:dblclick', (evt: any) => {
      const node = evt.item as INode;
      if (node && this.options.onNodeDoubleClick) {
        this.options.onNodeDoubleClick(node.getID());
      }
    });

    this.graph.on('canvas:click', () => {
      if (this.options.onCanvasClick) {
        this.options.onCanvasClick();
      }
    });

    this.graph.on('edge:mouseenter', (evt: any) => {
      const edge = evt.item as IEdge;
      if (edge) {
        this.graph?.setItemState(edge, 'hover', true);
      }
    });

    this.graph.on('edge:mouseleave', (evt: any) => {
      const edge = evt.item as IEdge;
      if (edge) {
        this.graph?.setItemState(edge, 'hover', false);
      }
    });
  }

  public render(nodes: GraphNode[], edges: GraphEdge[]) {
    if (!this.graph) return;

    const g6Nodes = nodes
      .filter((n) => n.visible)
      .map((n) => ({
        id: n.id,
        label: n.name,
        x: n.x,
        y: n.y,
        size: n.radius * 2,
        style: {
          fill: n.color,
          opacity: 1,
        },
      }));

    const g6Edges = edges
      .filter((e) => e.visible)
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      }));

    this.graph.data({ nodes: g6Nodes, edges: g6Edges });
    this.graph.render();
    this.graph.fitView(40);
    this.isHighlighted = false;
  }

  public applyHighlight(highlightedIds: Set<string>) {
    if (!this.graph) return;

    const nodes = this.graph.getNodes();
    const edges = this.graph.getEdges();

    const hasHighlight = highlightedIds.size > 0;

    nodes.forEach((node) => {
      const id = node.getID();
      const isHighlighted = highlightedIds.has(id);
      this.graph?.setItemState(node, 'highlighted', hasHighlight && isHighlighted);
      this.graph?.setItemState(node, 'dimmed', hasHighlight && !isHighlighted);
    });

    edges.forEach((edge) => {
      const model = edge.getModel();
      const sourceId = typeof model.source === 'object' ? (model.source as any).id : model.source;
      const targetId = typeof model.target === 'object' ? (model.target as any).id : model.target;
      const edgeVisible =
        !hasHighlight || (highlightedIds.has(sourceId) && highlightedIds.has(targetId));
      this.graph?.setItemState(edge, 'visible', edgeVisible);
    });

    this.isHighlighted = hasHighlight;
  }

  public resetHighlight() {
    if (!this.graph) return;
    this.applyHighlight(new Set());
  }

  public updateSize(width: number, height: number) {
    if (!this.graph) return;
    this.graph.changeSize(width, height);
    this.graph.fitView(40);
  }

  public destroy() {
    if (this.graph) {
      this.graph.destroy();
      this.graph = null;
    }
  }
}
