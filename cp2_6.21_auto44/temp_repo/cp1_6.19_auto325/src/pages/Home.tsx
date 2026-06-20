import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, CATEGORIES, type ItemCategory, type Item, type ItemStatus } from '@/store';
import Sidebar from '@/components/Sidebar';
import { Search, Filter, Plus, Sparkles, Tag, Star, MapPin } from 'lucide-react';

const STATUS_STYLES: Record<ItemStatus, { label: string; className: string }> = {
  pending: { label: '待交换', className: 'bg-green-100 text-green-700' },
  reserved: { label: '已预约', className: 'bg-yellow-100 text-yellow-700' },
  exchanged: { label: '已交换', className: 'bg-gray-100 text-gray-500' },
};

function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const owner = useStore((s) => s.getUserById(item.ownerId));
  const statusStyle = STATUS_STYLES[item.status];

  return (
    <div
      onClick={onClick}
      className="card-hover bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-gray-100 group"
    >
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-44 object-cover bg-gray-100 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80`;
          }}
        />
        <div className="absolute top-3 right-3">
          <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusStyle.className}`}>
            {statusStyle.label}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
          <img
            src={item.ownerId ? owner?.avatarUrl : ''}
            alt=""
            className="w-5 h-5 rounded-full bg-gray-200"
          />
          <span className="text-[11px] text-gray-700 font-medium">{owner?.nickname || '匿名'}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 line-clamp-2 flex-1 text-[15px]">
            {item.title}
          </h3>
          <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
            <Star size={14} fill="currentColor" />
            <span className="text-[12px] font-medium">{item.conditionLevel}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium bg-category text-green-700">
            <Tag size={12} />
            {item.category}
          </span>
          {owner?.locationArea && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium bg-secondary/30 text-orange-700">
              <MapPin size={12} />
              {owner.locationArea}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.round(item.conditionLevel / 2) }).map((_, i) => (
              <div key={i} className="w-1.5 h-4 rounded-sm bg-gradient-to-t from-primary to-secondary" />
            ))}
            {Array.from({ length: 5 - Math.round(item.conditionLevel / 2) }).map((_, i) => (
              <div key={i} className="w-1.5 h-4 rounded-sm bg-gray-100" />
            ))}
          </div>
          <span className="text-[10px] text-gray-400">
            新旧度 {item.conditionLevel}/10
          </span>
        </div>
      </div>
    </div>
  );
}

function PublishModal({ onClose }: { onClose: () => void }) {
  const currentUser = useStore((s) => s.currentUser);
  const createItem = useStore((s) => s.createItem);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [conditionLevel, setConditionLevel] = useState(7);
  const [category, setCategory] = useState<ItemCategory>('其他');

  const handleSubmit = () => {
    if (!currentUser || !title.trim()) return;
    const img = imageUrl.trim() || `https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80`;
    const item = createItem({
      ownerId: currentUser.id,
      title: title.trim(),
      description: description.trim(),
      imageUrl: img,
      conditionLevel,
      category,
    });
    onClose();
    navigate(`/item/${item.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus size={22} /> 发布闲置物品
          </h2>
          <p className="text-sm opacity-90 mt-1">让闲置物品找到新主人</p>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">物品标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：九成新Kindle电子书阅读器"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">详细描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述物品的使用情况、交换期望等..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">图片URL（可选）</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="留空将使用默认图片"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="预览"
                className="mt-2 w-full h-40 object-cover rounded-xl bg-gray-100"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                新旧程度：<span className="text-primary font-bold">{conditionLevel}</span>/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={conditionLevel}
                onChange={(e) => setConditionLevel(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>较旧</span>
                <span>一般</span>
                <span>全新</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">期望类别</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all btn-bounce font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-bounce font-medium"
          >
            立即发布
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const getFilteredItems = useStore((s) => s.getFilteredItems);
  const getAvailableAreas = useStore((s) => s.getAvailableAreas);
  const searchQuery = useStore((s) => s.searchQuery);
  const filterCategory = useStore((s) => s.filterCategory);
  const filterCondition = useStore((s) => s.filterCondition);
  const filterArea = useStore((s) => s.filterArea);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setFilters = useStore((s) => s.setFilters);

  const [showPublish, setShowPublish] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const areas = useMemo(() => getAvailableAreas(), [getAvailableAreas]);
  const items = useMemo(() => getFilteredItems(), [getFilteredItems]);

  return (
    <div className="min-h-screen bg-background flex">
      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-5 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-dark to-primary bg-clip-text text-transparent">
                    旧物交换广场
                  </h1>
                  <p className="text-xs text-gray-500">让闲置物品流动起来 · 共 {items.length} 件好物</p>
                </div>
              </div>

              {currentUser && (
                <button
                  onClick={() => setShowPublish(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all btn-bounce"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">发布物品</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索想要的物品..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border transition-all btn-bounce ${
                  showFilters || filterCategory !== 'all' || filterCondition !== 'all' || filterArea !== 'all'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} />
                <span className="sm:hidden">筛选</span>
                <span className="hidden sm:inline">高级筛选</span>
              </button>
            </div>

            {showFilters && (
              <div className="mt-3 animate-fade-in grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">按类别</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilters({ category: e.target.value as ItemCategory | 'all' })}
                    className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 focus:border-primary outline-none text-sm"
                  >
                    <option value="all">全部类别</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">最低新旧度</label>
                  <select
                    value={String(filterCondition)}
                    onChange={(e) =>
                      setFilters({
                        condition: e.target.value === 'all' ? 'all' : Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 focus:border-primary outline-none text-sm"
                  >
                    <option value="all">不限</option>
                    <option value="1">≥ 1 成新</option>
                    <option value="3">≥ 3 成新</option>
                    <option value="5">≥ 5 成新</option>
                    <option value="7">≥ 7 成新</option>
                    <option value="9">≥ 9 成新</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">所在区域</label>
                  <select
                    value={filterArea}
                    onChange={(e) => setFilters({ area: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white border border-gray-200 focus:border-primary outline-none text-sm"
                  >
                    <option value="all">全部区域</option>
                    {areas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-5 py-6">
          {items.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <Search size={36} className="text-primary/50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">没有找到匹配的物品</h3>
              <p className="text-gray-500 text-sm">试试调整搜索条件或筛选选项</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/item/${item.id}`)}
                />
              ))}
            </div>
          )}

          <div className="mt-12 py-8 text-center">
            <p className="text-sm text-gray-400">
              — 浏览到底啦，记得登录后发布你的闲置物品哦 —
            </p>
          </div>
        </div>
      </main>

      <Sidebar />

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
    </div>
  );
}
