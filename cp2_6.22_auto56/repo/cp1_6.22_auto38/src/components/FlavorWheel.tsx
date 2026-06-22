import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { HierarchyDatum, flavorColors } from '../modules/data';
import { FlavorLogItem } from '../modules/api';

interface FlavorWheelProps {
  data: HierarchyDatum;
  onSelectFlavor: (flavor: FlavorLogItem) => void;
  selectedIds: string[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  description?: string;
}

const WIDTH = 600;
const HEIGHT = 600;
const RADIUS = Math.min(WIDTH, HEIGHT) / 2 - 20;

export default function FlavorWheel({ data, onSelectFlavor, selectedIds }: FlavorWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    name: '',
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fading, setFading] = useState(false);

  const renderWheel = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${WIDTH / 2}, ${HEIGHT / 2})`);

    const defs = svg.append('defs');
    const filter = defs
      .append('filter')
      .attr('id', 'shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter
      .append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 4)
      .attr('stdDeviation', 6)
      .attr('flood-opacity', 0.25);

    const buildHierarchy = (node: HierarchyDatum, _parentExpanded: boolean): HierarchyDatum[] => {
      const result: HierarchyDatum[] = [];
      if (node.depth === 0 && node.children) {
        for (const child of node.children) {
          result.push(child);
          if (child.id === expandedId && child.children) {
            for (const grandchild of child.children) {
              result.push(grandchild);
              if (grandchild.children) {
                for (const greatGrandchild of grandchild.children) {
                  result.push(greatGrandchild);
                }
              }
            }
          }
        }
      }
      return result;
    };

    const flatNodes = buildHierarchy(data, false);

    const partition = (nodes: HierarchyDatum[]) => {
      const byDepth: Record<number, HierarchyDatum[]> = {};
      for (const node of nodes) {
        if (!byDepth[node.depth]) byDepth[node.depth] = [];
        byDepth[node.depth].push(node);
      }
      return byDepth;
    };

    const byDepth = partition(flatNodes);

    const layer0 = byDepth[1] || [];
    const layer1 = byDepth[2] || [];
    const layer2 = byDepth[3] || [];

    const arc = d3
      .arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle(0.008)
      .padRadius(RADIUS);

    const drawLayer = (
      nodes: HierarchyDatum[],
      innerR: number,
      outerR: number,
      parentAngles?: Record<string, { x0: number; x1: number }>
    ) => {
      const dataWithAngles: Array<{
        node: HierarchyDatum;
        x0: number;
        x1: number;
      }> = [];

      if (parentAngles && nodes.length > 0) {
        const grouped: Record<string, HierarchyDatum[]> = {};
        for (const node of nodes) {
          for (const parentId of Object.keys(parentAngles)) {
            const parent = layer0.find((p) => p.children?.some((c) => c.id === node.id));
            if (parent && parent.id === parentId) {
              if (!grouped[parentId]) grouped[parentId] = [];
              grouped[parentId].push(node);
            }
            const grandParent = layer1.find((p) => p.id === node.id || p.children?.some((c) => c.id === node.id));
            if (grandParent) {
              const topParent = layer0.find((p) => p.children?.some((c) => c.id === grandParent.id));
              if (topParent && topParent.id === parentId) {
                if (!grouped[parentId]) grouped[parentId] = [];
                if (!grouped[parentId].includes(node)) grouped[parentId].push(node);
              }
            }
          }
        }

        for (const [parentId, children] of Object.entries(grouped)) {
          const parent = parentAngles[parentId];
          if (!parent) continue;
          const range = parent.x1 - parent.x0;
          const step = range / children.length;
          children.forEach((child, i) => {
            dataWithAngles.push({
              node: child,
              x0: parent.x0 + i * step,
              x1: parent.x0 + (i + 1) * step,
            });
          });
        }
      } else {
        const total = Math.max(nodes.length, 1);
        const step = (2 * Math.PI) / total;
        nodes.forEach((node, i) => {
          dataWithAngles.push({
            node,
            x0: i * step,
            x1: (i + 1) * step,
          });
        });
      }

      const paths = g
        .selectAll(`.arc-${innerR}`)
        .data(dataWithAngles, (d: any) => d.node.id)
        .enter()
        .append('path')
        .attr('class', `arc arc-${innerR}`)
        .attr('d', (d: any) =>
          arc({
            x0: d.x0,
            x1: d.x1,
          } as any) as string
        )
        .attr('innerRadius', innerR)
        .attr('outerRadius', outerR)
        .each(function (d: any) {
          (this as any)._current = { x0: d.x0, x1: d.x1, innerR, outerR };
        });

      paths
        .attr('fill', (d: any) => {
          const baseColor = flavorColors[d.node.id] || flavorColors[d.node.id.split('_').slice(0, -1).join('_')] || '#8D6E63';
          const alpha = Math.max(0.35, 1 - (d.node.depth - 1) * 0.22);
          return hexToRgba(baseColor, alpha);
        })
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1)
        .attr('cursor', 'pointer')
        .style('transform-origin', 'center');

      paths
        .on('mouseenter', function (_event: MouseEvent, d: any) {
          d3.select(this)
            .transition()
            .duration(200)
            .ease(d3.easeCubicOut)
            .attrTween('d', function () {
              const el = this as any;
              const current = el._current || { x0: d.x0, x1: d.x1 };
              const expandOuter = outerR * 1.8;
              return (t: number) => {
                const newOuter = d3.interpolate(outerR, expandOuter)(t);
                return arc({
                  x0: current.x0,
                  x1: current.x1,
                  innerRadius: innerR,
                  outerRadius: newOuter,
                } as any) as string;
              };
            });

          d3.select(this).attr('filter', 'url(#shadow)');

          const wrapper = wrapperRef.current;
          if (wrapper) {
            const rect = wrapper.getBoundingClientRect();
            const midAngle = (d.x0 + d.x1) / 2;
            const midRadius = (innerR + outerR) / 2;
            setTooltip({
              visible: true,
              x: WIDTH / 2 + Math.sin(midAngle) * midRadius - rect.left + 80,
              y: HEIGHT / 2 - Math.cos(midAngle) * midRadius - rect.top + 120,
              name: d.node.name,
              description: d.node.description,
            });
          }
        })
        .on('mousemove', function (event: MouseEvent) {
          const wrapper = wrapperRef.current;
          if (wrapper) {
            const rect = wrapper.getBoundingClientRect();
            setTooltip((prev) => ({
              ...prev,
              x: event.clientX - rect.left + 15,
              y: event.clientY - rect.top + 15,
            }));
          }
        })
        .on('mouseleave', function (_event: MouseEvent, d: any) {
          d3.select(this)
            .transition()
            .duration(200)
            .ease(d3.easeCubicOut)
            .attrTween('d', function () {
              const el = this as any;
              const current = el._current || { x0: d.x0, x1: d.x1 };
              return (t: number) => {
                const newOuter = d3.interpolate(outerR * 1.8, outerR)(t);
                return arc({
                  x0: current.x0,
                  x1: current.x1,
                  innerRadius: innerR,
                  outerRadius: newOuter,
                } as any) as string;
              };
            })
            .attr('filter', null);

          setTooltip((prev) => ({ ...prev, visible: false }));
        })
        .on('click', function (event: MouseEvent, d: any) {
          event.stopPropagation();
          if (d.node.children && d.node.children.length > 0) {
            setExpandedId((prev) => (prev === d.node.id ? null : d.node.id));
          } else {
            onSelectFlavor({
              id: d.node.id,
              name: d.node.name,
              intensity: d.node.intensity || 3,
            });
          }
        });

      paths
        .filter((d: any) => selectedIds.includes(d.node.id))
        .attr('stroke', '#FFD700')
        .attr('stroke-width', 2.5);

      return dataWithAngles;
    };

    const layer0Data = drawLayer(layer0, RADIUS * 0.15, RADIUS * 0.4);

    const parentAngles0: Record<string, { x0: number; x1: number }> = {};
    for (const d of layer0Data) {
      parentAngles0[d.node.id] = { x0: d.x0, x1: d.x1 };
    }

    const layer1Data = drawLayer(layer1, RADIUS * 0.4, RADIUS * 0.7, parentAngles0);

    const parentAngles1: Record<string, { x0: number; x1: number }> = {};
    for (const d of layer1Data) {
      const topParent = layer0.find((p) => p.children?.some((c) => c.id === d.node.id));
      if (topParent) {
        parentAngles1[d.node.id] = { x0: d.x0, x1: d.x1 };
      }
    }

    drawLayer(layer2, RADIUS * 0.7, RADIUS * 0.95, { ...parentAngles0, ...parentAngles1 });

    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', RADIUS * 0.13)
      .attr('fill', '#6D4C41')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#FFFFFF')
      .attr('font-size', 28)
      .text('☕');
  }, [data, expandedId, onSelectFlavor, selectedIds]);

  useEffect(() => {
    setFading(true);
    const timer = setTimeout(() => {
      renderWheel();
      setFading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [renderWheel]);

  return (
    <div ref={wrapperRef} className="wheel-wrapper">
      <svg
        ref={svgRef}
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={`wheel-svg ${fading ? 'fading' : ''}`}
      />
      {tooltip.visible && (
        <div
          className="wheel-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="tooltip-title">{tooltip.name}</div>
          {tooltip.description && (
            <div className="tooltip-desc">{tooltip.description}</div>
          )}
        </div>
      )}
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
