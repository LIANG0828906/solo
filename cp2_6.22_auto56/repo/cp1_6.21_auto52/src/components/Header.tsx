import { useState, useRef, useCallback } from 'react';

interface HeaderProps {
  activeTab: 'all' | 'active' | 'expired';
  onTabChange: (tab: 'all' | 'active' | 'expired') => void;
  onSearch: (keyword: string) => void;
  onCreateClick: () => void;
}

const tabs: { key: 'all' | 'active' | 'expired'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'expired', label: '已截止' },
];

export default function Header({ activeTab, onTabChange, onSearch, onCreateClick }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onSearch(value);
      }, 300);
    },
    [onSearch]
  );

  const activeIndex = tabs.findIndex((t) => t.key === activeTab);

  return (
    <div
      style={{
        height: 60,
        background: '#1A237E',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 600, whiteSpace: 'nowrap' }}>
        团队决策投票
      </div>

      <div style={{ position: 'relative', display: 'flex', margin: '0 32px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: '8px 16px',
              fontSize: 15,
              fontWeight: activeTab === tab.key ? 500 : 400,
              transition: 'color 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            height: 3,
            background: '#2196F3',
            borderRadius: 2,
            width: `${100 / tabs.length}%`,
            left: `${(activeIndex * 100) / tabs.length}%`,
            transition: 'left 0.3s',
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      <input
        type="text"
        placeholder="搜索投票..."
        value={searchValue}
        onChange={handleSearchChange}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: 8,
          padding: '8px 14px',
          color: '#fff',
          outline: 'none',
          width: 200,
          fontSize: 14,
          marginRight: 16,
        }}
      />

      <button
        onClick={onCreateClick}
        style={{
          background: '#2196F3',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 20px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: 14,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        新建投票
      </button>
    </div>
  );
}
