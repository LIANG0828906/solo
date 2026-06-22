import { useState, useEffect, useRef } from 'react';
import { itemsApi, Item, User } from '../api';
import ItemCard from '../components/ItemCard';
import './Home.css';

interface HomeProps {
  user: User | null;
}

const categories = ['all', '家电', '家具', '书籍', '其他'];
const sortOptions = [
  { value: 'distance', label: '距离最近' },
  { value: 'newest', label: '最新发布' },
  { value: 'points', label: '积分优先' },
];

const Home = ({ user }: HomeProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('distance');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchItems = () => {
    setLoading(true);
    itemsApi
      .getNearbyItems({
        category: category === 'all' ? undefined : category,
        sort,
        community: user?.community,
      })
      .then((data) => {
        setItems(data.items);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, [category, sort, user?.community]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(value.length > 0);
    }, 200);
  };

  const getSuggestions = () => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return items
      .filter((item) => item.title.toLowerCase().includes(query))
      .slice(0, 5);
  };

  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <div className="home-page">
      <div className="search-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索闲置物品..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && (
            <div className="search-suggestions" ref={suggestionsRef}>
              {getSuggestions().length > 0 ? (
                getSuggestions().map((item) => (
                  <div
                    key={item.id}
                    className="suggestion-item"
                    onClick={() => {
                      setSearchQuery(item.title);
                      setShowSuggestions(false);
                    }}
                  >
                    {item.title}
                  </div>
                ))
              ) : (
                <div className="suggestion-empty">没有找到相关物品</div>
              )}
            </div>
          )}
        </div>

        <div className="filter-bar">
          <div className="category-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>

          <div className="sort-select">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="items-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="item-card-skeleton">
                <div className="skeleton image-skeleton"></div>
                <div className="skeleton text-skeleton"></div>
                <div className="skeleton text-skeleton short"></div>
              </div>
            ))
          : filteredItems.map((item) => <ItemCard key={item.id} item={item} />)}
      </div>

      {!loading && filteredItems.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>暂无物品，来发布第一个吧~</p>
        </div>
      )}
    </div>
  );
};

export default Home;
