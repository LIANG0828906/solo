import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Link as LinkIcon, Brain, Calendar } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { useStore } from '@/store';
import { fetchCard } from '@/api';
import { CATEGORY_COLORS, CATEGORY_LABELS, INTERVAL_LABELS, type Card, type Category } from '@/types';
import '@/components/CardDetail.css';

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cards, removeCard } = useStore();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 });

  useEffect(() => {
    if (!id) return;
    const existingCard = cards.find((c) => c.id === id);
    if (existingCard) {
      setCard(existingCard);
      setLoading(false);
    } else {
      loadCard(id);
    }
  }, [id, cards]);

  const loadCard = async (cardId: string) => {
    setLoading(true);
    try {
      const data = await fetchCard(cardId);
      setCard(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: 300 });
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

  const linkedCards = card
    ? card.linkedCardIds
        .map((linkId) => cards.find((c) => c.id === linkId))
        .filter(Boolean) as Card[]
    : [];

  const graphData = card
    ? {
        nodes: [
          { id: card.id, title: card.title, category: card.category, linkCount: card.linkedCardIds.length },
          ...linkedCards.map((c) => ({
            id: c.id,
            title: c.title,
            category: c.category,
            linkCount: c.linkedCardIds.length,
          })),
        ],
        links: linkedCards.map((c) => ({
          source: card.id,
          target: c.id,
          type: c.category === card.category ? 'same-category' : 'cross-category',
          value: c.category === card.category ? 3 : 1,
        })),
      }
    : { nodes: [], links: [] };

  if (loading) {
    return (
      <div className="card-detail">
        <div className="loading-state">加载中...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="card-detail">
        <div className="error-state">卡片不存在</div>
      </div>
    );
  }

  return (
    <div className="card-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          返回
        </button>
        <div className="detail-actions">
          <button className="action-btn edit-btn" onClick={() => navigate(`/card/edit/${card.id}`)}>
            <Edit2 size={16} />
            编辑
          </button>
          <button className="action-btn delete-btn" onClick={handleDelete}>
            <Trash2 size={16} />
            删除
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <div
            className="detail-category-badge"
            style={{ backgroundColor: CATEGORY_COLORS[card.category] }}
          >
            {CATEGORY_LABELS[card.category]}
          </div>

          <h1 className="detail-title">{card.title}</h1>

          <div className="detail-meta-row">
            <div className="meta-item">
              <Calendar size={14} />
              <span>复习周期: {INTERVAL_LABELS[card.reviewInterval]}</span>
            </div>
            <div className="meta-item">
              <Brain size={14} />
              <span>已复习 {card.reviewCount} 次</span>
            </div>
            <div className="meta-item">
              <LinkIcon size={14} />
              <span>{card.linkedCardIds.length} 个关联</span>
            </div>
          </div>

          <div
            className="detail-html-content"
            dangerouslySetInnerHTML={{ __html: card.content }}
          />
        </div>

        <div className="detail-sidebar">
          {card.linkedCardIds.length > 0 && (
            <div className="detail-graph-section">
              <h3>
                <LinkIcon size={16} />
                关联图谱
              </h3>
              <div className="detail-graph-container" ref={containerRef}>
                <ForceGraph2D
                  ref={graphRef}
                  width={dimensions.width}
                  height={dimensions.height}
                  graphData={graphData as any}
                  nodeId="id"
                  nodeLabel="title"
                  nodeColor={(node: any) => CATEGORY_COLORS[node.category as Category] || '#7f8c8d'}
                  nodeVal={(node: any) => node.linkCount + 1}
                  nodeRelSize={3}
                  linkColor="#ccc"
                  linkWidth={1.5}
                  onNodeClick={(node: any) => navigate(`/card/${node.id}`)}
                  cooldownTicks={50}
                  d3AlphaDecay={0.05}
                  d3VelocityDecay={0.3}
                  backgroundColor="#fafafa"
                />
              </div>

              <div className="linked-cards-list">
                <h4>关联卡片</h4>
                <div className="linked-list">
                  {linkedCards.map((linked) => (
                    <Link
                      key={linked.id}
                      to={`/card/${linked.id}`}
                      className="linked-card-item"
                      style={{ borderLeftColor: CATEGORY_COLORS[linked.category] }}
                    >
                      <span
                        className="linked-card-dot"
                        style={{ backgroundColor: CATEGORY_COLORS[linked.category] }}
                      />
                      {linked.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
