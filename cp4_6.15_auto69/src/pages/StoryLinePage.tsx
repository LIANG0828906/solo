import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { formatRelative } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getRoomById, getStoryById, addBranchNode } from '@/DataService';
import { createLayoutSimulation, buildVinePath } from '@/utils/graphLayout';
import { cn } from '@/lib/utils';
import type { RoomMeta, StoryNode, RenderNode, Author, SentimentType } from '@/types';

const NODE_COLORS: Record<SentimentType, { fill: string; stroke: string; glow: string }> = {
  neutral: { fill: '#1E3A5F', stroke: '#0F2744', glow: 'node-glow' },
  positive: { fill: '#2D6A4F', stroke: '#1B4332', glow: 'node-glow-green' },
  conflict: { fill: '#9B2335', stroke: '#6B1824', glow: 'node-glow-red' },
};

const LINK_COLORS: Record<SentimentType, string> = {
  positive: '#2D6A4F',
  conflict: '#9B2335',
  neutral: '#1E3A5F',
};

function getNodeColors(node: RenderNode): { fill: string; stroke: string; glow: string } {
  if (node.parentId === null) {
    return { fill: '#1E3A5F', stroke: '#0F2744', glow: 'node-glow' };
  }
  return NODE_COLORS[node.sentiment];
}

const NODE_RADIUS = 36;
const SELECTED_RADIUS = 44;

function getLocalAuthor(): Author {
  const stored = localStorage.getItem('story_vine_local_author');
  if (stored) return JSON.parse(stored) as Author;
  return {
    id: 'temp-author',
    name: '访客用户',
    avatarColor: '#45B7D1',
  };
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '…';
}

