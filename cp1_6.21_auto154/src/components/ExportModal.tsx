import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardRef: React.RefObject<HTMLDivElement>;
}

type ExportFormat = 'png' | 'pdf-a4' | 'pdf-letter';

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, boardRef }) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!boardRef.current) return;

    setIsExporting(true);
    setProgress(10);

    try {
      const targetElement = boardRef.current;
      const rect = targetElement.getBoundingClientRect();

      setProgress(30);

      const canvas = await html2canvas(targetElement, {
        backgroundColor: '#1A1A2E',
        scale: 2,
        useCORS: true,
        logging: false,
        width: rect.width,
        height: rect.height,
      });

      setProgress(60);

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `白板导出_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const isA4 = format === 'pdf-a4';
        const pdfWidth = isA4 ? 210 : 216;
        const pdfHeight = isA4 ? 297 : 279;

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF({
          orientation: imgHeight > pdfHeight ? 'portrait' : 'portrait',
          unit: 'mm',
          format: isA4 ? 'a4' : 'letter',
        });

        const heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

        if (heightLeft > pdfHeight) {
          let remainingHeight = heightLeft - pdfHeight;
          while (remainingHeight > 0) {
            position = remainingHeight - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            remainingHeight -= pdfHeight;
          }
        }

        pdf.save(`白板导出_${Date.now()}.pdf`);
      }

      setProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
        setProgress(0);
      }, 500);
    } catch (error) {
      console.error('导出失败:', error);
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '28px',
          width: '400px',
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
            }}
          >
            导出白板
          </h3>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#94A3B8',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[
            { value: 'png', label: 'PNG 图片', desc: '高清位图格式' },
            { value: 'pdf-a4', label: 'PDF (A4)', desc: 'A4纸张尺寸' },
            { value: 'pdf-letter', label: 'PDF (Letter)', desc: 'Letter纸张尺寸' },
          ].map((option) => (
            <label
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor:
                  format === option.value
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                border:
                  format === option.value
                    ? '2px solid #3B82F6'
                    : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="radio"
                checked={format === option.value}
                onChange={() => setFormat(option.value as ExportFormat)}
                disabled={isExporting}
                style={{ accentColor: '#3B82F6', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 500 }}>
                  {option.label}
                </div>
                <div style={{ color: '#94A3B8', fontSize: '12px' }}>{option.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {isExporting && (
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: '#3B82F6',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', margin: 0 }}>
              正在生成... {progress}%
            </p>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!isExporting) e.currentTarget.style.backgroundColor = '#059669';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isExporting ? '#10B981' : '#10B981';
          }}
        >
          <Download size={18} />
          {isExporting ? '导出中...' : '开始导出'}
        </button>
      </div>
    </div>
  );
};

export default ExportModal;
