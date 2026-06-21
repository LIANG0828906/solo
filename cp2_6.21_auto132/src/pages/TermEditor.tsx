import { useEffect, useState, useMemo, useCallback } from 'react';
import useProjectStore from '../store/useProjectStore';

const LANG_PAIRS = [
  { value: 'en-zh', label: 'EN → ZH', source: 'en', target: 'zh' },
  { value: 'ja-zh', label: 'JA → ZH', source: 'ja', target: 'zh' },
  { value: 'en-ja', label: 'EN → JA', source: 'en', target: 'ja' },
];

export default function TermEditor() {
  const { currentProject, terms, fetchTerms, addTerm, updateTerm, deleteTerm } = useProjectStore();

  const [search, setSearch] = useState('');
  const [langFilters, setLangFilters] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newTerm, setNewTerm] = useState({
    sourceTerm: '',
    targetTerm: '',
    sourceLang: 'en',
    targetLang: 'zh',
    notes: '',
  });

  useEffect(() => {
    if (currentProject) {
      fetchTerms(currentProject.id);
    }
  }, [currentProject]);

  const filteredTerms = useMemo(() => {
    let result = terms;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        t =>
          t.sourceTerm.toLowerCase().includes(q) ||
          t.targetTerm.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
      );
    }
    if (langFilters.length > 0) {
      result = result.filter(t => {
        return langFilters.some(f => {
          const pair = LANG_PAIRS.find(p => p.value === f);
          if (!pair) return false;
          return t.sourceLang === pair.source && t.targetLang === pair.target;
        });
      });
    }
    return result;
  }, [terms, search, langFilters]);

  const startEdit = useCallback((term: typeof terms[0]) => {
    setEditingId(term.id);
    setEditData({
      sourceTerm: term.sourceTerm,
      targetTerm: term.targetTerm,
      sourceLang: term.sourceLang,
      targetLang: term.targetLang,
      notes: term.notes,
    });
  }, []);

  const saveEdit = useCallback(
    async (termId: string) => {
      await updateTerm(termId, editData);
      setEditingId(null);
      setEditData({});
    },
    [editData, updateTerm]
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditData({});
  }, []);

  const handleAddTerm = useCallback(async () => {
    if (!newTerm.sourceTerm.trim() || !newTerm.targetTerm.trim() || !currentProject) return;
    await addTerm(currentProject.id, newTerm);
    setNewTerm({ sourceTerm: '', targetTerm: '', sourceLang: 'en', targetLang: 'zh', notes: '' });
    setShowAdd(false);
  }, [newTerm, currentProject, addTerm]);

  const toggleLangFilter = useCallback((value: string) => {
    setLangFilters(prev =>
      prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value]
    );
  }, []);

  return (
    <div className="term-editor">
      <div className="term-toolbar">
        <div className="term-search-wrap">
          <input
            type="text"
            placeholder="搜索术语..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input term-search"
          />
        </div>
        <div className="term-filter">
          <span className="filter-label">语言对：</span>
          {LANG_PAIRS.map(p => (
            <button
              key={p.value}
              className={`filter-chip ${langFilters.includes(p.value) ? 'active' : ''}`}
              onClick={() => toggleLangFilter(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + 新增术语
        </button>
      </div>

      <div className="term-table-wrap">
        <table className="term-table">
          <thead>
            <tr>
              <th>源语言</th>
              <th>目标翻译</th>
              <th>语言对</th>
              <th className="notes-col">备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {showAdd && (
              <tr className="term-row term-row-new">
                <td>
                  <input
                    type="text"
                    value={newTerm.sourceTerm}
                    onChange={e => setNewTerm(v => ({ ...v, sourceTerm: e.target.value }))}
                    className="term-input"
                    placeholder="Source term"
                    autoFocus
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newTerm.targetTerm}
                    onChange={e => setNewTerm(v => ({ ...v, targetTerm: e.target.value }))}
                    className="term-input"
                    placeholder="Target term"
                  />
                </td>
                <td>
                  <select
                    value={`${newTerm.sourceLang}-${newTerm.targetLang}`}
                    onChange={e => {
                      const [s, t] = e.target.value.split('-');
                      setNewTerm(v => ({ ...v, sourceLang: s, targetLang: t }));
                    }}
                    className="term-select"
                  >
                    {LANG_PAIRS.map(p => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="notes-col">
                  <input
                    type="text"
                    value={newTerm.notes}
                    onChange={e => setNewTerm(v => ({ ...v, notes: e.target.value }))}
                    className="term-input"
                    placeholder="备注"
                  />
                </td>
                <td>
                  <div className="term-actions">
                    <button className="btn btn-sm btn-primary" onClick={handleAddTerm}>
                      保存
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setShowAdd(false)}>
                      取消
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {filteredTerms.map((term, idx) => (
              <tr key={term.id} className={`term-row ${idx % 2 === 0 ? 'even' : 'odd'}`}>
                {editingId === term.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editData.sourceTerm ?? ''}
                        onChange={e => setEditData(v => ({ ...v, sourceTerm: e.target.value }))}
                        className="term-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editData.targetTerm ?? ''}
                        onChange={e => setEditData(v => ({ ...v, targetTerm: e.target.value }))}
                        className="term-input"
                      />
                    </td>
                    <td>
                      <select
                        value={`${editData.sourceLang ?? 'en'}-${editData.targetLang ?? 'zh'}`}
                        onChange={e => {
                          const [s, t] = e.target.value.split('-');
                          setEditData(v => ({ ...v, sourceLang: s, targetLang: t }));
                        }}
                        className="term-select"
                      >
                        {LANG_PAIRS.map(p => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="notes-col">
                      <input
                        type="text"
                        value={editData.notes ?? ''}
                        onChange={e => setEditData(v => ({ ...v, notes: e.target.value }))}
                        className="term-input"
                      />
                    </td>
                    <td>
                      <div className="term-actions">
                        <button className="btn btn-sm btn-primary" onClick={() => saveEdit(term.id)}>
                          保存
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={cancelEdit}>
                          取消
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="term-source">{term.sourceTerm}</td>
                    <td className="term-target">{term.targetTerm}</td>
                    <td className="term-lang">
                      {term.sourceLang.toUpperCase()} → {term.targetLang.toUpperCase()}
                    </td>
                    <td className="notes-col">
                      {term.notes && <span className="term-tag">{term.notes}</span>}
                    </td>
                    <td>
                      <div className="term-actions">
                        <button className="btn btn-sm btn-ghost" onClick={() => startEdit(term)}>
                          编辑
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteTerm(term.id)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="term-footer">
        共 {filteredTerms.length} 条术语
        {langFilters.length > 0 && ` (已筛选)`}
      </div>
    </div>
  );
}
