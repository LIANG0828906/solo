import React, { useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, Tabs, message } from 'antd';
import { SendOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { useDashboardStore } from '../stores/dashboardStore';
import type { Gift } from '../types';

const TestTool: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'danmaku' | 'gift'>('danmaku');
  const [danmakuForm] = Form.useForm();
  const [giftForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const {
    gifts,
    sendDanmaku,
    sendGift,
    addDanmakuOptimistic,
    addGiftRecordOptimistic,
    fetchRanking,
    fetchGifts,
  } = useDashboardStore();

  const handleSendDanmaku = async (values: { nickname: string; content: string }) => {
    const startTime = performance.now();
    setLoading(true);

    const optimisticDanmaku = {
      id: uuidv4(),
      nickname: values.nickname,
      content: values.content,
      timestamp: Date.now(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.nickname}`,
    };
    addDanmakuOptimistic(optimisticDanmaku);

    const responseTime = performance.now() - startTime;
    console.log(`弹幕渲染响应时间: ${responseTime.toFixed(2)}ms`);

    try {
      await sendDanmaku(values);
      message.success('弹幕发送成功');
      danmakuForm.resetFields();
    } catch (error) {
      message.error('弹幕发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendGift = async (values: { nickname: string; giftId: string; quantity: number }) => {
    const startTime = performance.now();
    setLoading(true);

    const gift = gifts.find((g: Gift) => g.id === values.giftId);
    if (gift) {
      const optimisticRecord = {
        id: uuidv4(),
        nickname: values.nickname,
        giftId: gift.id,
        giftName: gift.name,
        giftIcon: gift.iconUrl,
        quantity: values.quantity,
        timestamp: Date.now(),
      };
      addGiftRecordOptimistic(optimisticRecord);

      const responseTime = performance.now() - startTime;
      console.log(`礼物动画响应时间: ${responseTime.toFixed(2)}ms`);
    }

    try {
      await sendGift(values);
      message.success('礼物发送成功');
      giftForm.resetFields(['giftId', 'quantity']);
      fetchRanking();
      fetchGifts();
    } catch (error) {
      message.error('礼物发送失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    { key: 'danmaku', label: '发送弹幕' },
    { key: 'gift', label: '发送礼物' },
  ];

  return (
    <>
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<PlusOutlined style={{ fontSize: 24 }} />}
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 60,
          height: 60,
          background: '#FF6B00',
          border: 'none',
          boxShadow: '0 4px 12px rgba(255, 107, 0, 0.4)',
          zIndex: 1000,
        }}
        className="card-hover"
      />

      <Modal
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        closable={false}
        styles={{
          mask: {
            background: '#00000044',
          },
          content: {
            background: '#FFFFFF',
            borderRadius: 16,
            padding: 0,
            maxWidth: 500,
            width: '90%',
          },
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid #E0E0E0',
          }}
        >
          <h3 style={{ margin: 0, color: '#212121', fontSize: 18, fontWeight: 600 }}>模拟发送</h3>
          <Button
            type="text"
            icon={<CloseOutlined style={{ color: '#999', fontSize: 18 }} />}
            onClick={() => setVisible(false)}
            style={{ width: 32, height: 32 }}
          />
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'danmaku' | 'gift')}
          items={tabItems}
          style={{ padding: '0 24px' }}
        />

        <div style={{ padding: '0 24px 24px' }}>
          {activeTab === 'danmaku' && (
            <Form
              form={danmakuForm}
              layout="vertical"
              onFinish={handleSendDanmaku}
              initialValues={{ nickname: '测试用户' }}
            >
              <Form.Item
                name="nickname"
                label={<span style={{ color: '#212121', fontWeight: 500 }}>昵称</span>}
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input
                  placeholder="请输入昵称"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
              <Form.Item
                name="content"
                label={<span style={{ color: '#212121', fontWeight: 500 }}>弹幕内容</span>}
                rules={[{ required: true, message: '请输入弹幕内容' }]}
              >
                <Input.TextArea
                  placeholder="请输入弹幕内容"
                  rows={3}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  icon={<SendOutlined />}
                  style={{
                    height: 44,
                    background: '#FF6B00',
                    borderRadius: 8,
                    fontSize: 16,
                    border: 'none',
                  }}
                >
                  发送弹幕
                </Button>
              </Form.Item>
            </Form>
          )}

          {activeTab === 'gift' && (
            <Form
              form={giftForm}
              layout="vertical"
              onFinish={handleSendGift}
              initialValues={{ nickname: '测试用户', quantity: 1 }}
            >
              <Form.Item
                name="nickname"
                label={<span style={{ color: '#212121', fontWeight: 500 }}>昵称</span>}
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input
                  placeholder="请输入昵称"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
              <Form.Item
                name="giftId"
                label={<span style={{ color: '#212121', fontWeight: 500 }}>选择礼物</span>}
                rules={[{ required: true, message: '请选择礼物' }]}
              >
                <Select
                  placeholder="请选择礼物"
                  style={{ borderRadius: 8 }}
                  options={gifts.map((g: Gift) => ({
                    label: `${g.name} (${g.price}金币)`,
                    value: g.id,
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="quantity"
                label={<span style={{ color: '#212121', fontWeight: 500 }}>数量</span>}
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber
                  min={1}
                  max={99}
                  placeholder="请输入数量"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  icon={<SendOutlined />}
                  style={{
                    height: 44,
                    background: '#FF6B00',
                    borderRadius: 8,
                    fontSize: 16,
                    border: 'none',
                  }}
                >
                  发送礼物
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>
      </Modal>
    </>
  );
};

export default TestTool;
