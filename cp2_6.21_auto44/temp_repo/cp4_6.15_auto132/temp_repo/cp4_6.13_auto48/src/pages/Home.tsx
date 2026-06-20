import React, { useEffect, useState, useRef } from 'react';
import { getItems } from '../api';
import { useAppContext } from '../App';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  status: string;
  created_at: string;
  nickname: string;
  avatar_color: string;
}

const categoryGradients: Record<string, string> = {
  '书籍': 'linear-gradient(135deg, #F5E6CC, #D4A574)',
  '小家电': 'linear-gradient(135deg, #B3E5FC, #4FC3F7)',
  '手工艺品': 'linear-gradient(135deg, #F8BBD0, #CE93D8)',
};

const categoryIcons: Record<string, string> = {
  '书籍': 'M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12V2H6zm0 18v-1h10v1H6zm10-2H6V4h10v14z',
  '小家电': 'M7 2v11h3v9l7-12h-4l4-8z',
  '手工艺品': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr + 'Z');
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '60%', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
      {!loaded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#E8DDD3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#C4B5A4">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
    </div>
  );
}

function PlaceholderImage({ category }: { category: string }) {
  return (
    <div style={{
      width: '100%',
      paddingTop: '60%',
      position: 'relative',
      background: '#E8DDD3',
      borderRadius: '12px 12px 0 0',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="#B8A898">
          <path d={categoryIcons[category] || categoryIcons['书籍']} />
        </svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#B8A898">
          <path d="M2 21h18v-2H2v2zM20 8h-1V5H3v3H2c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v3h16v-3h1c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2zm-15 8V9H5v7h-1zm13 0H7V9h11v7z" />
        </svg>
      </div>
    </div>
  );
}

export default function Home({ navigate }: { navigate: (path: string) => void }) {
  const { itemsVersion } = useAppContext();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getItems().then(data => {
      if (!cancelled) {
        setItems(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [itemsVersion]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
      }}>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          color: '#8B5E3C',
          fontSize: '28px',
          marginBottom: '8px',
        }}>
          📋 虚拟公告板
        </h2>
        <p style={{ color: '#A0887A', fontFamily: 'Georgia, serif', fontSize: '14px' }}>
          发现邻里间的闲置好物，用一杯咖啡的时间完成交换
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#A0887A', fontFamily: 'Georgia, serif' }}>
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#A0887A', fontFamily: 'Georgia, serif' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#D4A574" style={{ marginBottom: '16px' }}>
            <path d="M2 21h18v-2H2v2zM20 8h-1V5H3v3H2c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v3h16v-3h1c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2zm-15 8V9H5v7h-1zm13 0H7V9h11v7z" />
          </svg>
          <p>公告板还是空的，快来发布第一个物品吧！</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/items/${item.id}`)}
              style={{
                background: item.status === 'exchanged' ? '#E0D8D0' : '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(139,94,60,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                opacity: item.status === 'exchanged' ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,94,60,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,94,60,0.1)';
              }}
            >
              {item.status === 'exchanged' && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#9E9E9E',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  zIndex: 2,
                  fontFamily: 'Georgia, serif',
                }}>
                  已交换
                </div>
              )}
              {item.image ? (
                <LazyImage src={item.image} alt={item.title} />
              ) : (
                <PlaceholderImage category={item.category} />
              )}
              <div style={{
                padding: '14px 16px',
                background: item.status === 'exchanged'
                  ? 'transparent'
                  : categoryGradients[item.category] || categoryGradients['书籍'],
                transition: 'background 0.3s ease',
              }}>
                <h3 style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '16px',
                  color: item.status === 'exchanged' ? '#9E9E9E' : '#5D4037',
                  marginBottom: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: item.avatar_color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}>
                      {item.nickname?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{
                      fontSize: '13px',
                      color: item.status === 'exchanged' ? '#9E9E9E' : '#8B5E3C',
                      fontFamily: 'Georgia, serif',
                    }}>
                      {item.nickname}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: item.status === 'exchanged' ? '#9E9E9E' : '#A0887A',
                    fontFamily: 'Georgia, serif',
                  }}>
                    {timeAgo(item.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
