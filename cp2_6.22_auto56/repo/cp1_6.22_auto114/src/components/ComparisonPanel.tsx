import React from 'react';
import { ImageData } from '../data/sampleImages';

interface ComparisonPanelProps {
  images: ImageData[];
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ images }) => {
  if (images.length === 0) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          textAlign: 'center',
          color: '#999'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
        <div style={{ fontSize: '15px' }}>点击「对比当前所有已上传图片」按钮</div>
        <div style={{ fontSize: '13px', marginTop: '6px', color: '#BBB' }}>
          请先上传至少一张图片
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '20px',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span style={{ display: 'inline-block', width: '4px', height: '18px', background: '#27AE60', borderRadius: '2px' }} />
        多图主色调对比 · 共 {images.length} 张图片
      </div>

      <div
        style={{
          background: '#F4F4F4',
          padding: '16px',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: '16px',
            padding: '8px 12px',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '12px', color: '#999', fontWeight: 500 }}>图片</span>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              fontSize: '12px',
              color: '#999',
              fontWeight: 500
            }}
          >
            <span>主色调色块（按占比从左到右）</span>
            <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
              ▶ 颜色顺序：占比高 → 低
            </span>
          </div>
        </div>

        {images.map((img, rowIdx) => (
          <div
            key={img.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              gap: '16px',
              background: '#FFFFFF',
              padding: '12px',
              borderRadius: '8px',
              alignItems: 'center',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={img.url}
                alt={img.title}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                  border: '1px solid #EEE'
                }}
                loading="lazy"
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#333',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {img.title}
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                  #{rowIdx + 1} · 5色
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {img.mainColors.map((color, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      background: color.hex,
                      borderRadius: '4px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.4)';
                      (e.currentTarget as HTMLDivElement).style.zIndex = '2';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                      (e.currentTarget as HTMLDivElement).style.zIndex = '1';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                    title={`${color.name} · ${color.hex} · ${color.percentage}%`}
                  />
                </div>
              ))}

              <div
                style={{
                  marginLeft: '12px',
                  fontSize: '11px',
                  color: '#888',
                  fontFamily: 'monospace',
                  display: 'flex',
                  gap: '6px'
                }}
              >
                {img.mainColors.slice(0, 2).map((color, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '2px 6px',
                      background: '#F5F5F5',
                      borderRadius: '3px',
                      border: '1px solid #EEE'
                    }}
                  >
                    {color.hex.toUpperCase()}
                  </span>
                ))}
                {img.mainColors.length > 2 && (
                  <span style={{ color: '#BBB', alignSelf: 'center' }}>
                    +{img.mainColors.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.08), rgba(53, 122, 189, 0.05))',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
          lineHeight: 1.6,
          borderLeft: '3px solid #4A90D9'
        }}
      >
        <strong style={{ color: '#4A90D9' }}>💡 对比提示：</strong>
        横向对比各行色块可快速判断多组照片的整体色调倾向。相同位置的色块颜色越接近，说明照片色调一致性越高。
        色块悬停可查看颜色详情。
      </div>
    </div>
  );
};

export default ComparisonPanel;