export default function StoryLinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<ReturnType<typeof createLayoutSimulation> | null>(null);

  const [room, setRoom] = useState<RoomMeta | null>(null);
  const [nodes, setNodes] = useState<RenderNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<RenderNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<RenderNode | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refreshStory = useCallback((roomId: string) => {
    const story = getStoryById(roomId);
    if (simulationRef.current) {
      const renderNodes = simulationRef.current.updateNodes(story);
      setNodes(renderNodes);
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    const roomData = getRoomById(id);
    if (!roomData) {
      navigate('/');
      return;
    }
    setRoom(roomData);

    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const sim = createLayoutSimulation(width, height);
    simulationRef.current = sim;

    const story = getStoryById(id);
    const renderNodes = sim.updateNodes(story);
    setNodes(renderNodes);

    const d3Svg = d3.select(svg);

    sim.simulation.on('tick', () => {
      d3Svg.selectAll<SVGCircleElement, RenderNode>('circle.story-node')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      const nodeMap = new Map(renderNodes.map(n => [n.id, n]));
      d3Svg.selectAll<SVGPathElement, { source: RenderNode; target: RenderNode; sentiment: string }>('path.vine-link')
        .attr('d', d => buildVinePath(d.source.x, d.source.y, d.target.x, d.target.y));
    });

    return () => {
      sim.simulation.stop();
    };
  }, [id, navigate]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const links: Array<{ source: RenderNode; target: RenderNode; sentiment: string }> = [];
    for (const node of nodes) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        links.push({
          source: nodeMap.get(node.parentId)!,
          target: node,
          sentiment: node.sentiment,
        });
      }
    }

    const d3Svg = d3.select(svg);

    const defs = d3Svg.selectAll('defs').data([null]);
    defs.enter().append('defs');

    const linkSel = d3Svg.selectAll<SVGPathElement, typeof links[0]>('path.vine-link')
      .data(links, d => `${d.source.id}-${d.target.id}`);

    linkSel.exit().remove();

    const linkEnter = linkSel.enter()
      .append('path')
      .attr('class', 'vine-link stroke-animate')
      .attr('fill', 'none')
      .attr('stroke-width', 2.5);

    linkEnter.merge(linkSel)
      .attr('stroke', d => LINK_COLORS[d.sentiment] || LINK_COLORS.neutral)
      .style('animation-delay', d => `${d.target.depth * 100}ms`);

    const nodeSel = d3Svg.selectAll<SVGCircleElement, RenderNode>('circle.story-node')
      .data(nodes, d => d.id);

    nodeSel.exit().remove();

    const nodeEnter = nodeSel.enter()
      .append('circle')
      .attr('class', 'story-node cursor-pointer node-bounce-in')
      .attr('r', NODE_RADIUS)
      .style('opacity', 0)
      .style('transform-origin', d => `${d.x}px ${d.y}px`);

    const merged = nodeEnter.merge(nodeSel);

    merged
      .attr('fill', d => getNodeColors(d).fill)
      .attr('stroke', d => getNodeColors(d).stroke)
      .attr('stroke-width', 2.5)
      .style('animation-delay', d => `${d.depth * 100}ms`)
      .style('opacity', null)
      .attr('r', d => selectedNode?.id === d.id ? SELECTED_RADIUS : NODE_RADIUS)
      .attr('class', d => cn(
        'story-node cursor-pointer',
        selectedNode?.id === d.id ? getNodeColors(d).glow : ''
      ));

    merged.on('mouseenter', function(event, d) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setHoverPos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
      setHoveredNode(d);
    });
    merged.on('mouseleave', () => setHoveredNode(null));
    merged.on('click', function(_, d) {
      setSelectedNode(d);
    });

  }, [nodes, selectedNode]);

  const handleSubmit = async () => {
    if (!room || !selectedNode || content.trim().length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const author = getLocalAuthor();
      addBranchNode(room.id, selectedNode.id, content.trim(), author);
      setContent('');
      setSelectedNode(null);
      refreshStory(room.id);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedNoChildren = selectedNode && selectedNode.childrenIds.length === 0;
  const contentLen = content.length;

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur border-b border-gray-100 sticky top-0 z-20">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-600 hover:text-[#1E3A5F] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">返回</span>
        </Link>
        <h1 className="font-serif text-xl md:text-2xl font-bold text-[#2D2D2D] tracking-wide">
          {room.title}
        </h1>
        <Link
          to={`/story/${room.id}/read`}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8C] text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
        >
          <BookOpen size={16} />
          <span>进入阅读模式</span>
        </Link>
      </header>

      <div ref={containerRef} className="flex-1 paper-texture relative" style={{ minHeight: '80vh' }}>
        <svg ref={svgRef} className="w-full h-full" />

        {hoveredNode && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              left: hoverPos.x,
              top: hoverPos.y,
              transform: 'translate(-50%, -110%)',
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100"
              style={{ width: 280 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: hoveredNode.author.avatarColor }}
                >
                  {hoveredNode.author.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#2D2D2D] truncate">
                    {hoveredNode.author.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatRelative(hoveredNode.createdAt, Date.now(), { locale: zhCN })}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {truncateText(hoveredNode.content, 80)}
              </div>
            </div>
            <div
              className="tooltip-arrow"
              style={{
                left: '50%',
                bottom: '-5px',
                transform: 'translateX(-50%) rotate(45deg)',
              }}
            />
          </div>
        )}
      </div>

      {selectedNoChildren && (
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white/95 to-white/80 backdrop-blur border-t border-gray-100 py-6 px-6 z-20">
          <div className="max-w-[720px] mx-auto">
            <div className="bg-white/90 rounded-2xl shadow-lg border border-gray-100 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#1E3A5F]">续写故事 · 在选中节点处分支</span>
                <span
                  className={cn(
                    'text-xs font-medium tabular-nums',
                    contentLen >= 300 || contentLen === 0 ? 'text-red-500' : 'text-gray-400'
                  )}
                >
                  {contentLen}/300
                </span>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 300))}
                rows={3}
                placeholder="写下你的续写内容，让故事在你的笔触下分叉生长…"
                className="w-full resize-none bg-gray-50/50 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 border border-gray-200 focus:border-[#1E3A5F]/40 focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all font-sans leading-relaxed"
                style={{ minHeight: 80 }}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={content.trim().length === 0 || submitting}
                  className={cn(
                    'px-6 py-2.5 rounded-full text-white text-sm font-medium shadow-md transition-all',
                    content.trim().length === 0 || submitting
                      ? 'bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8C] opacity-50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#1E3A5F] to-[#2D5A8C] hover:shadow-lg hover:-translate-y-0.5'
                  )}
                >
                  {submitting ? '提交中…' : '生成分支节点'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
