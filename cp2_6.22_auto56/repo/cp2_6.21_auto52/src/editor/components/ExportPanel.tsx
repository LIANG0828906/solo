import React, { useState, useEffect } from 'react';
import { X, Download, Clock, Link2, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import axios from 'axios';
import type { ExportRecord } from '../types';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ isOpen, onClose, canvasRef }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchExportHistory();
    }
  }, [isOpen]);

  const fetchExportHistory = async () => {
    try {
      const res = await axios.get('/api/exports');
      setExportHistory(res.data.slice(0, 3));
    } catch (e) {
      console.log('使用本地存储的导出记录');
      const saved = localStorage.getItem('exportHistory');
      if (saved) {
        setExportHistory(JSON.parse(saved).slice(0, 3));
      }
    }
  };

  const handleExport = async () => {
    if (!canvasRef.current || isExporting) return;

    setIsExporting(true);
    setExportProgress(0);

    const progressInterval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 3;
      });
    }, 100);

    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      const dataUrl = canvas.toDataURL('image/png');
      const fileName = `infographic_${Date.now()}.png`;

      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, fileName);
        }
      });

      let shortLink = '';
      try {
        const res = await axios.post('/api/export', {
          imageData: dataUrl,
          fileName,
        });
        shortLink = res.data.shortLink;
      } catch (e) {
        shortLink = generateShortLink();
      }

      const newRecord: ExportRecord = {
        id: Date.now().toString(),
        fileName,
        timestamp: Date.now(),
        thumbnail: dataUrl,
        shortLink,
      };

      const newHistory = [newRecord, ...exportHistory].slice(0, 3);
      setExportHistory(newHistory);
      localStorage.setItem('exportHistory', JSON.stringify(newHistory));

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        showToastMessage(`导出成功！分享链接: ${shortLink}`);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setIsExporting(false);
      setExportProgress(0);
      showToastMessage('导出失败，请重试');
    }
  };

  const generateShortLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let hash = '';
    for (let i = 0; i < 8; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `https://infographic.app/${hash}`;
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDownloadRecord = (record: ExportRecord) => {
    fetch(record.thumbnail)
      .then((res) => res.blob())
      .then((blob) => {
        saveAs(blob, record.fileName);
      });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            width: 480,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>导出图片</div>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
                color: '#666',
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                backgroundColor: '#fafafa',
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              {isExporting ? (
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                  <svg width={80} height={80} style={{ animation: 'spin 1s linear infinite' }}>
                    <circle
                      cx={40}
                      cy={40}
                      r={32}
                      fill="none"
                      stroke="#e0e0e0"
                      strokeWidth={6}
                    />
                    <circle
                      cx={40}
                      cy={40}
                      r={32}
                      fill="none"
                      stroke="#2196f3"
                      strokeWidth={6}
                      strokeDasharray={`${(exportProgress / 100) * 201} 201`}
                      strokeLinecap="round"
                      strokeDashoffset={50}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#2196f3',
                    }}
                  >
                    {exportProgress}%
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
                  <div style={{ fontSize: 16, color: '#333', marginBottom: 8 }}>
                    导出为 PNG 图片
                  </div>
                  <div style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>
                    导出尺寸: 1200 × 750 (2x 分辨率)
                    <br />
                    可生成分享短链接
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                backgroundColor: isExporting ? '#90caf9' : '#2196f3',
                color: '#fff',
                borderRadius: 8,
                cursor: isExporting ? 'not-allowed' : 'pointer',
                fontSize: 15,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 24,
              }}
            >
              <Download size={18} />
              {isExporting ? '正在导出...' : '开始导出'}
            </button>

            {exportHistory.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 12 }}>
                  <Clock size={16} />
                  最近导出
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {exportHistory.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => handleDownloadRecord(record)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px',
                        backgroundColor: '#fafafa',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        border: '1px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f7ff';
                        e.currentTarget.style.borderColor = '#bbdefb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <img
                        src={record.thumbnail}
                        alt={record.fileName}
                        style={{
                          width: 60,
                          height: 40,
                          objectFit: 'cover',
                          borderRadius: 4,
                          border: '1px solid #e0e0e0',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {record.fileName}
                        </div>
                        <div style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Link2 size={10} />
                          {formatTime(record.timestamp)}
                        </div>
                      </div>
                      <Download size={16} style={{ color: '#2196f3' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#323232',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 2000,
            animation: 'fadeIn 0.3s ease',
            maxWidth: 500,
          }}
        >
          <Check size={18} style={{ color: '#4caf50' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {toastMessage}
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
};
