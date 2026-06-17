import React, { useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, Tabs, ConfigProvider } from 'antd';
import { PlusOutlined, SendOutlined } from '@ant-design/icons';
import { useDashboardStore } from '../stores/dashboardStore';
import './TestTool.css';

const { Option } = Select;

const TestTool: React.FC = () => {
  const testModalVisible = useDashboardStore((state) => state.testModalVisible);
  const setTestModalVisible = useDashboardStore((state) => state.setTestModalVisible);
  const gifts = useDashboardStore((state) => state.gifts);
  const simulateDanmaku = useDashboardStore((state) => state.simulateDanmaku);
  const simulateGift = useDashboardStore((state) => state.simulateGift);

  const [danmakuForm] = Form.useForm();
  const [giftForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSendDanmaku = async (values: any) => {
    setSubmitting(true);
    try {
      await simulateDanmaku(values);
      danmakuForm.resetFields();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendGift = async (values: any) => {
    setSubmitting(true);
    try {
      await simulateGift(values);
      giftForm.resetFields();
    } finally {
      setSubmitting(false);
    }
  };

  const tabItems = [
    {
      key: 'danmaku',
      label: '发送弹幕',
      children: (
        <Form
          form={danmakuForm}
          layout="vertical"
          onFinish={handleSendDanmaku}
          initialValues={{ nickname: '测试用户' }}
        >
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" maxLength={20} />
          </Form.Item>
          <Form.Item
            name="content"
            label="弹幕内容"
            rules={[{ required: true, message: '请输入弹幕内容' }]}
          >
            <Input.TextArea
              placeholder="请输入弹幕内容"
              rows={4}
              maxLength={100}
              showCount
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={submitting}
              block
            >
              发送弹幕
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'gift',
      label: '发送礼物',
      children: (
        <Form
          form={giftForm}
          layout="vertical"
          onFinish={handleSendGift}
          initialValues={{ nickname: '测试用户', count: 1 }}
        >
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" maxLength={20} />
          </Form.Item>
          <Form.Item
            name="giftId"
            label="选择礼物"
            rules={[{ required: true, message: '请选择礼物' }]}
          >
            <Select placeholder="请选择礼物">
              {gifts.map((gift) => (
                <Option key={gift.id} value={gift.id}>
                  <img
                    src={gift.iconUrl}
                    alt={gift.name}
                    style={{ width: 20, height: 20, marginRight: 8, verticalAlign: 'middle' }}
                  />
                  {gift.name} - ¥{gift.price}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="count"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={1} max={999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={submitting}
              block
            >
              发送礼物
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <>
      <button
        className="floating-btn"
        onClick={() => setTestModalVisible(true)}
        aria-label="打开测试工具"
      >
        <PlusOutlined />
      </button>

      <Modal
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={null}
        closable
        closeIcon={<span className="close-icon">✕</span>}
        className="test-modal"
        centered
        styles={{
          mask: { background: 'rgba(0, 0, 0, 0.27)' },
          content: {
            background: '#FFFFFF',
            borderRadius: 16,
            padding: 0,
            maxHeight: '70vh',
            overflow: 'auto',
          },
        }}
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
          <div className="test-modal-header">
            <h3>模拟发送</h3>
            <p>测试弹幕和礼物效果</p>
          </div>
          <Tabs items={tabItems} centered className="test-modal-tabs" />
        </ConfigProvider>
      </Modal>
    </>
  );
};

export default TestTool;
