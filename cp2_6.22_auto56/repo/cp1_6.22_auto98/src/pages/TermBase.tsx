import { useState, useEffect, useRef } from 'react';

type Language = 'zh' | 'en' | 'ja' | 'fr' | 'de';

interface Term {
  id: string;
  term: string;
  definition: string;
  language: Language;
  createdAt: number;
}

const languageLabels: Record<Language, string> = {
  zh: '中文',
  en: '英文',
  ja: '日文',
  fr: '法文',
  de: '德文',
};

const languageOptions: Language[] = ['zh', 'en', 'ja', 'fr', 'de'];

export default function TermBase() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ term: '', definition: '', language: 'en' as Language });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ term: '', definition: '', language: 'en' as Language });
  const [adding, setAdding] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [search]);

  const fetchTerms = async () => {
    try {
      const res = await fetch('/api/terms');
      const data = await res.json();
      setTerms(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const filteredTerms = debouncedSearch.trim()
    ? terms.filter(
        (t) =>
          t.term.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          t.definition.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : terms;

  const highlightMatch = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark
          key={i}
          style={{
            backgroundColor: 'var(--highlight)',
            color: 'inherit',
            borderRadius: '2px',
            padding: '0 2px',
          }}
        >
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const handleAdd = async () => {
    if (!addForm.term.trim() || !addForm.definition.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      setTerms((prev) => [...prev, data]);
      setAddForm({ term: '', definition: '', language: 'en' });
      setShowAdd(false);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该术语？')) return;
    try {
      await fetch(`/api/terms/${id}`, { method: 'DELETE' });
      setTerms((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (term: Term) => {
    setEditingId(term.id);
    setEditForm({ term: term.term, definition: term.definition, language: term.language });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.term.trim() || !editForm.definition.trim()) return;
    try {
      const res = await fetch(`/api/terms/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const updated = await res.json();
      setTerms((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>术语库管理</h1>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          + 添加术语
        </button>
      </div>

      <div
        style={{
          marginBottom: '20px',
          position: 'relative',
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索术语或释义..."
          style={{
            width: '100%',
            padding: '12px 16px 12px 40px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14px',
            color: 'var(--text-muted)',
          }}
        >
          🔍
        </span>
      </div>

      {showAdd && (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
            marginBottom: '20px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>新增术语</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input
              placeholder="术语"
              value={addForm.term}
              onChange={(e) => setAddForm({ ...addForm, term: e.target.value })}
              style={inputStyle}
              autoFocus
            />
            <select
              value={addForm.language}
              onChange={(e) => setAddForm({ ...addForm, language: e.target.value as Language })}
              style={inputStyle}
            >
              {languageOptions.map((l) => (
                <option key={l} value={l}>
                  {languageLabels[l]}
                </option>
              ))}
            </select>
          </div>
          <input
            placeholder="释义"
            value={addForm.definition}
            onChange={(e) => setAddForm({ ...addForm, definition: e.target.value })}
            style={{ ...inputStyle, width: '100%', marginBottom: '14px' }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowAdd(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: 'var(--text-secondary)',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={adding || !addForm.term.trim() || !addForm.definition.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 500,
                opacity: adding || !addForm.term.trim() || !addForm.definition.trim() ? 0.6 : 1,
              }}
            >
              {adding ? '添加中...' : '添加'}
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <th
                style={{
                  padding: '14px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                术语
              </th>
              <th
                style={{
                  padding: '14px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                释义
              </th>
              <th
                style={{
                  padding: '14px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: '100px',
                }}
              >
                语言
              </th>
              <th
                style={{
                  padding: '14px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: '160px',
                }}
              >
                创建时间
              </th>
              <th
                style={{
                  padding: '14px 16px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: '120px',
                }}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTerms.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                  }}
                >
                  {debouncedSearch.trim() ? '没有匹配的术语' : '暂无术语，点击右上角添加'}
                </td>
              </tr>
            ) : (
              filteredTerms.map((t) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background-color 0.2s',
                    animation: 'fadeIn 0.2s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(15, 52, 96, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {editingId === t.id ? (
                    <>
                      <td style={{ padding: '10px 16px' }}>
                        <input
                          value={editForm.term}
                          onChange={(e) => setEditForm({ ...editForm, term: e.target.value })}
                          style={{ ...inputStyle, width: '100%' }}
                          autoFocus
                        />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <input
                          value={editForm.definition}
                          onChange={(e) => setEditForm({ ...editForm, definition: e.target.value })}
                          style={{ ...inputStyle, width: '100%' }}
                        />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <select
                          value={editForm.language}
                          onChange={(e) => setEditForm({ ...editForm, language: e.target.value as Language })}
                          style={inputStyle}
                        >
                          {languageOptions.map((l) => (
                            <option key={l} value={l}>
                              {languageLabels[l]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(t.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={handleSaveEdit}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'var(--text-success)',
                              color: '#fff',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              color: 'var(--text-secondary)',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            取消
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#ffd700',
                        }}
                      >
                        {highlightMatch(t.term, debouncedSearch)}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {highlightMatch(t.definition, debouncedSearch)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            backgroundColor: 'var(--accent-secondary)',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          {languageLabels[t.language]}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {new Date(t.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => startEdit(t)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              color: 'var(--text-secondary)',
                              borderRadius: '4px',
                              fontSize: '12px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--accent-secondary)';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'rgba(233, 69, 96, 0.1)',
                              color: 'var(--accent-primary)',
                              borderRadius: '4px',
                              fontSize: '12px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.1)';
                              e.currentTarget.style.color = 'var(--accent-primary)';
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @media (max-width: 768px) {
          table {
            display: block;
            overflow-x: auto;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
