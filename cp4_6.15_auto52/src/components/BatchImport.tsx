import React, { useState } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { isValidIsbn } from '@/utils/priority';

interface BatchImportProps {
  onClose: () => void;
}

export default function BatchImport({ onClose }: BatchImportProps) {
  const { batchImportBooks } = useLibrary();
  const [isbnText, setIsbnText] = useState('');
  const [importing, setImporting] = useState(false);
  const [progressList, setProgressList] = useState<{ success: number; failed: number; progress: number }[]>([]);
  const [done, setDone] = useState(false);

  const handleImport = async () => {
    const isbns = isbnText
      .split(/[\n,;，；\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (isbns.length === 0) return;

    setImporting(true);
    setProgressList([]);
    setDone(false);

    const results = await batchImportBooks(isbns);
    setProgressList(results);
    setDone(true);
    setImporting(false);
  };

  const currentProgress = progressList.length > 0 ? progressList[progressList.length - 1] : null;
  const lastResult = progressList.length > 0 ? progressList[progressList.length - 1] : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="batch-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="book-form-header">
          <h3>批量导入 (ISBN)</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="batch-import-body">
          <p className="import-hint">从剪贴板粘贴ISBN列表，每行一个或用逗号分隔</p>
          <textarea
            value={isbnText}
            onChange={(e) => setIsbnText(e.target.value)}
            placeholder={"9787544253994\n9787506365437\n9787536692930"}
            className="import-textarea"
            disabled={importing}
            rows={6}
          />
          {(importing || done) && currentProgress && (
            <div className="import-progress">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${currentProgress.progress}%` }}
                />
              </div>
              <div className="progress-stats">
                <span>成功: {currentProgress.success}</span>
                <span>失败: {currentProgress.failed}</span>
                <span>{Math.round(currentProgress.progress)}%</span>
              </div>
            </div>
          )}
          {done && lastResult && (
            <div className="import-result">
              导入完成！成功 {lastResult.success} 本，失败 {lastResult.failed} 本
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-cancel" onClick={onClose} disabled={importing}>
              {done ? '关闭' : '取消'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing || !isbnText.trim()}
            >
              {importing ? '导入中...' : '开始导入'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
