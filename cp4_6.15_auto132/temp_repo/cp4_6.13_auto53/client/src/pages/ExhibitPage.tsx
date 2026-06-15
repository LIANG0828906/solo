import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useStore, Product, ChatMessage } from '../store';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import ChatPanel from '../components/ChatPanel';
import './ExhibitPage.css';

function ExhibitPage() {
  const { id } = useParams<{ id: string }>();
  const [booth, setBooth] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState('');
  const [onlineCount, setOnlineCount] = useState({ visitorCount: 0, sellerOnline: false });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const visitorId = useStore((state) => state.visitorId);
  const user = useStore((state) => state.user);

  useEffect(() => {
    if (!id) return;
    fetchBooth();
  }, [id, sortBy, sortOrder]);

  useEffect(() => {
    if (!id) return;

    const socket = io('/socket.io', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-booth', { boothId: id, isSeller: false });
    });

    socket.on('message-history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on('new-message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      setHasNewMessage(true);
    });

    socket.on('online-count', (count: { visitorCount: number; sellerOnline: boolean }) => {
      setOnlineCount(count);
    });

    return () => {
      socket.emit('leave-booth', { boothId: id, isSeller: false });
      socket.disconnect();
    };
  }, [id]);

  const fetchBooth = async () => {
    try {
      const res = await fetch(`/api/booth/${id}?sort=${sortBy}&order=${sortOrder}`);
      if (!res.ok) {
        throw new Error('展位不存在');
      }
      const data = await res.json();
      setBooth(data.booth);
      setProducts(data.products);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (content: string) => {
    if (!socketRef.current || !id) return;
    
    socketRef.current.emit('send-message', {
      boothId: id,
      senderName: `访客${visitorId.slice(-4)}`,
      isSeller: false,
      content,
    });
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  if (loading) {
    return (
      <div className="exhibit-page loading-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error && !booth) {
    return (
      <div className="exhibit-page error-page">
        <div className="error-container">
          <h2>😢 {error}</h2>
          <Link to="/" className="btn-primary">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="exhibit-page" style={{ backgroundColor: booth?.bg_color || '#FFF8F0' }}>
      {error && <div className="error-banner">{error}</div>}

      <header className="exhibit-header">
        <div className="header-content">
          <Link to="/" className="back-btn">← 返回</Link>
          <h1 className="booth-title">{booth?.name}</h1>
          <div className="header-spacer" />
        </div>
      </header>

      <div className="exhibit-body">
        <main className="exhibit-main">
          <div className="booth-intro">
            <p className="booth-description">{booth?.description}</p>
            <div className="booth-meta">
              <span className="meta-item">👁 访问 {booth?.visit_count || 0}</span>
              <span className="meta-item">📦 商品 {products.length}</span>
            </div>
          </div>

          <div className="sort-bar">
            <span className="sort-label">排序：</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at">上架时间</option>
              <option value="price">价格</option>
              <option value="favorite_count">热度</option>
            </select>
            <button
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
            </button>
          </div>

          <div className="products-grid">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
                delay={index * 0.05}
                primaryColor={booth?.primary_color}
              />
            ))}
          </div>

          {products.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>暂无商品</p>
            </div>
          )}
        </main>

        <aside className="chat-sidebar">
          <ChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            isSeller={false}
            onlineCount={onlineCount}
            hasNewMessage={hasNewMessage}
            onMessageRead={() => setHasNewMessage(false)}
            rateLimit={10}
          />
        </aside>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          primaryColor={booth?.primary_color}
          accentColor={booth?.accent_color}
          visitorId={visitorId}
          onFavoriteUpdate={(count) => {
            setProducts((prev) =>
              prev.map((p) =>
                p.id === selectedProduct.id ? { ...p, favorite_count: count } : p
              )
            );
          }}
        />
      )}
    </div>
  );
}

export default ExhibitPage;
