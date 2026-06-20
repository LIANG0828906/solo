import React, { useState } from 'react';
import { Button, Drawer, Form, Input, InputNumber, message, ConfigProvider } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useDashboardStore, Gift } from '../stores/dashboardStore';
import { v4 as uuidv4 } from 'uuid';
import './GiftManager.css';

const GiftManager: React.FC = () => {
  const gifts = useDashboardStore((state) => state.gifts);
  const addGift = useDashboardStore((state) => state.addGift);
  const updateGift = useDashboardStore((state) => state.updateGift);
  const deleteGift = useDashboardStore((state) => state.deleteGift);
  const fetchGifts = useDashboardStore((state) => state.fetchGifts);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingGift(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (gift: Gift) => {
    setEditingGift(gift);
    form.setFieldsValue(gift);
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    // 实际项目中应该调用API删除
    deleteGift(id);
    message.success('礼物删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingGift) {
        const updatedGift = { ...editingGift, ...values };
        updateGift(updatedGift);
        message.success('礼物更新成功');
      } else {
        const newGift: Gift = {
          id: uuidv4(),
          ...values,
          sales: 0,
        };
        addGift(newGift);
        message.success('礼物添加成功');
      }
      
      setDrawerVisible(false);
      fetchGifts();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div className="gift-manager">
      <div className="manager-header">
        <h3>礼物管理</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="add-gift-btn"
        >
          添加礼物
        </Button>
      </div>
      
      <div className="gift-cards">
        {gifts.map((gift, index) => (
          <motion.div
            key={gift.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="gift-card"
            whileHover={{ y: -5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)' }}
          >
            <div className="gift-card-img">
              <img src={gift.iconUrl} alt={gift.name} />
            </div>
            <div className="gift-card-name">{gift.name}</div>
            <div className="gift-card-footer">
              <div className="gift-card-price">¥{gift.price}</div>
              <div className="gift-card-sales">销量: {gift.sales}</div>
            </div>
            <div className="gift-card-actions">
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEdit(gift)}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDelete(gift.id)}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <Drawer
        title={editingGift ? '编辑礼物' : '添加礼物'}
        placement="right"
        width={360}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        className="gift-drawer"
        styles={{
          body: { background: '#FAFAFA', padding: 0 },
          header: { background: '#FAFAFA', borderBottom: '1px solid #E0E0E0' },
        }}
        footer={
          <div style={{ textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              {editingGift ? '保存' : '添加'}
            </Button>
          </div>
        }
      >
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#FF6B00',
              colorBgContainer: '#FFFFFF',
              colorText: '#212121',
              colorTextSecondary: '#757575',
              colorBorder: '#E0E0E0',
              borderRadius: 8,
            },
          }}
        >
          <div className="drawer-form">
            <Form
              form={form}
              layout="vertical"
              initialValues={{ sales: 0 }}
            >
              <Form.Item
                name="name"
                label="礼物名称"
                rules={[{ required: true, message: '请输入礼物名称' }]}
              >
                <Input placeholder="请输入礼物名称" maxLength={20} />
              </Form.Item>
              <Form.Item
                name="iconUrl"
                label="动画图标URL"
                rules={[
                  { required: true, message: '请输入图标URL' },
                  { type: 'url', message: '请输入有效的URL' },
                ]}
              >
                <Input placeholder="https://example.com/icon.gif" />
              </Form.Item>
              <Form.Item
                name="price"
                label="价格点数"
                rules={[{ required: true, message: '请输入价格点数' }]}
              >
                <InputNumber min={1} max={99999} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="sales" label="初始销量">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </div>
        </ConfigProvider>
      </Drawer>
    </div>
  );
};

export default GiftManager;
