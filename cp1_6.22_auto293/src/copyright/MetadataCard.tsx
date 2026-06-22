import React, { useState } from 'react';
import type { WatermarkParams, DocumentMeta } from '../watermark/WatermarkEngine';
import { WatermarkEngine } from '../watermark/WatermarkEngine';

interface MetadataCardProps {
  meta: DocumentMeta;
  watermarkParams: WatermarkParams;
  documentContent: string;
}

const MetadataCard: React.FC<MetadataCardProps> = ({ meta, watermarkParams, documentContent }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      const fullHtml = WatermarkEngine.generateFullHtmlTemplate(
        documentContent,
        meta,
        watermarkParams
      );
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meta.title}_带水印.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsDownloading(false);
    }, 1000);
  };

  const cardStyle: React.CSSProperties = {
    width: '85%',
    maxWidth: 800,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
    border: '1px solid #D1D5DB',
    padding: '24px 28px',
    marginTop: 24,
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 32,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  };

  const columnStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: 500,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid #D1D5DB',
  };

  const buttonBaseStyle: React.CSSProperties = {
    marginTop: 16,
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: isDownloading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.3s ease-in-out',
    opacity: isDownloading ? 0.8 : 1,
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
  };

  const spinnerStyle: React.CSSProperties = {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .meta-download-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4) !important;
        }
      `}</style>
      <div style={cardStyle}>
        <div style={columnStyle}>
          <div style={titleStyle}>📄 文档信息</div>
          <div>
            <div style={labelStyle}>文档标题</div>
            <div style={valueStyle}>{meta.title}</div>
          </div>
          <div>
            <div style={labelStyle}>作　　者</div>
            <div style={valueStyle}>{meta.author}</div>
          </div>
          <div>
            <div style={labelStyle}>生成时间</div>
            <div style={valueStyle}>{meta.createdAt}</div>
          </div>
        </div>
        <div style={columnStyle}>
          <div style={titleStyle}>💧 水印参数快照</div>
          <div>
            <div style={labelStyle}>水印文字</div>
            <div style={valueStyle}>{watermarkParams.text}</div>
          </div>
          <div>
            <div style={labelStyle}>字　　体</div>
            <div style={valueStyle}>{watermarkParams.fontFamily}</div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={labelStyle}>透明度</div>
              <div style={valueStyle}>{(watermarkParams.opacity * 100).toFixed(0)}%</div>
            </div>
            <div>
              <div style={labelStyle}>角　度</div>
              <div style={valueStyle}>{watermarkParams.angle}°</div>
            </div>
            <div>
              <div style={labelStyle}>间　距</div>
              <div style={valueStyle}>{watermarkParams.spacing}px</div>
            </div>
          </div>
          <button
            className="meta-download-btn"
            style={buttonBaseStyle}
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <span style={spinnerStyle}></span>
                正在生成...
              </>
            ) : (
              <>⬇ 下载HTML</>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default MetadataCard;
