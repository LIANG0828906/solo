import React, { useState, useCallback } from 'react';
import { storageService } from '../modules/shared/storageService';
import './ExportButton.css';

const ExportButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleExport = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setShowToast(false);

    try {
      const now = new Date();
      const records = await storageService.getRecordsByMonth(now.getFullYear(), now.getMonth());
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const jsonData = storageService.exportToJson(records);
      const filename = `emotion-records-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.json`;
      
      storageService.downloadJson(jsonData, filename);
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('导出失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <div className="export-wrapper">
      <button
        className="export-button"
        onClick={handleExport}
        disabled={isLoading}
        type="button"
      >
        {isLoading ? (
          <span className="export-loading">
            <span className="export-spinner" />
            导出中...
          </span>
        ) : (
          <span className="export-content">
            <span className="export-icon">📥</span>
            导出本月数据
          </span>
        )}
      </button>

      {showToast && (
        <div className="toast-container">
          <div className="toast toast-success">
            <span className="toast-icon">✓</span>
            <span className="toast-message">下载成功！</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
