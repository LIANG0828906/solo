import React, { useEffect } from 'react';
import type { TimelineEvent } from '@/types';

interface DataPreviewModalProps {
  visible: boolean;
  data: TimelineEvent[];
  headers: string[];
  onClose: () => void;
}

export default function DataPreviewModal({ visible, data, headers, onClose }: DataPreviewModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (visible) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getCellValue = (event: TimelineEvent, header: string) => {
    const value = event[header];
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className="flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{
          width: '750px',
          height: '500px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">数据预览</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse min-w-full">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200"
                  style={{ height: '36px' }}
                >
                  #
                </th>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap"
                    style={{ height: '36px' }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((event, index) => (
                <tr
                  key={event.id}
                  className="hover:bg-blue-50/50 transition-colors"
                  style={{
                    height: '36px',
                    backgroundColor: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF',
                  }}
                >
                  <td className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                    {index + 1}
                  </td>
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap"
                    >
                      {getCellValue(event, header)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <span className="text-sm text-gray-500">
            共 {data.length} 条数据
          </span>
        </div>
      </div>
    </div>
  );
}
