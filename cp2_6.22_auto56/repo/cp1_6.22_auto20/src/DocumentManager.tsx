import { useState, useCallback } from 'react';

interface Document {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  createdAt: number;
}

interface Props {
  documents: Document[];
  selectedNodeId: string | null;
  onAdd: (title: string, summary: string, keywords: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelect: (id: string) => void;
  searchQuery: string;
}

export default function DocumentManager({ documents, selectedNodeId, onAdd, onDelete, onSelect, searchQuery }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !summary.trim()) return;
    const keywords = keywordsInput
      .split(/[,，、\s]+/)
      .filter(Boolean)
      .slice(0, 10);
    setSubmitting(true);
    try {
      await onAdd(title.trim(), summary.trim(), keywords);
      setTitle('');
      setSummary('');
      setKeywordsInput('');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }, [title, summary, keywordsInput, onAdd]);

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingIds(prev => new Set(prev).add(id));
    await new Promise(r => setTimeout(r, 280));
    await onDelete(id);
    setDeletingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [onDelete]);

  const q = searchQuery.toLowerCase();
  const isMatch = (doc: Document) =>
    !q || doc.title.toLowerCase().includes(q) || doc.keywords.some(k => k.toLowerCase().includes(q));

  return (
    <div style={{
      height: '100%',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRight: '1px solid #eee',
    }}>
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid #F0F0F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>文档管理</h2>
        <button
          onClick={() => setShowForm(prev => !prev)}
          style={{
            background: showForm ? '#E0E0E0' : '#4A90D9',
            color: showForm ? '#666' : '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '5px 14px',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 500,
          }}
        >
          {showForm ? '取消' : '+ 新增'}
        </button>
      </div>

      <div
        className="form-expand"
        style={{
          maxHeight: showForm ? 280 : 0,
          opacity: showForm ? 1 : 0,
          padding: showForm ? '12px 16px' : '0 16px',
          borderBottom: showForm ? '1px solid #F0F0F0' : 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            placeholder="文档标题"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
            style={{
              height: 34,
              border: '1px solid #E0E0E0',
              borderRadius: 8,
              padding: '0 12px',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          <textarea
            placeholder="文档摘要（200字以内）"
            value={summary}
            onChange={e => setSummary(e.target.value.slice(0, 200))}
            maxLength={200}
            rows={3}
            style={{
              border: '1px solid #E0E0E0',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              transition: 'border-color 0.2s',
            }}
          />
          <div style={{ position: 'relative' }}>
            <input
              placeholder="关键词（逗号分隔，最多10个）"
              value={keywordsInput}
              onChange={e => setKeywordsInput(e.target.value)}
              style={{
                width: '100%',
                height: 34,
                border: '1px solid #E0E0E0',
                borderRadius: 8,
                padding: '0 12px',
                fontSize: 13,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <span style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 11, color: '#bbb',
            }}>
              {keywordsInput.split(/[,，、\s]+/).filter(Boolean).length}/10
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#bbb' }}>{summary.length}/200</span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !summary.trim()}
              style={{
                height: 34,
                padding: '0 24px',
                background: submitting || !title.trim() || !summary.trim() ? '#D0D0D0' : '#4A90D9',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                cursor: submitting || !title.trim() || !summary.trim() ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                fontWeight: 500,
              }}
            >
              {submitting ? '提交中...' : '添加文档'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
        {documents.length === 0 ? (
          <div style={{
            textAlign: 'center', color: '#bbb', marginTop: 60, fontSize: 13,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>📄</span>
            暂无文档，点击"新增"添加
          </div>
        ) : (
          documents.map(doc => {
            const isSelected = doc.id === selectedNodeId;
            const isDeleting = deletingIds.has(doc.id);
            const matched = isMatch(doc);
            return (
              <div
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                className={`doc-card ${isDeleting ? 'fade-out' : 'fade-in'}`}
                style={{
                  padding: '10px 12px',
                  marginBottom: 6,
                  borderRadius: 8,
                  background: isSelected ? '#F0F6FF' : '#FAFAFA',
                  borderLeft: isSelected ? '3px solid #4A90D9' : '3px solid transparent',
                  borderBottom: isSelected ? '2px solid #4A90D9' : '1px solid transparent',
                  boxShadow: isSelected
                    ? '0 2px 10px rgba(74,144,217,0.15)'
                    : '0 1px 6px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  position: 'relative',
                  opacity: q && !matched ? 0.4 : 1,
                }}
              >
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#333',
                  marginBottom: 3, paddingRight: 22,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {doc.title}
                </div>
                <div style={{
                  fontSize: 12, color: '#999', marginBottom: 6, lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {doc.summary}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {doc.keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} style={{
                      fontSize: 10, background: '#EDF2FA', color: '#4A90D9',
                      padding: '1px 7px', borderRadius: 10, fontWeight: 500,
                    }}>
                      {kw}
                    </span>
                  ))}
                  {doc.keywords.length > 5 && (
                    <span style={{ fontSize: 10, color: '#bbb' }}>+{doc.keywords.length - 5}</span>
                  )}
                </div>
                <button
                  onClick={e => handleDelete(doc.id, e)}
                  style={{
                    position: 'absolute', top: 8, right: 6,
                    background: 'none', border: 'none', color: '#ddd',
                    cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = '#E74C3C'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = '#ddd'; }}
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
