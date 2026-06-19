import { useState, useMemo } from 'react';
import { useQuizStore } from '@/hooks/useQuizStore';
import { QUESTION_TYPE_LABELS, type Question } from '@/utils/api';
import { exportToTxt, exportToJson } from '@/utils/exportUtils';
import { useRipple } from '@/hooks/useRipple';
import { Search, Download, Trash2, Edit3, Check, X } from 'lucide-react';

export default function QuizTable() {
  const { quizBank, removeFromQuizBank, updateQuizRecord } = useQuizStore();
  const [searchText, setSearchText] = useState('');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterDifficulties, setFilterDifficulties] = useState<number[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Question>>({});

  const txtRipple = useRipple('export-txt-btn');
  const jsonRipple = useRipple('export-json-btn');
  const clearRipple = useRipple('clear-filters-btn');

  const filtered = useMemo(() => {
    const records = quizBank.filter((r) => {
      const q = r.question;
      if (searchText && !q.stem.includes(searchText) && !q.knowledge_tag.includes(searchText)) return false;
      if (filterTypes.length > 0 && !filterTypes.includes(q.type)) return false;
      if (filterDifficulties.length > 0 && !filterDifficulties.includes(q.difficulty)) return false;
      if (filterTags.length > 0 && !filterTags.includes(q.knowledge_tag)) return false;
      return true;
    });
    return records;
  }, [quizBank, searchText, filterTypes, filterDifficulties, filterTags]);

  const uniqueTags = useMemo(() => {
    const tags = new Set(quizBank.map((r) => r.question.knowledge_tag).filter(Boolean));
    return Array.from(tags);
  }, [quizBank]);

  const toggleType = (type: string) => {
    setFilterTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const toggleDifficulty = (d: number) => {
    setFilterDifficulties((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const toggleTag = (tag: string) => {
    setFilterTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const clearFilters = (e: React.MouseEvent<HTMLButtonElement>) => {
    clearRipple.onClick(e);
    setFilterTypes([]);
    setFilterDifficulties([]);
    setFilterTags([]);
    setSearchText('');
  };

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

  const hasActiveFilters = filterTypes.length > 0 || filterDifficulties.length > 0 || filterTags.length > 0;

  const handleTxtExport = (e: React.MouseEvent<HTMLButtonElement>) => {
    txtRipple.onClick(e);
    exportToTxt(filtered);
  };

  const handleJsonExport = (e: React.MouseEvent<HTMLButtonElement>) => {
    jsonRipple.onClick(e);
    exportToJson(filtered);
  };

  return (
    <div className="quiz-table-wrapper">
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="搜索题干或知识点..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
        </div>
        {hasActiveFilters && (
          <button
            className="clear-filters-btn ripple-container"
            onClick={clearFilters}
          >
            清除筛选
            {clearRipple.rippleElements}
          </button>
        )}
      </div>

      <div className="filter-chips-row">
        <div className="filter-group">
          <span className="filter-label">题型:</span>
          <div className="filter-chips">
            {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
              <button
                key={k}
                className={`filter-chip ripple-container ${filterTypes.includes(k) ? 'chip-active' : ''}`}
                onClick={() => toggleType(k)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">难度:</span>
          <div className="filter-chips">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                className={`filter-chip ripple-container ${filterDifficulties.includes(d) ? 'chip-active' : ''}`}
                onClick={() => toggleDifficulty(d)}
              >
                {d}级
              </button>
            ))}
          </div>
        </div>

        {uniqueTags.length > 0 && (
          <div className="filter-group">
            <span className="filter-label">知识点:</span>
            <div className="filter-chips">
              {uniqueTags.map((t) => (
                <button
                  key={t}
                  className={`filter-chip ripple-container ${filterTags.includes(t) ? 'chip-active' : ''}`}
                  onClick={() => toggleTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="export-row">
        <div className="export-group">
          <button
            className="export-btn ripple-container"
            onClick={handleTxtExport}
          >
            <Download size={14} />
            导出TXT
            {txtRipple.rippleElements}
          </button>
          <button
            className="export-btn ripple-container"
            onClick={handleJsonExport}
          >
            <Download size={14} />
            导出JSON
            {jsonRipple.rippleElements}
          </button>
        </div>
        <div className="filter-info">
          筛选后 {filtered.length} / 共 {quizBank.length} 条
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
                  {quizBank.length === 0
                    ? '暂无题目，请先生成并收藏题目'
                    : '没有符合筛选条件的题目'}
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
    </div>
  );
}
