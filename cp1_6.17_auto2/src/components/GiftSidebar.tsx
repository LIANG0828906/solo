import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, InputNumber, Button, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useDashboardStore } from '../stores/dashboardStore';
import type { Gift } from '../types';

const GiftSidebar: React.FC = () => {
  const { sidebarVisible, editingGift, closeSidebar, addGift, updateGift } = useDashboardStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sidebarVisible && editingGift) {
      form.setFieldsValue(editingGift);
    } else if (sidebarVisible) {
      form.resetFields();
    }
  }, [sidebarVisible, editingGift, form]);

  const handleSubmit = async (values: Omit<Gift, 'id' | 'sales'>) => {
    setLoading(true);
    try {
      if (editingGift) {
        await updateGift(editingGift.id, values);
        message.success('礼物更新成功');
      } else {
        await addGift(values);
        message.success('礼物添加成功');
      }
      closeSidebar();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#E0E0E0', fontSize: 18, fontWeight: 600 }}>
            {editingGift ? '编辑礼物' : '添加礼物'}
          </span>
          <Button
            type="text"
            icon={<CloseOutlined style={{ color: '#999' }} />}
            onClick={closeSidebar}
          />
        </div>
      }
      placement="right"
      open={sidebarVisible}
      onClose={closeSidebar}
      width={360}
      styles={{
        body: {
          background: '#FAFAFA',
          padding: 24,
        },
        header: {
          background: '#FAFAFA',
          borderBottom: '1px solid #E0E0E0',
          padding: '16px 24px',
        },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ price: 10 }}
        style={{ gap: 16 }}
      >
        <Form.Item
          name="name"
          label={<span style={{ color: '#212121', fontWeight: 500 }}>礼物名称</span>}
          rules={[{ required: true, message: '请输入礼物名称' }]}
          style={{ marginBottom: 16 }}
        >
          <Input
            placeholder="请输入礼物名称"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: 8,
              color: '#212121',
            }}
          />
        </Form.Item>

        <Form.Item
          name="iconUrl"
          label={<span style={{ color: '#212121', fontWeight: 500 }}>动画图标URL</span>}
          rules={[{ required: true, message: '请输入图标URL' }]}
          style={{ marginBottom: 16 }}
        >
          <Input
            placeholder="https://example.com/icon.svg"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: 8,
              color: '#212121',
            }}
          />
        </Form.Item>

        <Form.Item
          name="price"
          label={<span style={{ color: '#212121', fontWeight: 500 }}>价格点数</span>}
          rules={[{ required: true, message: '请输入价格' }]}
          style={{ marginBottom: 16 }}
        >
          <InputNumber
            min={1}
            placeholder="请输入价格"
            style={{
              width: '100%',
              background: '#FFFFFF',
              borderRadius: 8,
            }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              height: 44,
              background: '#FF6B00',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 500,
              border: 'none',
            }}
          >
            {editingGift ? '保存修改' : '添加礼物'}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default GiftSidebar;
