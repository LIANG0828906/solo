import { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useStore } from '../store';
import {
  generateBrewStoryUrl,
  generateQRContent,
  formatBrewTime,
} from '../utils/qrGenerator';
import { pourMethodLabels } from '../types';
import type { BrewRecord, CoffeeBean } from '../types';

interface QRCodeDisplayProps {
  recordId: string;
  onClose: () => void;
}

export const QRCodeDisplay = ({ recordId, onClose }: QRCodeDisplayProps) => {
  const { beans, brewRecords } = useStore();
  const [copied, setCopied] = useState(false);

  const record = brewRecords.find((r) => r.id === recordId);
  const bean = beans.find((b) => b.id === record?.beanId);

  const qrContent = useMemo(() => {
    if (!record) return '';
    return generateBrewStoryUrl(recordId);
  }, [record, recordId]);

  const fullData = useMemo(() => {
    if (!record) return '';
    return generateQRContent(record, bean);
  }, [record, bean]);

  const copyToClipboard = async () => {
    const url = generateBrewStoryUrl(recordId);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!record || !bean) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#A1887F' }}>
        未找到该冲煮记录
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 32,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0px 16px 48px rgba(0,0,0,0.24)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              color: '#4E342E',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            冲煮故事二维码
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              color: '#A1887F',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              padding: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E0D5C7',
              marginBottom: 16,
            }}
          >
            <QRCodeCanvas
              value={qrContent}
              size={220}
              level="H"
              includeMargin={false}
              fgColor="#4E342E"
              bgColor="#FFFFFF"
            />
          </div>

          <div
            style={{
              width: '100%',
              padding: 16,
              backgroundColor: '#F5E6CC',
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: 16,
                color: '#4E342E',
                fontWeight: 600,
              }}
            >
              {bean.name}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                fontSize: 12,
                color: '#5D4037',
              }}
            >
              <div>{record.coffeeAmount}g / {record.waterAmount}ml</div>
              <div>{record.waterTemp}°C</div>
              <div>研磨度 {record.grindSize}</div>
              <div>{formatBrewTime(record.brewTime)}</div>
              <div style={{ gridColumn: 'span 2' }}>
                {pourMethodLabels[record.pourMethod]} · ★ {record.rating.overall}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              width: '100%',
            }}
          >
            <button
              onClick={copyToClipboard}
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid #6D4C41',
                backgroundColor: '#6D4C41',
                color: '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4E342E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6D4C41';
              }}
            >
              {copied ? '✓ 已复制链接' : '复制分享链接'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 20px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid #BCAAA4',
                backgroundColor: 'transparent',
                color: '#6D4C41',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F5E6CC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              关闭
            </button>
          </div>

          <p style={{ margin: '12px 0 0 0', fontSize: 11, color: '#A1887F' }}>
            扫描二维码可查看完整冲煮故事和最佳饮用时间
          </p>
        </div>
      </div>
    </div>
  );
};
