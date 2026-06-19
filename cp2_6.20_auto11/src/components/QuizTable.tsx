import { useState, useMemo } from 'react';
import { useQuizStore } from '@/hooks/useQuizStore';
import { QUESTION_TYPE_LABELS, type Question } from '@/utils/api';
import { exportToTxt, exportToJson } from '@/utils/exportUtils';
import { Search, Download, Trash2, Edit3, Check, X } from 'lucide-react';

export default function QuizTable() {
  const { quizBank, removeFromQuizBank, updateQuizRecord } = useQuizStore();
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Question>>({});

  const filtered = useMemo(() => {
    const records = quizBank.filter((r) => {
      const q = r.question;
      if (searchText && !q.stem.includes(searchText)) return false;
      if (filterType && q.type !== filterType) return false;
      if (filterDifficulty && q.difficulty !== Number(filterDifficulty)) return false;
      if (filterTag && q.knowledge_tag !== filterTag) return false;
      return true;
    });
    return records;
  }, [quizBank, searchText, filterType, filterDifficulty, filterTag]);

  const uniqueTags = useMemo(() => {
    const tags = new Set(quizBank.map((r) => r.question.knowledge_tag).filter(Boolean));
    return Array.from(tags);
  }, [quizBank]);

  const startEdit = (id: string, question: Question) => {
    setEditingId(id);
    setEditData({ stem: question.stem, options: question.options, answer: question.answer });
  };

  const saveEdit = () => {
    if (editingId && editData) {
      updateQuizRecord(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const selectedIds = filtered.map((r) => r.id);

  return (
    <div className="quiz-table-wrapper">
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="搜索题干..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="">全部题型</option>
          {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="filter-select"
        >
          <option value="">全部难度</option>
          {[1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>难度 {d}</option>
          ))}
        </select>
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="filter-select"
        >
          <option value="">全部知识点</option>
          {uniqueTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="export-group">
          <button className="export-btn" onClick={() => exportToTxt(filtered)}>
            <Download size={14} />
            导出TXT
          </button>
          <button className="export-btn" onClick={() => exportToJson(filtered)}>
            <Download size={14} />
            导出JSON
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="quiz-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>题型</th>
              <th>难度</th>
              <th>知识点</th>
              <th>题干</th>
              <th>答案</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  暂无题目，请先生成并收藏题目
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const q = r.question;
                const isEditing = editingId === r.id;
                return (
                  <tr key={r.id} className={isEditing ? 'editing-row' : ''}>
                    <td>{i + 1}</td>
                    <td>
                      <span className="badge badge-type">{QUESTION_TYPE_LABELS[q.type]}</span>
                    </td>
                    <td>
                      <span className="diff-num">{q.difficulty}</span>
                    </td>
                    <td>{q.knowledge_tag || '-'}</td>
                    <td className="stem-cell">
                      {isEditing ? (
                        <input
                          className="edit-input"
                          value={editData.stem || ''}
                          onChange={(e) => setEditData({ ...editData, stem: e.target.value })}
                        />
                      ) : (
                        q.stem
                      )}
                    </td>
                    <td className="answer-cell">
                      {Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}
                    </td>
                    <td>
                      <div className="row-actions">
                        {isEditing ? (
                          <>
                            <button className="icon-btn icon-save" onClick={saveEdit}>
                              <Check size={14} />
                            </button>
                            <button className="icon-btn icon-cancel" onClick={cancelEdit}>
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="icon-btn icon-edit"
                              onClick={() => startEdit(r.id, q)}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="icon-btn icon-delete"
                              onClick={() => removeFromQuizBank(r.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        共 {selectedIds.length} 条记录
      </div>
    </div>
  );
}
