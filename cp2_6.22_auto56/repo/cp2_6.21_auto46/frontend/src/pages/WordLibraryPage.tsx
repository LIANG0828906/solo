import { useState, useEffect } from 'react';
import { useWordStore } from '../stores/wordStore';
import WordList from '../components/WordList';
import './WordLibraryPage.css';

function WordLibraryPage() {
  const {
    words,
    isLoading,
    searchQuery,
    sortBy,
    fetchWords,
    addWord,
    deleteWord,
    setSearchQuery,
    setSortBy,
  } = useWordStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newCorpusId, setNewCorpusId] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchWords(1);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchWords(1, query, sortBy);
  };

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value;
    setSortBy(sort);
    fetchWords(1, searchQuery, sort);
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    try {
      await addWord(newWord.trim(), newDefinition.trim(), newCorpusId.trim());
      setNewWord('');
      setNewDefinition('');
      setNewCorpusId('');
      setShowAddModal(false);
    } catch (err) {
      setAddError('添加失败，请重试');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = (wordId: number) => {
    if (window.confirm('确定要删除这个词汇吗？')) {
      deleteWord(wordId);
    }
  };

  return (
    <div className="word-library-page">
      <div className="page-header">
        <h1 className="page-title">我的词库</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <span>+</span> 添加词汇
        </button>
      </div>

      <div className="toolbar card">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索词汇..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="sort-box">
          <label className="sort-label">排序：</label>
          <select value={sortBy} onChange={handleSort} className="sort-select">
            <option value="created_at">按添加时间</option>
            <option value="priority">按复习优先级</option>
          </select>
        </div>
      </div>

      <div className="word-count">
        共 <strong>{words.length}</strong> 个词汇
      </div>

      <WordList words={words} onDelete={handleDelete} isLoading={isLoading} />

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">添加新词汇</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWord}>
              {addError && <div className="form-error">{addError}</div>}

              <div className="form-group">
                <label className="form-label">词汇 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="输入英文单词"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">释义 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDefinition}
                  onChange={(e) => setNewDefinition(e.target.value)}
                  placeholder="输入中文释义"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">关联语料ID（可选）</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCorpusId}
                  onChange={(e) => setNewCorpusId(e.target.value)}
                  placeholder="如：mov_001, music_001, news_001"
                />
                <div className="form-hint">
                  留空系统会自动匹配例句。可用语料：mov_001 ~ mov_006, music_001 ~ music_002, news_001 ~ news_002
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addLoading}
                >
                  {addLoading ? '添加中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WordLibraryPage;
