import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3-force';
import type { Character, CharacterRelation, RelationType } from '@/types';
import { useEditorStore } from '@/store';
import { UserPlus, Link2, Plus, X } from 'lucide-react';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  type: RelationType;
  source: GraphNode | string;
  target: GraphNode | string;
}

interface CharacterGraphProps {
  characters: Character[];
  relations: CharacterRelation[];
}

const RELATION_COLORS: Record<RelationType, string> = {
  ally: '#4ade80',
  enemy: '#f87171',
  lover: '#f472b6',
  unknown: '#a78bfa',
};

const RELATION_LABELS: Record<RelationType, string> = {
  ally: '盟友',
  enemy: '敌对',
  lover: '恋人',
  unknown: '未知',
};

export const CharacterGraph: React.FC<CharacterGraphProps> = ({ characters, relations }) => {
  const store = useEditorStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [hoveredRelation, setHoveredRelation] = useState<CharacterRelation | null>(null);
  const [showAddChar, setShowAddChar] = useState(false);
  const [showAddRel, setShowAddRel] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharColor, setNewCharColor] = useState('#e94560');
  const [relFrom, setRelFrom] = useState('');
  const [relTo, setRelTo] = useState('');
  const [relType, setRelType] = useState<RelationType>('ally');

  const [size, setSize] = useState({ width: 360, height: 360 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({ width: cr.width, height: Math.min(cr.width, 420) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphNodes: GraphNode[] = useMemo(() => characters.map((c) => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    color: c.color,
    x: size.width / 2 + (Math.random() - 0.5) * 100,
    y: size.height / 2 + (Math.random() - 0.5) * 100,
  })), [characters, size]);

  const graphLinks: GraphLink[] = useMemo(() => relations.map((r) => ({
    id: r.id,
    type: r.type,
    source: r.sourceId,
    target: r.targetId,
  })), [relations]);

  useEffect(() => {
    if (!svgRef.current || graphNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    characters.forEach((c) => {
      const pattern = defs.append('pattern')
        .attr('id', `avatar-${c.id}`)
        .attr('patternUnits', 'objectBoundingBox')
        .attr('width', 1)
        .attr('height', 1);
      pattern.append('image')
        .attr('href', c.avatar)
        .attr('width', 44)
        .attr('height', 44);
    });

    const linkGroup = svg.append('g').attr('class', 'links');
    const linkLabelGroup = svg.append('g').attr('class', 'link-labels');
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    const nodeLabelGroup = svg.append('g').attr('class', 'node-labels');

    const simulation = d3.forceSimulation<GraphNode>(graphNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphLinks)
        .id((d: any) => d.id)
        .distance(110)
        .strength(0.6))
      .force('charge', d3.forceManyBody().strength(-320))
      .force('center', d3.forceCenter(size.width / 2, size.height / 2))
      .force('collision', d3.forceCollide().radius(40));

    const links = linkGroup.selectAll('line')
      .data(graphLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => RELATION_COLORS[d.type])
      .attr('stroke-width', 2.5)
      .attr('stroke-opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const rel = relations.find((r) => r.id === d.id);
        if (rel) setHoveredRelation(rel);
        d3.select(event.currentTarget)
          .attr('stroke-width', 4)
          .attr('stroke-opacity', 1);
      })
      .on('mouseleave', (event) => {
        setHoveredRelation(null);
        d3.select(event.currentTarget)
          .attr('stroke-width', 2.5)
          .attr('stroke-opacity', 0.7);
      });

    const linkLabels = linkLabelGroup.selectAll('text')
      .data(graphLinks)
      .enter()
      .append('text')
      .text((d) => RELATION_LABELS[d.type])
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .attr('font-size', '10px')
      .attr('fill', (d) => RELATION_COLORS[d.type])
      .attr('font-weight', '600')
      .attr('paint-order', 'stroke')
      .attr('stroke', '#16213e')
      .attr('stroke-width', '3px')
      .attr('stroke-linejoin', 'round')
      .style('pointer-events', 'none');

    const nodes = nodeGroup.selectAll('circle')
      .data(graphNodes)
      .enter()
      .append('circle')
      .attr('r', 22)
      .attr('fill', (d) => `url(#avatar-${d.id})`)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 26)
          .attr('stroke-width', 4);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 22)
          .attr('stroke-width', 3);
      })
      .on('click', (event, d) => {
        const char = characters.find((c) => c.id === d.id);
        if (char) setSelectedCharacter(char);
      })
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    const nodeLabels = nodeLabelGroup.selectAll('text')
      .data(graphNodes)
      .enter()
      .append('text')
      .text((d) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 40)
      .attr('font-size', '11px')
      .attr('fill', '#e2e8f0')
      .attr('font-weight', '500')
      .style('pointer-events', 'none')
      .attr('paint-order', 'stroke')
      .attr('stroke', '#1a1a2e')
      .attr('stroke-width', '2.5px')
      .attr('stroke-linejoin', 'round');

    simulation.on('tick', () => {
      links
        .attr('x1', (d) => (d.source as GraphNode).x!)
        .attr('y1', (d) => (d.source as GraphNode).y!)
        .attr('x2', (d) => (d.target as GraphNode).x!)
        .attr('y2', (d) => (d.target as GraphNode).y!);

      linkLabels
        .attr('x', (d) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', (d) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);

      nodes
        .attr('cx', (d) => d.x!)
        .attr('cy', (d) => d.y!);

      nodeLabels
        .attr('x', (d) => d.x!)
        .attr('y', (d) => d.y!);
    });

    return () => {
      simulation.stop();
    };
  }, [graphNodes, graphLinks, size, characters, relations]);

  const handleAddCharacter = () => {
    if (!newCharName.trim()) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${newCharColor}33"/><circle cx="50" cy="40" r="20" fill="#e2e8f0"/><ellipse cx="50" cy="85" rx="32" ry="20" fill="#e2e8f0"/></svg>`;
    store.addCharacter(newCharName.trim(), newCharColor, `data:image/svg+xml;base64,${btoa(svg)}`);
    setNewCharName('');
    setShowAddChar(false);
  };

  const handleAddRelation = () => {
    if (!relFrom || !relTo || relFrom === relTo) return;
    store.addRelation(relFrom, relTo, relType);
    setRelFrom('');
    setRelTo('');
    setShowAddRel(false);
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Link2 size={14} className="text-[#e94560]" />
          <h3 className="font-display text-sm font-semibold text-white">角色关系图谱</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowAddChar(!showAddChar)}
            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-[#e94560] transition-colors"
            title="添加角色"
          >
            <UserPlus size={14} />
          </button>
          <button
            onClick={() => setShowAddRel(!showAddRel)}
            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-[#e94560] transition-colors"
            title="添加关系"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {showAddChar && (
        <div className="p-3 border-b border-white/5 bg-[#0f3460]/20 animate-fade-in">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              placeholder="角色名称..."
              className="flex-1 px-2 py-1.5 text-xs rounded bg-[#1a1a2e] border border-white/10 text-white focus:border-[#e94560] outline-none transition-colors"
            />
            <input
              type="color"
              value={newCharColor}
              onChange={(e) => setNewCharColor(e.target.value)}
              className="w-8 h-8 rounded bg-transparent border border-white/10 cursor-pointer"
            />
          </div>
          <button
            onClick={handleAddCharacter}
            className="w-full py-1.5 text-xs rounded btn-gradient text-white font-medium"
          >
            添加角色
          </button>
        </div>
      )}

      {showAddRel && (
        <div className="p-3 border-b border-white/5 bg-[#0f3460]/20 animate-fade-in space-y-2">
          <select
            value={relFrom}
            onChange={(e) => setRelFrom(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded bg-[#1a1a2e] border border-white/10 text-white focus:border-[#e94560] outline-none"
          >
            <option value="">选择角色A...</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={relType}
            onChange={(e) => setRelType(e.target.value as RelationType)}
            className="w-full px-2 py-1.5 text-xs rounded bg-[#1a1a2e] border border-white/10 text-white focus:border-[#e94560] outline-none"
          >
            <option value="ally">🤝 盟友</option>
            <option value="enemy">⚔️ 敌对</option>
            <option value="lover">💕 恋人</option>
            <option value="unknown">❓ 未知</option>
          </select>
          <select
            value={relTo}
            onChange={(e) => setRelTo(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded bg-[#1a1a2e] border border-white/10 text-white focus:border-[#e94560] outline-none"
          >
            <option value="">选择角色B...</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={handleAddRelation}
            className="w-full py-1.5 text-xs rounded btn-gradient text-white font-medium"
          >
            建立关系
          </button>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center relative overflow-hidden p-2">
        {characters.length === 0 ? (
          <div className="text-center text-slate-500 text-xs">
            <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
            <p>暂无角色</p>
            <p className="mt-1 text-[10px]">点击 + 添加第一个角色</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={size.width}
            height={size.height}
            className="animate-fade-in"
          />
        )}

        {hoveredRelation && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded text-[11px] text-white bg-[#16213e] border border-white/10 shadow-lg animate-fade-in">
            <span style={{ color: RELATION_COLORS[hoveredRelation.type] }} className="font-semibold">
              {RELATION_LABELS[hoveredRelation.type]}
            </span>
            {' '}关系:{' '}
            <span className="font-medium">
              {characters.find(c => c.id === hoveredRelation.sourceId)?.name}
            </span>
            {' ↔ '}
            <span className="font-medium">
              {characters.find(c => c.id === hoveredRelation.targetId)?.name}
            </span>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/5">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px]">
          {(Object.keys(RELATION_COLORS) as RelationType[]).map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: RELATION_COLORS[t] }} />
              <span className="text-slate-400">{RELATION_LABELS[t]}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedCharacter && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#16213e] rounded-lg p-4 w-full max-w-xs card-shadow animate-float-up border border-white/10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCharacter.avatar}
                  alt={selectedCharacter.name}
                  className="w-12 h-12 rounded-full border-2"
                  style={{ borderColor: selectedCharacter.color }}
                />
                <div>
                  <h4 className="font-display font-semibold text-white">{selectedCharacter.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCharacter.color }} />
                    <span className="text-[10px] text-slate-500">角色ID: {selectedCharacter.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCharacter(null)}
                className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>相关关系:</span>
                <span className="text-white font-medium">
                  {relations.filter(r => r.sourceId === selectedCharacter.id || r.targetId === selectedCharacter.id).length}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>参与剧情:</span>
                <span className="text-white font-medium">
                  {store.nodes.filter(n => n.dialogues.some(d => d.characterId === selectedCharacter.id)).length}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  store.deleteCharacter(selectedCharacter.id);
                  setSelectedCharacter(null);
                }}
                className="flex-1 py-1.5 text-[11px] rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                删除角色
              </button>
              <button
                onClick={() => setSelectedCharacter(null)}
                className="flex-1 py-1.5 text-[11px] rounded btn-gradient text-white"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterGraph;
