import React, { useState } from 'react'
import { Modal, Form, Input, Select, InputNumber, Button, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { useDashboardStore } from '@/stores/dashboardStore'
import './TestTool.css'

interface TestToolProps {
  open: boolean
  onClose: () => void
}

const TestTool: React.FC<TestToolProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<'danmaku' | 'gift'>('danmaku')
  const [form] = Form.useForm()
  const gifts = useDashboardStore((state) => state.gifts)
  const sendDanmaku = useDashboardStore((state) => state.sendDanmaku)
  const sendGift = useDashboardStore((state) => state.sendGift)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      if (activeTab === 'danmaku') {
        const result = await sendDanmaku({
          nickname: values.nickname,
          content: values.content,
        })
        if (result) {
          message.success('弹幕发送成功')
          form.setFieldsValue({ content: '' })
        } else {
          message.error('弹幕发送失败')
        }
      } else {
        const result = await sendGift({
          nickname: values.nickname,
          giftId: values.giftId,
          count: values.count || 1,
        })
        if (result) {
          message.success('礼物发送成功')
        } else {
          message.error('礼物发送失败')
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const giftOptions = gifts.map((g) => ({
    label: `${g.name} (${g.price}金币)`,
    value: g.id,
  }))

  return (
    <Modal
      title="模拟测试工具"
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      className="test-tool-modal"
      centered
    >
      <div className="test-tool-tabs">
        <button
          className={`tab-btn ${activeTab === 'danmaku' ? 'active' : ''}`}
          onClick={() => setActiveTab('danmaku')}
        >
          发送弹幕
        </button>
        <button
          className={`tab-btn ${activeTab === 'gift' ? 'active' : ''}`}
          onClick={() => setActiveTab('gift')}
        >
          发送礼物
        </button>
      </div>

      <Form form={form} layout="vertical" className="test-tool-form">
        <Form.Item
          label="昵称"
          name="nickname"
          rules={[{ required: true, message: '请输入昵称' }]}
        >
          <Input placeholder="请输入用户昵称" />
        </Form.Item>

        {activeTab === 'danmaku' && (
          <Form.Item
            label="弹幕内容"
            name="content"
            rules={[{ required: true, message: '请输入弹幕内容' }]}
          >
            <Input.TextArea
              placeholder="请输入弹幕内容"
              rows={4}
              showCount
              maxLength={100}
            />
          </Form.Item>
        )}

        {activeTab === 'gift' && (
          <>
            <Form.Item
              label="选择礼物"
              name="giftId"
              rules={[{ required: true, message: '请选择礼物' }]}
            >
              <Select
                placeholder="请选择礼物"
                options={giftOptions}
              />
            </Form.Item>
            <Form.Item
              label="数量"
              name="count"
              initialValue={1}
              rules={[{ required: true, message: '请输入数量' }]}
            >
              <InputNumber min={1} max={999} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={loading}
            block
          >
            发送
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default TestTool
