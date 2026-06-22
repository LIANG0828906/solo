import { useState } from 'react';
import { useWardrobeStore } from '../store';
import { ClothingCategory, Season, ClothingItem } from '../types';
import ClothingCard from '../components/ClothingCard';
import AddClothingModal from '../components/AddClothingModal';

const CATEGORIES: ClothingCategory[] = ['top', 'bottom', 'shoes', 'accessory'];
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  top: '上装',
  bottom: '下装',
  shoes: '鞋履',
  accessory: '配饰',
};
const SEASON_LABELS: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

export default function Wardrobe() {
  const clothes = useWardrobeStore((s) => s.clothes);
  const addClothing = useWardrobeStore((s) => s.addClothing);
  const updateClothing = useWardrobeStore((s) => s.updateClothing);
  const removeClothing = useWardrobeStore((s) => s.removeClothing);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeason, setFilterSeason] = useState<Season | null>(null);
  const [filterCategory, setFilterCategory] = useState<ClothingCategory | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredClothes = clothes.filter((item) => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.brand.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterSeason && !item.seasons.includes(filterSeason)) {
      return false;
    }
    if (filterCategory && item.category !== filterCategory) {
      return false;
    }
    return true;
  });

  const grouped = CATEGORIES.reduce<Record<ClothingCategory, typeof clothes>>((acc, cat) => {
    acc[cat] = filteredClothes.filter((c) => c.category === cat);
    return acc;
  }, {} as Record<ClothingCategory, typeof clothes>);

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: active ? '2px solid #5C3A21' : '1px solid #D0C4B5',
    background: active ? '#5C3A21' : '#fff',
    color: active ? '#fff' : '#5C3A21',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ background: '#F5E6D3', minHeight: '100vh', padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="搜索衣物名称或品牌..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1 1 200px',
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid #D0C4B5',
            fontSize: 14,
            outline: 'none',
            background: '#fff',
          }}
        />
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 24px',
            borderRadius: 12,
            border: 'none',
            background: '#5C3A21',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          添加衣物
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button style={filterBtnStyle(filterSeason === null)} onClick={() => setFilterSeason(null)}>
          全部季节
        </button>
        {SEASONS.map((s) => (
          <button key={s} style={filterBtnStyle(filterSeason === s)} onClick={() => setFilterSeason(filterSeason === s ? null : s)}>
            {SEASON_LABELS[s]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button style={filterBtnStyle(filterCategory === null)} onClick={() => setFilterCategory(null)}>
          全部分类
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} style={filterBtnStyle(filterCategory === c)} onClick={() => setFilterCategory(filterCategory === c ? null : c)}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {CATEGORIES.filter((cat) => filterCategory === null || filterCategory === cat).map((cat) => (
        <div key={cat} style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#5C3A21',
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: '2px solid #D0C4B5',
            }}
          >
            {CATEGORY_LABELS[cat]}
          </h2>
          {grouped[cat].length === 0 ? (
            <p style={{ color: '#8D6E63', fontSize: 14, padding: '20px 0' }}>暂无该分类衣物</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 16,
              }}
            >
              {grouped[cat].map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  onUpdate={(partial: Partial<ClothingItem>) => updateClothing(item.id, partial)}
                  onDelete={() => removeClothing(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {showAddModal && (
        <AddClothingModal
          onAdd={(item: ClothingItem) => {
            addClothing(item);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
