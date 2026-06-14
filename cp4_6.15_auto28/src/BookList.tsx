import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './context';
import { BookStorage } from './BookStorage';
import BookCard from './BookCard';
import { useDebounce } from './utils';
import type { Book } from './types';

interface ImportConfirmState {
  show: boolean;
  jsonData: string;
  totalBooks: number;
  duplicates: string[];
  duplicateBooks: Book[];
  errors: string[];
}

const BookList: React.FC = () => {
  const navigate = useNavigate();
  const { books, refreshBooks, showToast } = useApp();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [importConfirm, setImportConfirm] = useState<ImportConfirmState>({
    show: false,
    jsonData: '',
    totalBooks: 0,
    duplicates: [],
    duplicateBooks: [],
    errors: []
  });
  const [confirmClosing, setConfirmClosing] = useState(false);
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
    if (!file) return;

    try {
      const text = await file.text();
      const preview = BookStorage.previewImportData(text);

      if (preview.errors.length > 0 && preview.totalBooks === 0) {
        showToast(`导入失败: ${preview.errors[0]}`, 'error');
        return;
      }

      if (preview.duplicates.length > 0) {
        setImportConfirm({
          show: true,
          jsonData: text,
          totalBooks: preview.totalBooks,
          duplicates: preview.duplicates,
          duplicateBooks: preview.duplicateBooks,
          errors: preview.errors
        });
      } else {
        executeImport(text, true);
      }
    } catch (err) {
      showToast('导入失败，请检查文件格式', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const executeImport = (jsonData: string, skipDuplicates: boolean) => {
    const result = BookStorage.importData(jsonData, skipDuplicates);
    refreshBooks();

    if (result.imported > 0) {
      showToast(`成功导入 ${result.imported} 本图书！`, 'success');
    }
    if (result.duplicates.length > 0 && skipDuplicates) {
      showToast(`跳过 ${result.duplicates.length} 本重复ISBN的图书`, 'info');
    }
    if (result.errors.length > 0 && result.imported === 0) {
      showToast(`导入失败: ${result.errors[0]}`, 'error');
    } else if (result.errors.length > 0) {
      showToast(`${result.errors.length} 条数据存在问题已跳过`, 'info');
    }

    closeImportConfirm();
  };

  const handleConfirmSkipDuplicates = () => {
    executeImport(importConfirm.jsonData, true);
  };

  const handleConfirmImportAll = () => {
    executeImport(importConfirm.jsonData, false);
  };

  const closeImportConfirm = () => {
    setConfirmClosing(true);
    setTimeout(() => {
      setImportConfirm({
        show: false,
        jsonData: '',
        totalBooks: 0,
        duplicates: [],
        duplicateBooks: [],
        errors: []
      });
      setConfirmClosing(false);
    }, 280);
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

      {importConfirm.show && (
        <div className="modal-overlay" onClick={closeImportConfirm}>
          <div
            className={`modal ${confirmClosing ? 'closing' : ''}`}
            style={{ maxWidth: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">⚠️ 检测到重复 ISBN</h3>
              <button className="modal-close" onClick={closeImportConfirm}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16 }}>
                文件中共包含 <strong>{importConfirm.totalBooks}</strong> 本图书，其中
                <strong style={{ color: 'var(--color-error)' }}> {importConfirm.duplicates.length} </strong>
                本的 ISBN 已存在于您的书库中：
              </p>
              <div style={{
                background: 'var(--color-bg-alt)',
                borderRadius: 8,
                padding: 12,
                maxHeight: 200,
                overflowY: 'auto',
                marginBottom: 16
              }}>
                {importConfirm.duplicateBooks.slice(0, 5).map((book, idx) => (
                  <div key={idx} style={{
                    padding: '8px 0',
                    borderBottom: idx < Math.min(importConfirm.duplicateBooks.length, 5) - 1 ? '1px solid var(--color-border)' : 'none',
                    fontSize: 14
                  }}>
                    <div style={{ fontWeight: 600 }}>{book.title}</div>
                    <div style={{ color: 'var(--color-text-light)', fontSize: 12 }}>
                      {book.author} · ISBN: {book.isbn}
                    </div>
                  </div>
                ))}
                {importConfirm.duplicateBooks.length > 5 && (
                  <div style={{ color: 'var(--color-text-light)', fontSize: 12, marginTop: 8 }}>
                    ...还有 {importConfirm.duplicateBooks.length - 5} 本重复图书
                  </div>
                )}
              </div>
              {importConfirm.errors.length > 0 && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#991B1B'
                }}>
                  ⚠️ 另外有 {importConfirm.errors.length} 条数据验证失败将被跳过
                </div>
              )}
              <p style={{ fontSize: 14, color: 'var(--color-text-light)' }}>
                请选择如何处理这些重复数据：
              </p>
            </div>
            <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <button className="btn btn-primary" onClick={handleConfirmSkipDuplicates}>
                📥 跳过重复，导入其余 {importConfirm.totalBooks - importConfirm.duplicates.length} 本
              </button>
              <button className="btn btn-secondary" onClick={handleConfirmImportAll}>
                ⚡ 强制全部导入（保留重复）
              </button>
              <button className="btn btn-secondary" onClick={closeImportConfirm}>
                取消导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookList;
