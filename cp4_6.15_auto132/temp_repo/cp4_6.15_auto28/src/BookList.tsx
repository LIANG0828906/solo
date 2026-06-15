import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './context';
import { BookStorage } from './BookStorage';
import BookCard from './BookCard';
import { useDebounce } from './utils';

const BookList: React.FC = () => {
  const navigate = useNavigate();
  const { books, refreshBooks, showToast } = useApp();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const debouncedKeyword = useDebounce(searchKeyword, 200);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => BookStorage.getAllCategories(), [books]);

  const filteredBooks = useMemo(() => {
    return BookStorage.searchBooks(debouncedKeyword, {
      category: filterCategory,
      status: filterStatus
    });
  }, [books, debouncedKeyword, filterCategory, filterStatus]);

  const handleExport = () => {
    const data = BookStorage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('数据导出成功！');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isImporting) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await BookStorage.importDataWithConfirmation(text);
      refreshBooks();

      if (result.cancelled) {
        return;
      }

      if (result.imported > 0) {
        showToast(`成功导入 ${result.imported} 本图书！`, 'success');
      }
      if (result.duplicates.length > 0) {
        showToast(`${result.duplicates.length} 本重复ISBN的图书已处理`, 'info');
      }
      if (result.errors.length > 0 && result.imported === 0) {
        showToast(`导入失败: ${result.errors[0]}`, 'error');
      } else if (result.errors.length > 0) {
        showToast(`${result.errors.length} 条数据存在问题已跳过`, 'info');
      }
    } catch (err) {
      showToast('导入失败，请检查文件格式', 'error');
    } finally {
      e.target.value = '';
      setIsImporting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">我的藏书 ({books.length} 本)</h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleImportClick}>
            📥 导入数据
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            📤 导出数据
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/books/new')}>
            ➕ 添加图书
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImportFileSelect}
        />
      </div>

      <div className={`filter-bar ${filterCollapsed ? 'collapsed' : ''}`}>
        <div className="filter-toggle" onClick={() => setFilterCollapsed(!filterCollapsed)}>
          <span>{filterCollapsed ? '展开' : '收起'}筛选</span>
          <span style={{ transform: filterCollapsed ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }}>
            ❯
          </span>
        </div>
        <div className="filter-fields">
          <div className="search-input">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索书名或作者..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">全部分类</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="unread">未读</option>
            <option value="reading">在读</option>
            <option value="finished">已读</option>
          </select>
        </div>
      </div>

      {filteredBooks.length > 0 ? (
        <div className="book-grid">
          {filteredBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p className="empty-state-text">
            {searchKeyword || filterCategory || filterStatus
              ? '没有找到匹配的图书'
              : '还没有添加任何图书'}
          </p>
          {!searchKeyword && !filterCategory && !filterStatus && (
            <button className="btn btn-primary" onClick={() => navigate('/books/new')}>
              添加第一本图书
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookList;
