import { PlacedItem, MaterialItem } from '../shared/types';
import { CATEGORY_NAMES } from '../shared/data';

interface PropertyPanelProps {
  selectedItem: PlacedItem | null;
  selectedMaterial: MaterialItem | null;
  onUpdateItem: (id: string, updates: Partial<PlacedItem>) => void;
  onDeleteItem: (id: string) => void;
  onRotate: (id: string) => void;
}

export default function PropertyPanel({
  selectedItem, selectedMaterial, onUpdateItem, onDeleteItem, onRotate
}: PropertyPanelProps) {

  if (!selectedItem || !selectedMaterial) {
    return (
      <aside 
        className="animate-slide-in"
        style={{
          width: selectedItem ? 280 : 0,
          transition: 'width 0.3s ease',
          background: '#fff',
          borderLeft: selectedItem ? '1px solid #EFEBE9' : 'none',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        <div style={{ padding: 24, minWidth: 280 }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#A1887F'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>👆</div>
            <div style={{ fontSize: 15, marginBottom: 8, color: '#5D4037', fontWeight: 500 }}>
              选择一个家具查看属性
            </div>
            <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
              点击平面图中的家具<br/>
              或从左侧素材库选择素材放置
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside 
      style={{
        width: 280,
        background: '#fff',
        borderLeft: '1px solid #EFEBE9',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto'
      }}
    >
      <div style={{ padding: 20, borderBottom: '1px solid #EFEBE9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#3E2723' }}>
            ⚙️ 属性设置
          </h2>
          <button
            onClick={() => onDeleteItem(selectedItem.id)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: '#FFEBEE',
              color: '#E57373',
              fontSize: 12
            }}
          >
            🗑️ 删除
          </button>
        </div>
        <div style={{
          padding: 16,
          background: 'linear-gradient(135deg, #FFF8F0, #FFE8D6)',
          borderRadius: 12,
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div 
              style={{
                width: 48,
                height: 48,
                background: selectedItem.color,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24
              }}
            >
              {CATEGORY_NAMES[selectedMaterial.category]?.[0] || '📦'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#3E2723' }}>
                {selectedMaterial.name}
              </div>
              <div style={{ fontSize: 11, color: '#8D6E63' }}>
                {CATEGORY_NAMES[selectedMaterial.category]}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <section>
          <h3 style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#5D4037',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            📐 尺寸
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{
            padding: 10,
            background: '#FAFAFA',
            borderRadius: 8,
            border: '1px solid #EFEBE9'
          }}>
            <div style={{ fontSize: 10, color: '#8D6E63' }}>宽度</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#3E2723' }}>
              {Math.round(selectedMaterial.width * selectedItem.scale)}cm
            </div>
          </div>
          <div style={{
            padding: 10,
            background: '#FAFAFA',
            borderRadius: 8,
            border: '1px solid #EFEBE9'
          }}>
            <div style={{ fontSize: 10, color: '#8D6E63' }}>深度</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#3E2723' }}>
              {Math.round(selectedMaterial.height * selectedItem.scale)}cm
            </div>
          </div>
          <div style={{
            padding: 10,
            background: '#FAFAFA',
            borderRadius: 8,
            border: '1px solid #EFEBE9'
          }}>
            <div style={{ fontSize: 10, color: '#8D6E63' }}>高度</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#3E2723' }}>
              {Math.round(selectedMaterial.depth * selectedItem.scale)}cm
            </div>
          </div>
          <div style={{
            padding: 10,
            background: '#FAFAFA',
            borderRadius: 8,
            border: '1px solid #EFEBE9'
          }}>
            <div style={{ fontSize: 10, color: '#8D6E63' }}>缩放</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#3E2723' }}>
              {(selectedItem.scale * 100).toFixed(0)}%
            </div>
          </div>
          </div>
        </section>

        <section>
          <h3 style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#5D4037',
            marginBottom: 10
          }}>
            🎨 颜色
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selectedMaterial.colors.map((color, idx) => (
              <button
                key={idx}
                onClick={() => onUpdateItem(selectedItem.id, { color })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: color,
                  border: selectedItem.color === color 
                    ? '3px solid #E8A87C' 
                    : '2px solid #EFEBE9',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedItem.color === color 
                    ? '0 0 0 3px rgba(232,168,124,0.3)' 
                    : 'none'
                }}
                title={`颜色 ${idx + 1}`}
              />
            ))}
          </div>
        </section>

        <section>
          <h3 style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#5D4037',
            marginBottom: 10
          }}>
            🔄 旋转 & 缩放
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#795548' }}>旋转角度</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#3E2723' }}>{selectedItem.rotation}°</span>
              </div>
              <button
                onClick={() => onRotate(selectedItem.id)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  background: '#F5F0EB',
                  color: '#5D4037',
                  fontSize: 13,
                  fontWeight: 500
                }}
              >
                ↻ 旋转 45°
              </button>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#795548' }}>缩放比例</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#3E2723' }}>
                  {(selectedItem.scale * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={selectedItem.scale}
                onChange={(e) => onUpdateItem(selectedItem.id, { scale: Number(e.target.value) })}
                style={{ width: '100%', height: 6 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#A1887F' }}>
                <span>50%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#5D4037',
            marginBottom: 10
          }}>
            🏷️ 材质标签
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedMaterial.materials.map((mat, idx) => (
              <span
                key={idx}
                style={{
                  padding: '5px 12px',
                  background: '#F5E6D3',
                  color: '#8B5E3C',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500
                }}
              >
                {mat}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#5D4037',
            marginBottom: 10
          }}>
            📍 位置坐标
          </h3>
          <div style={{
            padding: 12,
            background: '#FAFAFA',
            borderRadius: 8,
            border: '1px solid #EFEBE9',
            fontFamily: 'monospace',
            fontSize: 13,
            color: '#5D4037'
          }}>
            X: {selectedItem.x}px &nbsp;&nbsp; Y: {selectedItem.y}px
          </div>
        </section>
      </div>

      <div style={{
        padding: 16,
        borderTop: '1px solid #EFEBE9',
        background: '#FFEBEE'
      }}>
        <button
          onClick={() => {
            if (confirm('确定删除此家具吗？')) onDeleteItem(selectedItem.id);
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            background: '#E57373',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          🗑️ 删除此家具
        </button>
      </div>
    </aside>
  );
}
