import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Link as LinkIcon, Calendar, RefreshCw } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { useStore } from '@/store';
import { fetchCard, fetchGraphData, removeLink } from '@/api';
import { CATEGORY_COLORS, CATEGORY_LABELS, INTERVAL_LABELS, type Card, type GraphNode, type GraphLink } from '@/types';
import '@/components/CardDetail.css';

export default function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cards, removeCard } = useStore();
  const [card, setCard] = useState<Card | null>(null);
  const [linkedCards, setLinkedCards] = useState<Card[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    loadCardDetail();
  }, [id, cards]);

  const loadCardDetail = async () => {
    if (!id) return;
    try {
      const c = await fetchCard(id);
      setCard(c);
      const linked = cards.filter((card) => c.linkedCardIds.includes(card.id));
      setLinkedCards(linked);

      const gData = await fetchGraphData();
      const relatedNodeIds = new Set([id, ...c.linkedCardIds]);
      const relatedNodes = gData.nodes
        .filter((n) => relatedNodeIds.has(n.id))
        .map((n) => ({
          ...n,
          x: Math.random() * 400 - 200,
          y: Math.random() * 300 - 150,
        }));
      const relatedLinks = gData.links.filter(
        (l) => relatedNodeIds.has(typeof l.source === 'string' ? l.source : (l.source as GraphNode).id) &&
               relatedNodeIds.has(typeof l.target === 'string' ? l.target : (l.target as GraphNode).id)
      );
      setGraphData({ nodes: relatedNodes, links: relatedLinks });
    } catch {
      setCard(null);
    }
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(rect.height, 300) });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除这张卡片吗？')) return;
    await removeCard(id);
    navigate('/');
  };

  const handleUnlink = async (targetId: string) => {
    if (!id) return;
    await removeLink(id, targetId);
    await loadCardDetail();
  };

  if (!card) {
    return (
      <div className="card-detail">
        <div className="detail-loading">加载中...</div>
      </div>
    );
  }

  const nextReviewDate = new Date(card.nextReviewAt);
  const isOverdue = nextReviewDate <= new Date();

  return (
    <div className="card-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          返回
        </button>
        <div className="detail-actions">
          <button className="action-btn edit-btn" onClick={() => navigate(`/card/edit/${card.id}`)}>
            <Edit3 size={14} />
            编辑
          </button>
          <button className="action-btn delete-btn" onClick={handleDelete}>
            <Trash2 size={14} />
            删除
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <div className="detail-category" style={{ backgroundColor: CATEGORY_COLORS[card.category] }}>
            {CATEGORY_LABELS[card.category]}
          </div>

          <h1 className="detail-title">{card.title}</h1>

          <div className="detail-meta">
            <span className="meta-item">
              <Calendar size={14} />
              创建于 {new Date(card.createdAt).toLocaleDateString('zh-CN')}
            </span>
            <span className="meta-item">
              <RefreshCw size={14} />
              复习 {card.reviewCount} 次
            </span>
            <span className="meta-item">
              间隔：{INTERVAL_LABELS[card.reviewInterval]}
            </span>
            <span className={`meta-item ${isOverdue ? 'overdue' : ''}`}>
              下次复习：{nextReviewDate.toLocaleDateString('zh-CN')}
              {isOverdue && ' (已到期)'}
            </span>
          </div>

          <div className="detail-body" dangerouslySetInnerHTML={{ __html: card.content }} />
        </div>

        <div className="detail-sidebar">
          <div className="linked-section">
            <h3>
              <LinkIcon size={14} />
              关联卡片 ({card.linkedCardIds.length})
            </h3>
            {linkedCards.length === 0 ? (
              <p className="no-linked">暂无关联卡片</p>
            ) : (
              <div className="linked-list">
                {linkedCards.map((lc) => (
                  <div
                    key={lc.id}
                    className="linked-card-item"
                    style={{ borderLeftColor: CATEGORY_COLORS[lc.category] }}
                    onClick={() => navigate(`/card/${lc.id}`)}
                  >
                    <span className="linked-card-title">{lc.title}</span>
                    <span className="linked-card-cat">{CATEGORY_LABELS[lc.category]}</span>
                    <button
                      className="unlink-small-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlink(lc.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {graphData && graphData.nodes.length > 0 && (
            <div className="detail-graph-section">
              <h3>关联图谱</h3>
              <div className="detail-graph" ref={containerRef}>
                <ForceGraph2D
                  width={dimensions.width}
                  height={dimensions.height}
                  graphData={graphData}
                  nodeId="id"
                  nodeLabel="title"
                  nodeColor={(node: any) => CATEGORY_COLORS[node.category] || '#7f8c8d'}
                  nodeVal={(node: any) => node.id === card.id ? 3 : 1}
                  nodeRelSize={5}
                  linkColor={() => '#aaa'}
                  linkWidth={1}
                  onNodeClick={(node: any) => navigate(`/card/${node.id}`)}
                  linkDirectionalArrowLength={0}
                  cooldownTicks={80}
                  backgroundColor="#fafafa"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useRef } from 'react';
