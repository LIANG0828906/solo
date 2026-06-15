import React, { useEffect, useState } from 'react';
import { getItemsByUserId, getExchangeRequestsByOwner, updateExchangeRequest } from '../api';
import { useAppContext } from '../App';

interface UserItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  image?: string;
}

interface ExchangeReq {
  id: string;
  item_id: string;
  item_title: string;
  item_status: string;
  requester_nickname: string;
  requester_avatar_color: string;
  message: string;
  status: string;
  created_at: string;
  owner_id: string;
}

const statusLabels: Record<string, { text: string; color: string; bg: string }> = {
  pending: { text: '待处理', color: '#E65100', bg: '#FFF3E0' },
  accepted: { text: '已接受', color: '#2E7D32', bg: '#E8F5E9' },
  rejected: { text: '已拒绝', color: '#757575', bg: '#F5F5F5' },
};

const categoryGradients: Record<string, string> = {
  '书籍': 'linear-gradient(135deg, #F5E6CC, #D4A574)',
  '小家电': 'linear-gradient(135deg, #B3E5FC, #4FC3F7)',
  '手工艺品': 'linear-gradient(135deg, #F8BBD0, #CE93D8)',
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
  return `${days}天前`;
}

export default function Profile({ navigate }: { navigate: (path: string) => void }) {
  const { user, addToast, refreshItems } = useAppContext();
  const [myItems, setMyItems] = useState<UserItem[]>([]);
  const [requests, setRequests] = useState<ExchangeReq[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'requests'>('items');
  const [selectedReq, setSelectedReq] = useState<ExchangeReq | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [closingModal, setClosingModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    getItemsByUserId(user.id).then(setMyItems);
    getExchangeRequestsByOwner(user.id).then(setRequests);
  }, [user]);

  if (!user) {
    navigate('/register');
    return null;
  }

  const openModal = (req: ExchangeReq) => {
    setSelectedReq(req);
    setShowModal(true);
  };

  const closeModal = () => {
    setClosingModal(true);
    setTimeout(() => {
      setShowModal(false);
      setClosingModal(false);
      setSelectedReq(null);
    }, 300);
  };

  const handleAction = async (reqId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateExchangeRequest(reqId, status);
      addToast(status === 'accepted' ? '已接受交换请求' : '已拒绝交换请求');
      refreshItems();
      const updated = await getExchangeRequestsByOwner(user!.id);
      setRequests(updated);
      const items = await getItemsByUserId(user!.id);
      setMyItems(items);
      closeModal();
    } catch (err: any) {
      addToast(err.message || '操作失败');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
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
        background: '#fff',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 4px 24px rgba(139,94,60,0.1)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: user.avatar_color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '32px',
          fontWeight: 'bold',
          flexShrink: 0,
        }}>
          {user.nickname.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#5D4037', fontSize: '22px', marginBottom: '4px' }}>
            {user.nickname}
          </h2>
          <p style={{ fontFamily: 'Georgia, serif', color: '#A0887A', fontSize: '14px' }}>
            咖啡角常客 · 已发布 {myItems.length} 件物品
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('items')}
          style={{
            padding: '10px 24px',
            border: activeTab === 'items' ? '2px solid #D4A574' : '1px solid #E8DDD3',
            borderRadius: '14px',
            background: activeTab === 'items' ? '#FFF8F0' : '#fff',
            color: activeTab === 'items' ? '#8B5E3C' : '#A0887A',
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          我的物品 ({myItems.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '10px 24px',
            border: activeTab === 'requests' ? '2px solid #D4A574' : '1px solid #E8DDD3',
            borderRadius: '14px',
            background: activeTab === 'requests' ? '#FFF8F0' : '#fff',
            color: activeTab === 'requests' ? '#8B5E3C' : '#A0887A',
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          交换请求 ({requests.length})
        </button>
      </div>

      {activeTab === 'items' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {myItems.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/items/${item.id}`)}
              style={{
                background: item.status === 'exchanged' ? '#F0EBE6' : '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(139,94,60,0.08)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: item.status === 'exchanged' ? 0.6 : 1,
                position: 'relative',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(139,94,60,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,94,60,0.08)';
              }}
            >
              {item.status === 'exchanged' && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: '#9E9E9E',
                  color: '#fff',
                  padding: '2px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  zIndex: 2,
                  fontFamily: 'Georgia, serif',
                }}>
                  已交换
                </div>
              )}
              {item.image ? (
                <div style={{ width: '100%', paddingTop: '55%', position: 'relative', overflow: 'hidden' }}>
                  <img src={item.image} alt={item.title} style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }} />
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  paddingTop: '55%',
                  background: categoryGradients[item.category] || categoryGradients['书籍'],
                }} />
              )}
              <div style={{ padding: '12px 14px' }}>
                <h4 style={{
                  fontFamily: 'Georgia, serif',
                  color: item.status === 'exchanged' ? '#9E9E9E' : '#5D4037',
                  fontSize: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </h4>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: '#A0887A' }}>
                  {timeAgo(item.created_at)}
                </span>
              </div>
            </div>
          ))}
          {myItems.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px',
              color: '#A0887A',
              fontFamily: 'Georgia, serif',
            }}>
              还没有发布物品，去发布一个吧！
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div style={{ position: 'relative', paddingLeft: '28px' }}>
          {requests.map((req, idx) => {
            const sl = statusLabels[req.status] || statusLabels.pending;
            return (
              <div key={req.id} style={{ position: 'relative', marginBottom: '0' }}>
                <div style={{
                  position: 'absolute',
                  left: '-28px',
                  top: '20px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: req.status === 'pending' ? '#FF9800'
                    : req.status === 'accepted' ? '#4CAF50'
                    : '#9E9E9E',
                  zIndex: 1,
                }} />
                {idx < requests.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '-23px',
                    top: '32px',
                    width: '2px',
                    height: 'calc(100% - 12px)',
                    background: '#E8DDD3',
                  }} />
                )}
                <div
                  onClick={() => openModal(req)}
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    marginBottom: '12px',
                    boxShadow: '0 2px 8px rgba(139,94,60,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,94,60,0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,94,60,0.08)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: req.requester_avatar_color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}>
                        {req.requester_nickname?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span style={{
                          fontFamily: 'Georgia, serif',
                          color: '#5D4037',
                          fontSize: '14px',
                          fontWeight: 'bold',
                        }}>
                          {req.requester_nickname}
                        </span>
                        <span style={{
                          fontFamily: 'Georgia, serif',
                          color: '#A0887A',
                          fontSize: '13px',
                          marginLeft: '8px',
                        }}>
                          想交换「{req.item_title}」
                        </span>
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontFamily: 'Georgia, serif',
                      color: sl.color,
                      background: sl.bg,
                    }}>
                      {sl.text}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'Georgia, serif',
                    color: '#7A6558',
                    fontSize: '13px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {req.message}
                  </p>
                  <span style={{ fontFamily: 'Georgia, serif', color: '#B8A898', fontSize: '12px' }}>
                    {timeAgo(req.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
          {requests.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#A0887A',
              fontFamily: 'Georgia, serif',
            }}>
              暂无交换请求
            </div>
          )}
        </div>
      )}

      {showModal && selectedReq && (
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
              maxWidth: '460px',
              animation: closingModal ? 'scaleOut 0.3s ease forwards' : 'scaleIn 0.3s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: selectedReq.requester_avatar_color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '22px',
                fontWeight: 'bold',
                flexShrink: 0,
              }}>
                {selectedReq.requester_nickname?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontFamily: 'Georgia, serif', color: '#5D4037', fontSize: '18px' }}>
                  {selectedReq.requester_nickname}
                </h3>
                <p style={{ fontFamily: 'Georgia, serif', color: '#A0887A', fontSize: '13px' }}>
                  请求交换「{selectedReq.item_title}」
                </p>
              </div>
            </div>

            <div style={{
              background: '#FFF8F0',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <p style={{
                fontFamily: 'Georgia, serif',
                color: '#5D4037',
                fontSize: '15px',
                lineHeight: 1.6,
              }}>
                {selectedReq.message}
              </p>
              <span style={{ fontFamily: 'Georgia, serif', color: '#B8A898', fontSize: '12px' }}>
                {timeAgo(selectedReq.created_at)}
              </span>
            </div>

            {selectedReq.status === 'pending' ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => handleAction(selectedReq.id, 'rejected')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#F5F5F5',
                    color: '#757575',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '15px',
                    fontFamily: 'Georgia, serif',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  拒绝
                </button>
                <button
                  onClick={() => handleAction(selectedReq.id, 'accepted')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #D4A574, #8B5E3C)',
                    color: '#FFF8F0',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '15px',
                    fontFamily: 'Georgia, serif',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(139,94,60,0.3)',
                  }}
                >
                  接受交换
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  padding: '6px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'Georgia, serif',
                  color: statusLabels[selectedReq.status]?.color,
                  background: statusLabels[selectedReq.status]?.bg,
                }}>
                  {statusLabels[selectedReq.status]?.text}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
