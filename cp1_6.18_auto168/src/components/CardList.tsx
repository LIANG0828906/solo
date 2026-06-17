import React, { useRef, useCallback } from 'react';
import { useGradientStore } from '../stores/gradientStore';
import { formatGradientCSS, hslToString } from '../engine/gradientEngine';

const downloadGradientPNG = (cssValue: string, stops: { position: number; color: { h: number; s: number; l: number } }[]) => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 200;
  const ctx = canvas.getContext('2d')!;

  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const grad = ctx.createLinearGradient(0, 0, 800, 0);
  sorted.forEach((s) => {
    grad.addColorStop(s.position, hslToString(s.color));
  });
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 200);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(cssValue, 400, 190);

  const link = document.createElement('a');
  link.download = 'gradient.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export const CardList: React.FC = () => {
  const {
    variants,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    exportSelected,
    exportAll,
  } = useGradientStore();

  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = useCallback((id: string, cssValue: string) => {
    navigator.clipboard.writeText(cssValue).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    });
  }, []);

  const handleExportSelected = useCallback(() => {
    const data = exportSelected();
    navigator.clipboard.writeText(data);
  }, [exportSelected]);

  const handleExportAll = useCallback(() => {
    const data = exportAll();
    navigator.clipboard.writeText(data);
  }, [exportAll]);

  const handleDownloadSelected = useCallback(() => {
    variants
      .filter((v) => selectedIds.includes(v.id))
      .forEach((v) => downloadGradientPNG(v.cssValue, v.stops));
  }, [variants, selectedIds]);

  const handleDownloadAll = useCallback(() => {
    variants.forEach((v) => downloadGradientPNG(v.cssValue, v.stops));
  }, [variants]);

  const allSelected = variants.length > 0 && selectedIds.length === variants.length;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#E0E0E0',
          }}
        >
          系列变体
        </h2>

        {variants.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={allSelected ? clearSelection : selectAll}
              style={{
                padding: '6px 12px',
                background: 'rgba(45,45,68,0.8)',
                color: '#E0E0E0',
                border: '1px solid #3E3E5E',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease-out, border-color 0.2s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8BC34A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#3E3E5E';
              }}
            >
              {allSelected ? '取消全选' : '全选'}
            </button>
            <button
              onClick={handleExportSelected}
              disabled={selectedIds.length === 0}
              style={{
                padding: '6px 12px',
                background: selectedIds.length > 0 ? '#4CAF50' : '#3E3E5E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s ease-out',
              }}
            >
              导出选中
            </button>
            <button
              onClick={handleExportAll}
              style={{
                padding: '6px 12px',
                background: '#4CAF50',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#5CBF60';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#4CAF50';
              }}
            >
              导出全部
            </button>
            <button
              onClick={handleDownloadSelected}
              disabled={selectedIds.length === 0}
              style={{
                padding: '6px 12px',
                background: selectedIds.length > 0 ? '#FF7043' : '#3E3E5E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s ease-out',
              }}
            >
              下载选中PNG
            </button>
            <button
              onClick={handleDownloadAll}
              style={{
                padding: '6px 12px',
                background: '#FF7043',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FF8A65';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FF7043';
              }}
            >
              下载全部PNG
            </button>
          </div>
        )}
      </div>

      {variants.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666680',
            fontSize: 14,
          }}
        >
          点击"生成系列变体"按钮开始
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 130px)',
            gap: 16,
            alignContent: 'start',
            padding: '4px 0',
          }}
        >
          {variants.map((variant, idx) => {
            const isSelected = selectedIds.includes(variant.id);
            const isCopied = copiedId === variant.id;
            return (
              <div
                key={variant.id}
                className={`variant-card card-animate`}
                style={{
                  width: 130,
                  borderRadius: 12,
                  border: '1px solid #E0E0E0',
                  background: 'rgba(45,45,68,0.8)',
                  backdropFilter: 'blur(8px)',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'relative',
                  animationDelay: `${idx * 50}ms`,
                  cursor: 'default',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    zIndex: 2,
                  }}
                >
                  <input
                    type="checkbox"
                    className="theme-checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(variant.id)}
                  />
                </div>

                <div
                  style={{
                    height: 80,
                    background: variant.cssValue,
                    borderRadius: '12px 12px 0 0',
                  }}
                />

                <div style={{ padding: '8px 8px 10px' }}>
                  <div
                    style={{
                      fontSize: 9,
                      color: '#8888A0',
                      fontFamily: 'monospace',
                      lineHeight: 1.4,
                      marginBottom: 8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={variant.cssValue}
                  >
                    {variant.cssValue}
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(variant.id, variant.cssValue)}
                    style={{
                      width: '100%',
                      padding: '5px 0',
                      background: isCopied ? '#8BC34A' : '#4CAF50',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, background-color 0.2s ease-out',
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {isCopied ? '已复制 ✓' : '复制CSS'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
