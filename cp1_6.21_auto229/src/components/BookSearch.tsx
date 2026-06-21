import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Book, OpenLibraryDoc } from '../types';
import { useApp } from '../context/AppContext';

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 24, maxWidth: 1200, margin: '0 auto' },
  searchWrapper: { marginBottom: 24 },
  searchInput: {
    width: '100%',
    background: '#334155',
    border: '2px solid transparent',
    borderRadius: 8,
    padding: 10,
    color: '#E2E8F0',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  searchInputFocus: {
    border: '2px solid #6366F1',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.3)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#1E293B',
    borderRadius: 12,
    padding: 16,
    boxShadow: '4px 4px 12px #0F172A',
    cursor: 'pointer',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  cardHover: {
    transform: 'translateY(-3px)',
    boxShadow: '4px 8px 20px #0F172A',
  },
  cardCover: {
    width: '100%',
    height: 180,
    objectFit: 'cover',
    borderRadius: 8,
    marginBottom: 8,
    background: '#334155',
  },
  cardTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardAuthor: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardYear: {
    color: '#64748B',
    fontSize: 11,
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1E293B',
    borderRadius: 16,
    padding: 32,
    maxWidth: 480,
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    position: 'relative' as const,
  },
  modalCover: {
    width: 200,
    height: 300,
    objectFit: 'cover',
    borderRadius: 12,
    display: 'block',
    margin: '0 auto 20px',
    background: '#334155',
  },
  modalTitle: {
    color: '#E2E8F0',
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  modalInfo: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 6,
  },
  modalInfoLabel: {
    color: '#64748B',
    marginRight: 8,
  },
  button: {
    borderRadius: 8,
    color: '#E2E8F0',
    background: '#6366F1',
    border: 'none',
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
    width: '100%',
    marginTop: 20,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 12,
    right: 16,
    background: 'transparent',
    border: 'none',
    color: '#94A3B8',
    fontSize: 24,
    cursor: 'pointer',
    lineHeight: 1,
  },
  loadingContainer: {
    textAlign: 'center' as const,
    padding: 40,
    color: '#94A3B8',
    fontSize: 16,
    animation: 'fadeIn 0.3s',
  },
  emptyContainer: {
    textAlign: 'center' as const,
    padding: 40,
    color: '#64748B',
    fontSize: 14,
  },
  toast: {
    position: 'fixed' as const,
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#10B981',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    zIndex: 2000,
    animation: 'fadeIn 0.3s',
  },
  placeholderCover: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
    background: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    fontSize: 12,
  },
};

const keyframesStyle = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

export default function BookSearch() {
  const { addBook } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<OpenLibraryDoc | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');
  const [buttonHover, setButtonHover] = useState(false);
  const [buttonActive, setButtonActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(`https://openlibrary.org/search.json`, {
        params: { q, limit: 20 },
      });
      setResults(data.docs || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, doSearch]);

  const handleAdd = async () => {
    if (!selectedDoc) return;
    setAdding(true);
    try {
      await addBook({
        title: selectedDoc.title,
        author: selectedDoc.author_name?.join(', ') || '',
        isbn: selectedDoc.isbn?.[0] || '',
        coverUrl: selectedDoc.cover_i
          ? `https://covers.openlibrary.org/b/id/${selectedDoc.cover_i}-L.jpg`
          : '',
        publishYear: selectedDoc.first_publish_year || 0,
      });
      setToast('已添加到书库');
      setTimeout(() => setToast(''), 2000);
      setSelectedDoc(null);
    } finally {
      setAdding(false);
    }
  };

  const visibleResults = results.slice(0, 15);

  return (
    <>
      <style>{keyframesStyle}</style>
      <div style={styles.container}>
        <div style={styles.searchWrapper}>
          <input
            style={{
              ...styles.searchInput,
              ...(focused ? styles.searchInputFocus : {}),
            }}
            placeholder="搜索书籍..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>

        {loading && (
          <div style={styles.loadingContainer}>搜索中...</div>
        )}

        {!loading && visibleResults.length === 0 && query.trim() && (
          <div style={styles.emptyContainer}>未找到相关书籍</div>
        )}

        {!loading && visibleResults.length > 0 && (
          <div style={styles.grid}>
            {visibleResults.map((doc, idx) => (
              <div
                key={doc.key}
                style={{
                  ...styles.card,
                  ...(hoveredIdx === idx ? styles.cardHover : {}),
                }}
                onClick={() => setSelectedDoc(doc)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {doc.cover_i ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`}
                    alt={doc.title}
                    style={styles.cardCover}
                    loading="lazy"
                  />
                ) : (
                  <div style={styles.placeholderCover}>暂无封面</div>
                )}
                <div style={styles.cardTitle}>{doc.title}</div>
                <div style={styles.cardAuthor}>
                  {doc.author_name?.join(', ') || '未知作者'}
                </div>
                {doc.first_publish_year && (
                  <div style={styles.cardYear}>{doc.first_publish_year}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedDoc && (
          <div style={styles.overlay} onClick={() => setSelectedDoc(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button
                style={styles.closeButton}
                onClick={() => setSelectedDoc(null)}
              >
                ✕
              </button>
              {selectedDoc.cover_i ? (
                <img
                  src={`https://covers.openlibrary.org/b/id/${selectedDoc.cover_i}-L.jpg`}
                  alt={selectedDoc.title}
                  style={styles.modalCover}
                />
              ) : (
                <div
                  style={{
                    ...styles.modalCover,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#475569',
                    fontSize: 14,
                  }}
                >
                  暂无封面
                </div>
              )}
              <div style={styles.modalTitle}>{selectedDoc.title}</div>
              <div style={styles.modalInfo}>
                <span style={styles.modalInfoLabel}>作者:</span>
                {selectedDoc.author_name?.join(', ') || '未知'}
              </div>
              <div style={styles.modalInfo}>
                <span style={styles.modalInfoLabel}>ISBN:</span>
                {selectedDoc.isbn?.[0] || '无'}
              </div>
              <div style={styles.modalInfo}>
                <span style={styles.modalInfoLabel}>首版年份:</span>
                {selectedDoc.first_publish_year || '未知'}
              </div>
              <button
                style={{
                  ...styles.button,
                  ...(buttonHover ? { background: '#818CF8' } : {}),
                  ...(buttonActive ? { transform: 'scale(0.95)' } : {}),
                }}
                onClick={handleAdd}
                disabled={adding}
                onMouseEnter={() => setButtonHover(true)}
                onMouseLeave={() => {
                  setButtonHover(false);
                  setButtonActive(false);
                }}
                onMouseDown={() => setButtonActive(true)}
                onMouseUp={() => setButtonActive(false)}
              >
                {adding ? '添加中...' : '添加到我的书库'}
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <div style={styles.toast}>{toast}</div>}
    </>
  );
}
