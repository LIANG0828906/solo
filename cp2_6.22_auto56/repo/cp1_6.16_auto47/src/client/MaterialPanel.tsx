import { MaterialItem, MaterialCategory } from '../shared/types';
import { CATEGORY_NAMES } from '../shared/data';

interface MaterialPanelProps {
  materials: MaterialItem[];
  activeMaterial: MaterialItem | null;
  setActiveMaterial: (m: MaterialItem | null) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
}

const categories: (MaterialCategory | 'all')[] = ['all', 'sofa', 'table', 'lamp', 'carpet', 'decoration', 'bed', 'chair', 'storage'];

export default function MaterialPanel({
  materials, activeMaterial, setActiveMaterial,
  searchTerm, setSearchTerm, selectedCategory, setSelectedCategory
}: MaterialPanelProps) {

  const filtered = materials.filter(m => {
    const matchCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchSearch = !searchTerm || 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.materials.some(mat => mat.includes(searchTerm));
    return matchCategory && matchSearch;
  });

  return (
    <aside style={{
      width: 280,
      background: '#fff',
      borderRight: '1px solid #EFEBE9',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      <div style={{ padding: 16, borderBottom: '1px solid #EFEBE9' }}>
        <h2 style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 12,
          color: '#5D4037'
        }}>
          📦 素材库
        </h2>
        <div style={{
          background: '#F5F0EB',
          borderRadius: 10,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ color: '#A1887F' }}>🔍</span>
          <input
            type="text"
            placeholder="搜索素材..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: '#3E2723'
            }}
          />
        </div>
      </div>

      <div style={{ 
        padding: 12, 
        borderBottom: '1px solid #EFEBE9',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: selectedCategory === cat ? 600 : 400,
              background: selectedCategory === cat ? '#E8A87C' : '#F5F0EB',
              color: selectedCategory === cat ? '#fff' : '#5D4037',
              transition: 'all 0.2s ease'
            }}
          >
            {cat === 'all' ? '全部' : CATEGORY_NAMES[cat]}
          </button>
        ))}
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: 12
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {filtered.map(material => (
            <button
              key={material.id}
              onClick={() => setActiveMaterial(activeMaterial?.id === material.id ? null : material)}
              style={{
                background: activeMaterial?.id === material.id ? '#FFF3E8' : '#FAFAFA',
                borderRadius: 8,
                padding: 10,
                textAlign: 'center',
                border: activeMaterial?.id === material.id 
                  ? '2px solid #E8A87C' 
                  : '2px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(139,94,60,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div 
                style={{
                  width: '100%',
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: material.topViewSvg.replace(
                    /fill="#[0-9A-Fa-f]{3,6}"/g,
                    `fill="${material.color}"`
                  )
                }}
              />
              <span style={{ 
                fontSize: 11, 
                fontWeight: 500, 
                color: '#3E2723',
                lineHeight: 1.2
              }}>
                {material.name}
              </span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#A1887F', fontSize: 13 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
            未找到匹配素材
          </div>
        )}
      </div>

      {activeMaterial && (
        <div className="animate-slide-in" style={{
          padding: 16,
          background: 'linear-gradient(180deg, #FFF8F0 0%, #FFE8D6 100%)',
          borderTop: '2px solid #E8A87C'
        }}>
          <div style={{ fontSize: 12, color: '#8B5E3C', marginBottom: 6, fontWeight: 600 }}>
            ✨ 已选择素材
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#3E2723', marginBottom: 8 }}>
            {activeMaterial.name}
          </div>
          <div style={{ fontSize: 11, color: '#795548', lineHeight: 1.5 }}>
            点击平面图空白区域放置<br/>
            按 ESC 取消选择
          </div>
        </div>
      )}
    </aside>
  );
}
