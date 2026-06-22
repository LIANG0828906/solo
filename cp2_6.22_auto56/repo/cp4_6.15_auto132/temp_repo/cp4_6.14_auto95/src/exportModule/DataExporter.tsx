import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { DataRow } from '../types';

type ExportFormat = 'json' | 'csv' | 'tsv';

interface DataExporterProps {
  data: DataRow[];
}

export const DataExporter: React.FC<DataExporterProps> = ({ data }) => {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const generateFileName = (format: ExportFormat): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `mocked_data_${year}${month}${day}_${hours}${minutes}${seconds}.${format}`;
  };

  const convertToJSON = (): string => {
    return JSON.stringify(data, null, 2);
  };

  const convertToDelimited = (delimiter: string): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const headerRow = headers.join(delimiter);

    const rows = data.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? '');
          if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(delimiter)
    );

    return [headerRow, ...rows].join('\n');
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: ExportFormat) => {
    if (exportingFormat) return;

    setExportingFormat(format);

    setTimeout(() => {
      let content: string;
      let mimeType: string;
      let fileName = generateFileName(format);

      switch (format) {
        case 'json':
          content = convertToJSON();
          mimeType = 'application/json';
          break;
        case 'csv':
          content = convertToDelimited(',');
          mimeType = 'text/csv;charset=utf-8';
          break;
        case 'tsv':
          content = convertToDelimited('\t');
          mimeType = 'text/tab-separated-values;charset=utf-8';
          break;
        default:
          content = '';
          mimeType = 'text/plain';
      }

      downloadFile(content, fileName, mimeType);
      setExportingFormat(null);
    }, 800);
  };

  const formats: { key: ExportFormat; label: string }[] = [
    { key: 'json', label: 'JSON' },
    { key: 'csv', label: 'CSV' },
    { key: 'tsv', label: 'TSV' },
  ];

  return (
    <div style={containerStyle}>
      {formats.map(({ key, label }) => {
        const isExporting = exportingFormat === key;
        return (
          <button
            key={key}
            onClick={() => handleExport(key)}
            disabled={isExporting || data.length === 0}
            style={{
              ...buttonStyle,
              opacity: data.length === 0 ? 0.5 : 1,
              cursor: data.length === 0 ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (data.length > 0 && !isExporting) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!isExporting) {
                e.currentTarget.style.backgroundColor = '#475569';
              }
            }}
          >
            {isExporting ? (
              <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <Download size={16} />
            )}
            <span>{label}</span>
          </button>
        );
      })}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const buttonStyle: React.CSSProperties = {
  width: 96,
  height: 40,
  backgroundColor: '#475569',
  color: '#ffffff',
  borderRadius: 8,
  border: 'none',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'background-color 0.2s ease',
};
