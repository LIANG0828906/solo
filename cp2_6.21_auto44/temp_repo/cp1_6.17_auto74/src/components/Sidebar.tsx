import React, { useState, useEffect, useMemo } from 'react';
import { useNoteStore } from '../store/useNoteStore';
import { highlightKeyword } from '../SearchModule/searchEngine';

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export const Sidebar: React.FC = () => {
  const {
    allTags,
    selectedNoteId,
    searchKeyword,
    selectedTag,
    currentView,
    loadNotes,
    selectNote,
    createNote,
    setSearchKeyword,
    setSelectedTag,
    setCurrentView,
    getFilteredNotes,
    removeNote
  } = useNoteStore();

  const [localSearch, setLocalSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyword(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchKeyword]);

  const filteredNotes = useMemo(() => getFilteredNotes(), [getFilteredNotes, searchKeyword, selectedTag]);

  const handleCreateNote = () => {
    createNote();
    setIsMobileMenuOpen(false);
  };

  const handleSelectNote = (id: string) => {
    selectNote(id);
    setIsMobileMenuOpen(false);
  };

  const handleDeleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这篇笔记吗？')) {
      removeNote(id);
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  const handleToggleStatistics = () => {
    setCurrentView(currentView === 'statistics' ? 'editor' : 'statistics');
    setIsMobileMenuOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <h2 className="sidebar-title">📚 知识库</h2>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="搜索笔记..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      <div className="tags-filter-container">
        <div className="tags-filter-label">标签过滤:</div>
        <div className="tags-filter-list">
          <button
            className={`tag-filter-btn ${selectedTag === null ? 'active' : ''}`}
            onClick={() => setSelectedTag(null)}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => handleToggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="notes-list-container">
        <div className="notes-list-header">
          <span>笔记列表 ({filteredNotes.length})</span>
        </div>
        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <div className="empty-notes">暂无笔记</div>
          ) : (
            filteredNotes.map(note => {
              const summary = stripHtml(note.content).slice(0, 30);
              return (
                <div
                  key={note.id}
                  className={`note-item ${selectedNoteId === note.id && currentView === 'editor' ? 'active' : ''}`}
                  onClick={() => handleSelectNote(note.id)}
                >
                  <div className="note-item-header">
                    <span
                      className="note-item-title"
                      dangerouslySetInnerHTML={{
                        __html: highlightKeyword(note.title, searchKeyword)
                      }}
                    />
                    <button
                      className="note-delete-btn"
                      onClick={(e) => handleDeleteNote(e, note.id)}
                      title="删除笔记"
                    >
                      ×
                    </button>
                  </div>
                  <div
                    className="note-item-summary"
                    dangerouslySetInnerHTML={{
                      __html: highlightKeyword(summary || '（无内容）', searchKeyword)
                    }}
                  />
                  <div className="note-item-date">{formatDate(note.createdAt)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="new-note-btn" onClick={handleCreateNote}>
          + 新建笔记
        </button>
        <button
          className={`stats-btn ${currentView === 'statistics' ? 'active' : ''}`}
          onClick={handleToggleStatistics}
          title="统计"
        >
          📊 统计
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="sidebar desktop-sidebar">
        {sidebarContent}
      </aside>

      <header className="mobile-header">
        <div className="mobile-header-left">
          <span className="mobile-title">📚 知识库</span>
        </div>
        <div className="mobile-header-right">
          <button
            className={`stats-btn mobile-stats-btn ${currentView === 'statistics' ? 'active' : ''}`}
            onClick={handleToggleStatistics}
            title="统计"
          >
            📊
          </button>
          <button
            className="new-note-btn mobile-new-btn"
            onClick={handleCreateNote}
          >
            +
          </button>
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="mobile-dropdown-menu">
          <div className="mobile-menu-content">
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="搜索笔记..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>

            <div className="tags-filter-container">
              <div className="tags-filter-label">标签过滤:</div>
              <div className="tags-filter-list">
                <button
                  className={`tag-filter-btn ${selectedTag === null ? 'active' : ''}`}
                  onClick={() => { setSelectedTag(null); }}
                >
                  全部
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => { handleToggleTag(tag); }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="notes-list-container">
              <div className="notes-list-header">
                <span>笔记列表 ({filteredNotes.length})</span>
              </div>
              <div className="notes-list">
                {filteredNotes.length === 0 ? (
                  <div className="empty-notes">暂无笔记</div>
                ) : (
                  filteredNotes.map(note => {
                    const summary = stripHtml(note.content).slice(0, 30);
                    return (
                      <div
                        key={note.id}
                        className={`note-item ${selectedNoteId === note.id && currentView === 'editor' ? 'active' : ''}`}
                        onClick={() => handleSelectNote(note.id)}
                      >
                        <div className="note-item-header">
                          <span
                            className="note-item-title"
                            dangerouslySetInnerHTML={{
                              __html: highlightKeyword(note.title, searchKeyword)
                            }}
                          />
                          <button
                            className="note-delete-btn"
                            onClick={(e) => handleDeleteNote(e, note.id)}
                          >
                            ×
                          </button>
                        </div>
                        <div
                          className="note-item-summary"
                          dangerouslySetInnerHTML={{
                            __html: highlightKeyword(summary || '（无内容）', searchKeyword)
                          }}
                        />
                        <div className="note-item-date">{formatDate(note.createdAt)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
