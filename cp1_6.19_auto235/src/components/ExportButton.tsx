import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ExportButtonProps {
  targetRef: React.RefObject<HTMLElement>;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ targetRef, disabled }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!targetRef.current || isExporting) return;

    setIsExporting(true);

    try {
      const timestamp = Date.now();
      const filename = `cover_idea_${timestamp}.png`;

      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#FAFAFA',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const loadingElements = clonedDoc.querySelectorAll('.loading-overlay');
          loadingElements.forEach(el => el.remove());
        }
      });

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();

      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      className="btn btn-accent"
      onClick={handleExport}
      disabled={disabled || isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          导出中...
        </>
      ) : (
        <>
          <Download size={16} />
          导出PNG
        </>
      )}
    </button>
  );
};
