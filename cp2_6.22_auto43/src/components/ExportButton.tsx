import React, { useState, useCallback } from 'react';
import { storageService } from '../modules/shared/storageService';
import './ExportButton.css';

const ExportButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setShowSuccess(false);

    try {
      const now = new Date();
      const records = await storageService.getRecordsByMonth(now.getFullYear(), now.getMonth());
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const jsonData = storageService.exportToJson(records);
      const filename = `emotion-records-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.json`;
      
      storageService.downloadJson(jsonData, filename);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error('导出失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <div className="export-container">
      <button
        className="export-button"
        onClick={handleExport}
        disabled={isLoading}
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
      
      {showSuccess && (
        <span className="export-success">
          ✓ 下载成功！
        </span>
      )}
    </div>
  );
};

export default ExportButton;
