import React, { useEffect } from 'react';
import { Button, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useDashboardStore } from '../stores/dashboardStore';
import type { Gift } from '../types';

const GiftManagement: React.FC = () => {
  const { gifts, fetchGifts, deleteGift, openSidebar } = useDashboardStore();

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const handleDelete = async (id: string) => {
    try {
      await deleteGift(id);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  return (
    <div style={{ background: '#2D2D44', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ color: '#E0E0E0', margin: 0, fontSize: 18 }}>礼物管理</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openSidebar()}
          style={{ background: '#FF6B00', border: 'none' }}
        >
          添加礼物
        </Button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {gifts.map((gift: Gift) => (
          <div key={gift.id} className="gift-card card-hover">
            <div style={{ padding: 16, textAlign: 'center' }}>
              <img
                src={gift.iconUrl}
                alt={gift.name}
                style={{ width: 48, height: 48, marginBottom: 12 }}
              />
              <div style={{ color: '#212121', fontWeight: 500, fontSize: 14, marginBottom: 8 }}>
                {gift.name}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openSidebar(gift)}
                  style={{
                    background: '#FF6B00',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 6,
                  }}
                />
                <Popconfirm
                  title="确定删除这个礼物吗？"
                  onConfirm={() => handleDelete(gift.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ borderRadius: 6 }}
                  />
                </Popconfirm>
              </div>
            </div>
            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid #E0E0E0',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
              }}
            >
              <span style={{ color: '#FF6B00', fontWeight: 500 }}>{gift.price} 金币</span>
              <span style={{ color: '#757575' }}>销量 {gift.sales}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GiftManagement;
