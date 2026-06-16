import { useEffect, useRef, useCallback, useMemo } from 'react';
import cytoscape, { Core, ElementDefinition, LayoutOptions } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useStore } from '@/store';
import {
  mapFrequencyToSize,
  mapFrequencyToColor,
  mapWeightToWidth,
} from '@/knowledge/ConceptExtractor';
import { Network, ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';

cytoscape.use(dagre);

export function KnowledgeGraph() {
  const { concepts, edges, setHighlightPosition, note } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const minMaxFreq = useMemo(() => {
    if (concepts.length === 0) return { min: 0, max: 0 };
    const frequencies = concepts.map((c) => c.frequency);
    return {
      min: Math.min(...frequencies),
      max: Math.max(...frequencies),
    };
  }, [concepts]);

  const maxWeight = useMemo(() => {
    if (edges.length === 0) return 1;
    return Math.max(...edges.map((e) => e.weight));
  }, [edges]);

  const elements: ElementDefinition[] = useMemo(() => {
    const nodes: ElementDefinition[] = concepts.map((concept) => ({
      data: {
        id: concept.id,
        name: concept.name,
        frequency: concept.frequency,
        firstOccurrence: concept.firstOccurrence,
        size: mapFrequencyToSize(
          concept.frequency,
          minMaxFreq.min,
          minMaxFreq.max
        ),
        color: mapFrequencyToColor(
          concept.frequency,
          minMaxFreq.min,
          minMaxFreq.max
        ),
      },
    }));

    const edgeElements: ElementDefinition[] = edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        width: mapWeightToWidth(edge.weight, maxWeight),
      },
    }));

    return [...nodes, ...edgeElements];
  }, [concepts, edges, minMaxFreq, maxWeight]);

  const layoutOptions: LayoutOptions = useMemo(
    () => ({
      name: 'dagre',
      rankDir: 'LR',
      animate: true,
      animationDuration: 500,
      nodeSep: 80,
      rankSep: 100,
    }),
    []
  );

  const initCytoscape = useCallback(() => {
    if (!containerRef.current || cyRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(name)',
            'font-size': 12,
            'color': '#E0E0E0',
            'text-outline-color': '#0F2027',
            'text-outline-width': 2,
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 'data(size)',
            'height': 'data(size)',
            'border-width': 2,
            'border-color': '#E0E0E0',
            'transition-property': 'background-color, width, height, border-width',
            'transition-duration': 0.2,
            'cursor': 'pointer',
          } as any,
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#F1C40F',
          } as any,
        },
        {
          selector: 'node.hovered',
          style: {
            'border-width': 3,
            'border-color': '#F1C40F',
            'underlay-color': 'data(color)',
            'underlay-padding': 8,
            'underlay-opacity': 0.4,
          } as any,
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'line-color': 'rgba(52, 152, 219, 0.6)',
            'width': 'data(width)',
            'opacity': 0.7,
            'line-cap': 'round',
            'transition-property': 'line-color, width, opacity',
            'transition-duration': 0.2,
          } as any,
        },
        {
          selector: 'edge:hover',
          style: {
            'line-color': 'rgba(233, 69, 96, 0.8)',
            'width': 'data(width)',
            'opacity': 1,
          } as any,
        },
      ],
      layout: layoutOptions,
      wheelSensitivity: 0.3,
    });

    cyRef.current.on('mouseover', 'node', (event) => {
      const node = event.target;
      const data = node.data();
      const renderedPos = node.renderedPosition();

      const originalSize = node.data('size');
      node.data('originalSize', originalSize);
      node.style('width', originalSize * 1.2);
      node.style('height', originalSize * 1.2);
      node.addClass('hovered');

      if (tooltipRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        tooltipRef.current.style.left = `${renderedPos.x + containerRect.left + 20}px`;
        tooltipRef.current.style.top = `${renderedPos.y + containerRect.top}px`;
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.innerHTML = `
          <div class="font-medium">${data.name}</div>
          <div class="text-sm opacity-70">出现频率: ${data.frequency}次</div>
        `;
      }
    });

    cyRef.current.on('mouseout', 'node', (event) => {
      const node = event.target;
      const originalSize = node.data('originalSize');
      if (originalSize) {
        node.style('width', originalSize);
        node.style('height', originalSize);
      }
      node.removeClass('hovered');

      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
    });

    cyRef.current.on('tap', 'node', (event) => {
      const node = event.target;
      const firstOccurrence = node.data('firstOccurrence');

      if (firstOccurrence !== undefined) {
        setHighlightPosition(firstOccurrence);
      }
    });
  }, [elements, layoutOptions, setHighlightPosition]);

  useEffect(() => {
    initCytoscape();

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [initCytoscape]);

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.elements().remove();
      cyRef.current.add(elements);
      cyRef.current.layout(layoutOptions).run();
    }
  }, [elements, layoutOptions]);

  const handleZoomIn = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.center();
    }
  }, []);

  if (concepts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Sparkles size={48} className="text-[#E0E0E0]/30 mb-4" />
        <p className="text-[#E0E0E0]/50 text-sm">
          开始协作编辑，知识图谱将自动生成
        </p>
        <p className="text-[#E0E0E0]/30 text-xs mt-2">
          笔记内容变化后3秒自动提取概念
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#16213E] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#0F3460] bg-[#0F3460]/30">
        <div className="flex items-center gap-2">
          <Network size={18} className="text-[#3498DB]" />
          <h3 className="text-[#E0E0E0] font-medium">
            知识图谱 <span className="text-[#E0E0E0]/50">({concepts.length}个概念)</span>
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-2 text-[#E0E0E0]/70 hover:text-[#E0E0E0] hover:bg-[#0F3460] rounded-lg transition-all duration-200"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-[#E0E0E0]/70 hover:text-[#E0E0E0] hover:bg-[#0F3460] rounded-lg transition-all duration-200"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-[#E0E0E0]/70 hover:text-[#E0E0E0] hover:bg-[#0F3460] rounded-lg transition-all duration-200"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative"
        style={{
          background: 'linear-gradient(135deg, #0F2027 0%, #203A43 100%)',
        }}
      />

      <div
        ref={tooltipRef}
        className="fixed z-50 bg-[#2C3E50] text-[#ECF0F1] px-3 py-2 rounded-lg shadow-lg pointer-events-none"
        style={{
          display: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          minWidth: '120px',
        }}
      />

      <div className="px-4 py-2 border-t border-[#0F3460] bg-[#0F3460]/20">
        <div className="flex items-center justify-between text-xs text-[#E0E0E0]/50">
          <span>点击节点跳转至笔记位置</span>
          <span>节点大小/颜色 → 词频映射</span>
        </div>
      </div>
    </div>
  );
}
