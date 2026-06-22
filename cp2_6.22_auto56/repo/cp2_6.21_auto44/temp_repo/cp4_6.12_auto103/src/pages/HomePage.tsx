import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { CodeCard } from '../components/CodeCard';

export const HomePage: React.FC = () => {
  const codes = useStore((s) => s.codes);
  const selectedFolderId = useStore((s) => s.selectedFolderId);
  const loading = useStore((s) => s.loading);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = codes;
    if (selectedFolderId) {
      list = list.filter((c) => c.folderId === selectedFolderId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.language.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [codes, selectedFolderId, search]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #e0e0e0',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <div
        style={{
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
            maxWidth: 480,
          }}
        >
          <span
            className="material-icons"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
              fontSize: 20,
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="搜索代码片段..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #e0e0e0',
              borderRadius: 24,
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              background: '#fff',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(96,125,139,0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <span style={{ color: '#999', fontSize: 13 }}>
          {filtered.length} 个片段
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999',
          }}
        >
          <span className="material-icons" style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>
            code_off
          </span>
          <p style={{ fontSize: 16 }}>暂无代码片段</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>点击右下角按钮添加你的第一个代码片段</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {filtered.map((code) => (
            <CodeCard key={code.id} code={code} />
          ))}
        </div>
      )}
    </div>
  );
};
