import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store';
import {
  getClaimsByItemId,
  formatRelativeTime,
} from '../utils/dataManager';
import { RippleButton } from './HomePage';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, loadData, claimItem, completeDonation } = useAppStore();
  const [claims, setClaims] = useState(getClaimsByItemId(id || ''));
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimantName, setClaimantName] = useState('');
  const [claimantContact, setClaimantContact] = useState('');

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (id) {
      setClaims(getClaimsByItemId(id));
    }
  }, [id, items]);

  const item = items.find((i) => i.id === id);

  if (!item) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: '#6B7280', marginBottom: '16px' }}>物品不存在</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  const handleClaimSubmit = () => {
    if (!claimantName.trim() || !claimantContact.trim()) {
      alert('请填写完整的认领信息');
      return;
    }
    if (claimantName.length > 10) {
      alert('昵称不能超过10个字符');
      return;
    }
    claimItem({
      itemId: item.id,
      claimantName: claimantName.trim(),
      claimantContact: claimantContact.trim(),
    });
    setShowClaimModal(false);
    setClaimantName('');
    setClaimantContact('');
    setClaims(getClaimsByItemId(item.id));
  };

  const pendingClaims = claims.filter((c) => c.status === '待确认');

  return (
    <div style={{ padding: '24px 0', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: 'none',
          background: 'none',
          color: '#10B981',
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '16px',
        }}
      >
        ← 返回列表
      </button>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            maxHeight: '400px',
            backgroundColor: '#F3F4F6',
            overflow: 'hidden',
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
                color: '#D1D5DB',
              }}
            >
              📦
            </div>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
              {item.name}
            </h1>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor:
                  item.status === '待认领' ? '#D1FAE5' :
                  item.status === '已认领' ? '#FFEDD5' : '#E5E7EB',
                color:
                  item.status === '待认领' ? '#065F46' :
                  item.status === '已认领' ? '#9A3412' : '#6B7280',
              }}
            >
              {item.status}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#D1FAE5',
                color: '#065F46',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {item.condition}
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#DBEAFE',
                color: '#1E40AF',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              📍 {item.location}
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#F3E8FF',
                color: '#6B21A8',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {item.category}
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
            发布于 {formatRelativeTime(item.createdAt)}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px 0' }}>
              物品描述
            </h3>
            <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {item.description || '暂无描述'}
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px 0' }}>
              联系方式
            </h3>
            <p style={{ fontSize: '14px', color: '#4B5563', margin: 0 }}>
              微信：<span style={{ fontWeight: 600 }}>{item.contactWechat}</span>
            </p>
          </div>

          {pendingClaims.length > 0 && item.status === '已认领' && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 12px 0' }}>
                认领信息
              </h3>
              {pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ fontSize: '14px', color: '#1F2937', marginBottom: '4px' }}>
                    <strong>认领人：</strong>{claim.claimantName}
                  </div>
                  <div style={{ fontSize: '14px', color: '#1F2937', marginBottom: '12px' }}>
                    <strong>联系方式：</strong>{claim.claimantContact}
                  </div>
                  <button
                    onClick={() => completeDonation(item.id)}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    确认捐赠完成
                  </button>
                </div>
              ))}
            </div>
          )}

          {item.status === '待认领' && (
            <RippleButton onClick={() => setShowClaimModal(true)} style={{ padding: '14px 40px', fontSize: '16px' }}>
              认领此物品
            </RippleButton>
          )}
          {item.status === '已完成' && (
            <div style={{ padding: '16px', backgroundColor: '#F3F4F6', borderRadius: '8px', textAlign: 'center', color: '#6B7280' }}>
              此物品已完成捐赠
            </div>
          )}
        </div>
      </div>

      {showClaimModal && (
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
            padding: '16px',
          }}
          onClick={() => setShowClaimModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', margin: '0 0 20px 0' }}>
              认领物品
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                您的昵称（最多10字）
              </label>
              <input
                type="text"
                value={claimantName}
                maxLength={10}
                onChange={(e) => setClaimantName(e.target.value)}
                placeholder="请输入昵称"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                联系方式（微信或手机号，必填）
              </label>
              <input
                type="text"
                value={claimantContact}
                onChange={(e) => setClaimantContact(e.target.value)}
                placeholder="请输入微信或手机号"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowClaimModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <RippleButton onClick={handleClaimSubmit}>
                确认认领
              </RippleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailPage;
