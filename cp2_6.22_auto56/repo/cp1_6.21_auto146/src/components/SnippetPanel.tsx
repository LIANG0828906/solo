import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Language } from '../types';

const languageColors: Record<Language, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  CSS: '#2965F1',
  HTML: '#E34F26',
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const SnippetPanel: React.FC = () => {
  const {
    snippets,
    selectedId,
    searchKeyword,
    setSelectedId,
    setSearchKeyword,
    generateGraph,
    addSnippet,
  } = useAppContext();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [newLanguage, setNewLanguage] = useState<Language>('TypeScript');
  const [newModule, setNewModule] = useState('');
  const [newContent, setNewContent] = useState('');

  const filteredSnippets = useMemo(() => {
    if (!searchKeyword.trim()) return snippets;
    const keyword = searchKeyword.toLowerCase();
    return snippets.filter(
      (s) =>
        s.filename.toLowerCase().includes(keyword) ||
        s.module.toLowerCase().includes(keyword)
    );
  }, [snippets, searchKeyword]);

  const handleAddSnippet = () => {
    if (!newFilename.trim()) return;
    addSnippet({
      filename: newFilename,
      language: newLanguage,
      module: newModule || '默认模块',
      content: newContent,
      dependencies: [],
    });
    setNewFilename('');
    setNewModule('');
    setNewContent('');
    setShowAddForm(false);
  };

  return (
    <aside className="snippet-panel">
      <div className="panel-header">
        <h2 className="panel-title">代码片段</h2>
        <button
          className="add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          title="新增片段"
        >
          +
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="搜索片段..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
      </div>

      {showAddForm && (
        <div className="add-form">
          <input
            type="text"
            placeholder="文件名"
            value={newFilename}
            onChange={(e) => setNewFilename(e.target.value)}
            className="form-input"
          />
          <select
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value as Language)}
            className="form-select"
          >
            <option value="TypeScript">TypeScript</option>
            <option value="JavaScript">JavaScript</option>
            <option value="CSS">CSS</option>
            <option value="HTML">HTML</option>
          </select>
          <input
            type="text"
            placeholder="模块名"
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            className="form-input"
          />
          <textarea
            placeholder="代码内容"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="form-textarea"
            rows={4}
          />
          <div className="form-actions">
            <button className="btn-cancel" onClick={() => setShowAddForm(false)}>
              取消
            </button>
            <button className="btn-confirm" onClick={handleAddSnippet}>
              添加
            </button>
          </div>
        </div>
      )}

      <div className="snippet-list">
        {filteredSnippets.map((snippet, index) => (
          <div
            key={snippet.id}
            className={`snippet-card ${snippet.id === selectedId ? 'active' : ''}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => setSelectedId(snippet.id)}
          >
            <div className="card-header">
              <span className="card-filename">{snippet.filename}</span>
              <span
                className="language-tag"
                style={{
                  backgroundColor: languageColors[snippet.language] + '20',
                  color: languageColors[snippet.language],
                }}
              >
                {snippet.language}
              </span>
            </div>
            <div className="card-footer">
              <span className="card-time">
                最后编辑：{formatDate(snippet.updatedAt)}
              </span>
              <span className="card-module">{snippet.module}</span>
            </div>
          </div>
        ))}
        {filteredSnippets.length === 0 && (
          <div className="empty-state">暂无代码片段</div>
        )}
      </div>

      <div className="panel-footer">
        <button className="generate-btn" onClick={generateGraph}>
          生成关系图
        </button>
      </div>
    </aside>
  );
};
