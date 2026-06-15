import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useStore, Product, ChatMessage } from '../store';
import ChatPanel from '../components/ChatPanel';
import ProductForm from '../components/ProductForm';
import BoothSettings from '../components/BoothSettings';
import './ManagePage.css';

function ManagePage() {
  const { boothId } = useParams<{ boothId: string }>();
  const user = useStore((state) => state.user);
  const [booth, setBooth] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState('');
  const [onlineCount, setOnlineCount] = useState({ visitorCount: 0, sellerOnline: true });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!boothId) return;
    fetchBooth();
  }, [boothId, sortBy, sortOrder]);

  useEffect(() => {
    if (!boothId || !user) return;

    const socket = io('/socket.io', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-booth', { boothId, isSeller: true, sellerName: user.username });
    });

    socket.on('message-history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on('new-message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      if (message.is_seller === 0) {
        setHasNewMessage(true);
        playNotificationSound();
      }
    });

    socket.on('new-message-notification', (data: any) => {
      setHasNewMessage(true);
      playNotificationSound();
    });

    socket.on('online-count', (count: { visitorCount: number; sellerOnline: boolean }) => {
      setOnlineCount(count);
    });

    return () => {
      socket.emit('leave-booth', { boothId, isSeller: true });
      socket.disconnect();
    };
  }, [boothId, user]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // 忽略音频播放错误
    }
  };

  const fetchBooth = async () => {
    try {
      const res = await fetch(`/api/booth/${boothId}`);
      if (!res.ok) {
        throw new Error('展位不存在');
      }
      const data = await res.json();
      setBooth(data.booth);
      
      const productsRes = await fetch(`/api/booth/${boothId}/products?sort=${sortBy}&order=${sortOrder}`);
      const productsData = await productsRes.json();
      setProducts(productsData.products);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSaved = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    fetchBooth();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('确定要删除这件商品吗？')) return;

    try {
      const res = await fetch(`/api/product/${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('删除失败');
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err: any) {
      showError(err.message);
    }
  };

  const sendMessage = (content: string) => {
    if (!socketRef.current || !boothId || !user) return;
    
    socketRef.current.emit('send-message', {
      boothId,
      senderName: user.username,
      isSeller: true,
      content,
    });
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/exhibit/${boothId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('分享链接已复制到剪贴板！');
    }).catch(() => {
      showError('复制失败，请手动复制');
    });
  };

  if (loading) {
    return (
      <div className="manage-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="manage-page" style={{ backgroundColor: booth?.bg_color || '#FFF8F0' }}>
      {error && <div className="error-banner">{error}</div>}

      <header className="manage-header">
        <div className="header-content">
          <Link to="/" className="back-btn">← 首页</Link>
          <h1 className="manage-title">📦 库存管理</h1>
          <div className="header-actions">
            <button className="header-btn" onClick={() => setShowShareModal(true)}>
              🔗 分享
            </button>
            <button className="header-btn" onClick={() => setShowSettings(true)}>
              ⚙️ 设置
            </button>
            <Link to={`/exhibit/${boothId}`} className="header-btn primary">
              👁 预览
            </Link>
          </div>
        </div>
      </header>

      <div className="manage-body">
        <main className="manage-main">
          <div className="manage-toolbar">
            <div className="toolbar-left">
              <span className="product-count">共 {products.length}/20 件商品</span>
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
            <button
              className="add-product-btn"
              onClick={() => {
                setEditingProduct(null);
                setShowProductForm(true);
              }}
              disabled={products.length >= 20}
            >
              + 添加商品
            </button>
          </div>

          <div className="products-list">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="product-row"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <img src={product.image} alt={product.name} className="product-thumb" />
                <div className="product-row-info">
                  <h3 className="product-row-name">{product.name}</h3>
                  <span className="product-row-category">{product.category}</span>
                  <p className="product-row-desc">{product.description}</p>
                </div>
                <div className="product-row-price">¥{product.price}</div>
                <div className="product-row-stats">
                  <span>❤️ {product.favorite_count}</span>
                </div>
                <div className="product-row-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => {
                      setEditingProduct(product);
                      setShowProductForm(true);
                    }}
                  >
                    编辑
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>还没有商品，点击上方按钮添加第一件商品吧~</p>
            </div>
          )}
        </main>

        <aside className="chat-sidebar">
          <div className="chat-badge-wrapper">
            {hasNewMessage && <span className="chat-badge">新消息</span>}
          </div>
          <ChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            isSeller={true}
            onlineCount={onlineCount}
            hasNewMessage={hasNewMessage}
            onMessageRead={() => setHasNewMessage(false)}
            sellerName={user?.username}
          />
        </aside>
      </div>

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          boothId={boothId!}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSaved={handleProductSaved}
        />
      )}

      {showSettings && booth && (
        <BoothSettings
          booth={booth}
          onClose={() => setShowSettings(false)}
          onSaved={(updatedBooth) => {
            setBooth(updatedBooth);
            setShowSettings(false);
          }}
        />
      )}

      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🔗 分享展位</h3>
            <div className="share-link">
              <input
                type="text"
                value={`${window.location.origin}/exhibit/${boothId}`}
                readOnly
              />
              <button onClick={copyShareLink}>复制</button>
            </div>
            {booth?.cover_image && (
              <div className="share-preview">
                <img src={booth.cover_image} alt="展位封面" />
              </div>
            )}
            <p className="share-tip">访客打开链接即可浏览展位并与你实时聊天</p>
            <button className="close-btn" onClick={() => setShowShareModal(false)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagePage;
