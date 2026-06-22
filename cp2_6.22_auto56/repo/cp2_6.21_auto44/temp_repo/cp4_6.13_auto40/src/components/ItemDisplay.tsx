import { useState, useRef, useCallback } from 'react';
import type { AuctionItem } from '../types';

interface ItemDisplayProps {
  item: AuctionItem;
  highestBid: number;
  highestBidder: string;
  status: 'waiting' | 'bidding' | 'ended';
  onUpload: (item: AuctionItem) => void;
  roomId: string;
}

export default function ItemDisplay({ item, highestBid, highestBidder, status }: ItemDisplayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log('Image uploaded:', event.target?.result);
      };
      reader.readAsDataURL(files[0]);
    }
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log('Image uploaded:', event.target?.result);
      };
      reader.readAsDataURL(files[0]);
    }
  }, []);

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <h3
        className="gold-text"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        🖼️ 拍品展示
      </h3>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '60%',
          borderRadius: '12px',
          overflow: 'hidden',
          border: `2px dashed ${isDragging ? 'var(--color-gold)' : 'var(--color-border-gold)'}`,
          background: isDragging
            ? 'rgba(212, 175, 55, 0.1)'
            : 'rgba(26, 10, 10, 0.6)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '16px',
        }}
      >
        {imageLoaded && (
          <img
            src={item.imageUrl}
            alt={item.name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
          />
        )}

        {isDragging && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(74, 14, 14, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div className="gold-text" style={{ fontSize: '18px', fontFamily: 'var(--font-display)' }}>
              📤 松开上传图片
            </div>
          </div>
        )}

        {status === 'ended' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(26, 10, 10, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}
          >
            <div
              className="gold-text"
              style={{
                fontSize: '32px',
                fontFamily: 'var(--font-display)',
                fontWeight: 'bold',
                transform: 'rotate(-15deg)',
                border: '4px solid var(--color-gold)',
                padding: '12px 32px',
                borderRadius: '8px',
              }}
            >
              已成交
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              color: 'var(--color-text-primary)',
              marginBottom: '8px',
            }}
          >
            {item.name}
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            起拍价: <span className="gold-text">¥{item.startPrice.toLocaleString()}</span>
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
            当前出价
          </div>
          <div
            className="gold-text"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            ¥{highestBid.toLocaleString()}
          </div>
          {highestBidder && (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '4px' }}>
              领先: {highestBidder}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: 'rgba(212, 175, 55, 0.1)',
          borderRadius: '6px',
          border: '1px solid var(--color-border-gold)',
        }}
      >
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', textAlign: 'center' }}>
          💡 拖拽图片到上方区域可上传新拍品
        </p>
      </div>
    </div>
  );
}
