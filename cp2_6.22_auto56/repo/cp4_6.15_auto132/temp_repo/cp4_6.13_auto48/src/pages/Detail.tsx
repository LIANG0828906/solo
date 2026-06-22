import React, { useEffect, useState } from 'react';
import { getItemById, createExchangeRequest } from '../api';
import { useAppContext } from '../App';

interface ItemData {
  id: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  status: string;
  created_at: string;
  user_id: string;
  nickname: string;
  avatar_color: string;
}

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
  return `${days}天前`;
}

export default function Detail({ itemId, navigate }: { itemId: string; navigate: (path: string) => void }) {
  const { user, addToast } = useAppContext();
  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [closingModal, setClosingModal] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getItemById(itemId).then(data => {
      setItem(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [itemId]);

  const handleExchange = async () => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (!item) return;
    if (user.id === item.user_id) {
      addToast('不能交换自己的物品');
      return;
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setClosingModal(true);
    setTimeout(() => {
      setShowModal(false);
      setClosingModal(false);
      setMessage('');
    }, 300);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    if (message.length > 100) return;
    setSubmitting(true);
    try {
      await createExchangeRequest({
        item_id: itemId,
        requester_id: user!.id,
        message: message.trim(),
      });
      addToast('交换请求已发送！');
      closeModal();
    } catch (err: any) {
      addToast(err.message || '发送失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: '#A0887A', fontFamily: 'Georgia, serif' }}>
        加载中...
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: '#A0887A', fontFamily: 'Georgia, serif' }}>
        物品不存在
        <br />
        <span style={{ color: '#D4A574', cursor: 'pointer' }} onClick={() => navigate('/')}>
          返回首页
        </span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{
        marginBottom: '20px',
        cursor: 'pointer',
        color: '#D4A574',
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }} onClick={() => navigate('/')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#D4A574">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        返回公告板
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        background: '#fff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(139,94,60,0.1)',
      }}>
        <div style={{
          background: item.image ? 'transparent' : '#F5E6CC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}>
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <svg width="120" height="120" viewBox="0 0 24 24" fill="#D4A574">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          )}
        </div>

        <div style={{ padding: '28px 28px 28px 0' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            marginBottom: '12px',
            background: item.category === '书籍' ? '#F5E6CC'
              : item.category === '小家电' ? '#B3E5FC'
              : '#F8BBD0',
            color: '#5D4037',
          }}>
            {item.category}
          </div>

          {item.status === 'exchanged' && (
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontFamily: 'Georgia, serif',
              marginLeft: '8px',
              background: '#E0E0E0',
              color: '#757575',
            }}>
              已交换
            </div>
          )}

          <h1 style={{
            fontFamily: 'Georgia, serif',
            color: '#5D4037',
            fontSize: '24px',
            marginBottom: '16px',
            lineHeight: 1.4,
          }}>
            {item.title}
          </h1>

          <p style={{
            fontFamily: 'Georgia, serif',
            color: '#7A6558',
            fontSize: '15px',
            lineHeight: 1.7,
            marginBottom: '24px',
          }}>
            {item.description}
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: '#FFF8F0',
            borderRadius: '14px',
            marginBottom: '24px',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: item.avatar_color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '20px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}>
              {item.nickname?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'Georgia, serif', color: '#5D4037', fontWeight: 'bold', fontSize: '15px' }}>
                {item.nickname}
              </div>
              <div style={{ fontFamily: 'Georgia, serif', color: '#A0887A', fontSize: '13px' }}>
                发布于 {timeAgo(item.created_at)}
              </div>
            </div>
          </div>

          {item.status !== 'exchanged' && (
            <button
              onClick={handleExchange}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #D4A574, #8B5E3C)',
                color: '#FFF8F0',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(139,94,60,0.3)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              ☕ 我要交换
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '440px',
              animation: closingModal ? 'scaleOut 0.3s ease forwards' : 'scaleIn 0.3s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{
              fontFamily: 'Georgia, serif',
              color: '#5D4037',
              fontSize: '20px',
              marginBottom: '20px',
            }}>
              交换留言
            </h3>
            <p style={{
              fontFamily: 'Georgia, serif',
              color: '#A0887A',
              fontSize: '13px',
              marginBottom: '12px',
            }}>
              给 {item.nickname} 留下你的交换想法
            </p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 100))}
              placeholder="说说你想怎么交换，或介绍你要交换的物品..."
              maxLength={100}
              style={{
                width: '100%',
                height: '120px',
                padding: '14px',
                border: '1px solid #E8DDD3',
                borderRadius: '14px',
                fontSize: '15px',
                fontFamily: 'Georgia, serif',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#D4A574'}
              onBlur={e => e.currentTarget.style.borderColor = '#E8DDD3'}
            />
            <div style={{
              textAlign: 'right',
              fontSize: '12px',
              color: message.length >= 100 ? '#D32F2F' : '#A0887A',
              fontFamily: 'Georgia, serif',
              marginTop: '4px',
              marginBottom: '20px',
            }}>
              {message.length}/100
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F5E6CC',
                  color: '#8B5E3C',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontFamily: 'Georgia, serif',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !message.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: submitting || !message.trim() ? '#C4B5A4' : 'linear-gradient(135deg, #D4A574, #8B5E3C)',
                  color: '#FFF8F0',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontFamily: 'Georgia, serif',
                  cursor: submitting || !message.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {submitting ? '发送中...' : '发送请求'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
