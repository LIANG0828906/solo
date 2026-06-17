import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, ShoppingCart, Settings, ArrowLeft, Play } from 'lucide-react';
import { useStore } from '@/store';
import type { Record } from '@/store';
import RecordCard from './components/RecordCard';
import PlayerBar from './components/PlayerBar';
import CartDrawer from './components/CartDrawer';

const GENRES = ['全部', '摇滚', '爵士', '电子', '古典', '嘻哈', '灵魂乐'];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function FrontendModule() {
  const navigate = useNavigate();
  const { id } = useParams();
  const records = useStore((s) => s.records);
  const loading = useStore((s) => s.loading);
  const fetchRecords = useStore((s) => s.fetchRecords);
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const setCurrentTrack = useStore((s) => s.setCurrentTrack);

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('全部');
  const [cartOpen, setCartOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch = !debouncedSearch ||
        r.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        r.artist.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchGenre = genre === '全部' || r.genre === genre;
      return matchSearch && matchGenre;
    });
  }, [records, debouncedSearch, genre]);

  const currentRecord: Record | undefined = id ? records.find((r) => r.id === id) : undefined;

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (id && !loading && records.length > 0 && !currentRecord) {
    return (
      <div>
        <Navbar cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
        <div className="page-container" style={{ padding: '60px 0', color: '#fff', textAlign: 'center' }}>
          <p>唱片不存在</p>
          <Link to="/" style={{ color: '#FFD700', textDecoration: 'underline', marginTop: 16, display: 'inline-block' }}>
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar cartCount={cartCount} onCartClick={() => setCartOpen(true)} />

      {id ? (
        <DetailPage record={currentRecord} onAddToCart={addToCart} onPlayTrack={(r, t) => setCurrentTrack({
          recordId: r.id,
          recordTitle: r.title,
          coverUrl: r.coverUrl,
          trackNumber: t.number,
          trackTitle: t.title,
        })} />
      ) : (
        <HomePage
          loading={loading}
          records={filteredRecords}
          search={search}
          onSearchChange={setSearch}
          genre={genre}
          onGenreChange={setGenre}
        />
      )}

      <PlayerBar />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

function Navbar({ cartCount, onCartClick }: { cartCount: number; onCartClick: () => void }) {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/')}>黑胶唱片店</div>
      <div className="navbar-right">
        <span className="navbar-link" onClick={() => navigate('/')}>首页</span>
        <button className="navbar-icon-btn" onClick={onCartClick}>
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
        <button className="navbar-icon-btn" onClick={() => navigate('/admin')}>
          <Settings size={20} />
        </button>
      </div>
    </nav>
  );
}

function HomePage({
  loading,
  records,
  search,
  onSearchChange,
  genre,
  onGenreChange,
}: {
  loading: boolean;
  records: Record[];
  search: string;
  onSearchChange: (v: string) => void;
  genre: string;
  onGenreChange: (v: string) => void;
}) {
  return (
    <div className="frontend-home">
      <div className="page-container">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="搜索艺术家或专辑"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <select className="genre-select" value={genre} onChange={(e) => onGenreChange(e.target.value)}>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading-spinner">加载中...</div>
        ) : records.length === 0 ? (
          <div className="loading-spinner">没有找到相关唱片</div>
        ) : (
          <div className="records-grid">
            {records.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailPage({
  record,
  onAddToCart,
  onPlayTrack,
}: {
  record?: Record;
  onAddToCart: (r: Record) => void;
  onPlayTrack: (r: Record, t: { number: number; title: string }) => void;
}) {
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  if (!record) {
    return (
      <div className="detail-page">
        <div className="page-container">
          <div className="loading-spinner" style={{ color: '#333' }}>加载中...</div>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    onAddToCart(record);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="detail-page">
      <div className="page-container">
        <div className="detail-card">
          <div className="detail-cover">
            <img src={record.coverUrl} alt={record.title} />
          </div>
          <div className="detail-info">
            <h1>{record.title}</h1>
            <div className="detail-artist">{record.artist}</div>
            <div className="detail-year">{record.year} · {record.genre}</div>
            <div className="detail-price">¥{record.price.toFixed(2)}</div>

            <div className="tracks-title">曲目列表</div>
            <ul className="tracks-list">
              {record.tracks.map((track) => (
                <li key={track.number} className="track-item" onClick={() => onPlayTrack(record, track)}>
                  <span className="track-number">{track.number}.</span>
                  <span className="track-name">{track.title}</span>
                  <Play size={14} color="#999" />
                </li>
              ))}
            </ul>

            <button
              className={`btn-add-cart ${added ? 'added' : ''}`}
              style={{ background: added ? '#2ECC71' : '' }}
              onClick={handleAddToCart}
            >
              {added ? '已加入购物车' : '加入购物车'}
            </button>
          </div>
        </div>
        <span className="back-link" onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> 返回列表
        </span>
      </div>
    </div>
  );
}
