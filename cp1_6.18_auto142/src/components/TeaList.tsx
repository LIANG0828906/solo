import React from 'react';
import useTeaStore, { type Tea } from '@/stores/teaStore';
import { Search, Plus } from 'lucide-react';

const TeaCard: React.FC<{
  tea: Tea;
  isSelected: boolean;
  onClick: () => void;
}> = ({ tea, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        height: 80,
        padding: '12px 16px',
        cursor: 'pointer',
        position: 'relative',
        backgroundColor: isSelected ? 'rgba(107,142,35,0.12)' : 'transparent',
        borderLeft: isSelected ? '3px solid #6B8E23' : '3px solid transparent',
        borderRadius: 8,
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'rgba(107,142,35,0.06)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          fontFamily: "'Noto Serif SC', 'Playfair Display', serif",
          color: '#3E2723',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {tea.name || '未命名茶叶'}
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#8D6E63',
          display: 'flex',
          gap: 8,
          fontFamily: "'Noto Serif SC', serif",
        }}
      >
        <span>{tea.origin || '未知产地'}</span>
        {tea.year && <span>· {tea.year}</span>}
      </div>
    </div>
  );
};

const TeaList: React.FC = () => {
  const selectedTeaId = useTeaStore((s) => s.selectedTeaId);
  const setSelectedTeaId = useTeaStore((s) => s.setSelectedTeaId);
  const searchQuery = useTeaStore((s) => s.searchQuery);
  const setSearchQuery = useTeaStore((s) => s.setSearchQuery);
  const addTea = useTeaStore((s) => s.addTea);
  const getFilteredTeas = useTeaStore((s) => s.getFilteredTeas);

  const filteredTeas = getFilteredTeas();

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        height: '100vh',
        backgroundColor: 'rgba(250,240,230,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(210,180,140,0.3)',
      }}
    >
      <div
        style={{
          padding: '20px 16px 12px',
          borderBottom: '1px solid rgba(210,180,140,0.3)',
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "'Noto Serif SC', 'Playfair Display', serif",
            color: '#3E2723',
            marginBottom: 14,
            letterSpacing: 2,
          }}
        >
          🍵 茶香品鉴
        </h1>
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                color: '#8D6E63',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="搜索茶叶..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                border: '1px solid rgba(210,180,140,0.5)',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'Noto Serif SC', serif",
                backgroundColor: 'rgba(255,255,255,0.6)',
                color: '#3E2723',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6B8E23';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(210,180,140,0.5)';
              }}
            />
          </div>
          <button
            onClick={() => addTea()}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#6B8E23',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7DA52B';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6B8E23';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 8px',
        }}
      >
        {filteredTeas.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 16px',
              color: '#8D6E63',
              fontSize: 13,
              fontFamily: "'Noto Serif SC', serif",
              lineHeight: 1.8,
            }}
          >
            {searchQuery ? '未找到匹配的茶叶' : '暂无茶叶记录\n点击 + 添加第一款'}
          </div>
        )}
        {filteredTeas.map((tea) => (
          <TeaCard
            key={tea.id}
            tea={tea}
            isSelected={selectedTeaId === tea.id}
            onClick={() => setSelectedTeaId(tea.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default TeaList;
