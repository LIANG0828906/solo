import React, { useEffect, useState } from 'react'
import { Button, Drawer, Form, Input, InputNumber, message, Popconfirm } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GiftOutlined,
} from '@ant-design/icons'
import { useDashboardStore, type Gift } from '@/stores/dashboardStore'
import './GiftManager.css'

interface GiftCardProps {
  gift: Gift
  onEdit: (gift: Gift) => void
  onDelete: (id: string) => void
}

const GiftCard: React.FC<GiftCardProps> = ({ gift, onEdit, onDelete }) => {
  return (
    <div className="gift-card">
      <div className="gift-card-header">
        <img
          src={gift.iconUrl}
          alt={gift.name}
          className="gift-card-icon"
        />
      </div>
      <div className="gift-card-body">
        <div className="gift-card-name">{gift.name}</div>
      </div>
      <div className="gift-card-footer">
        <div className="gift-card-price">
          <span className="price-value">{gift.price}</span>
          <span className="price-unit">金币</span>
        </div>
        <div className="gift-card-sales">销量: {gift.sales}</div>
      </div>
      <div className="gift-card-actions">
        <Button
          type="text"
          icon={<EditOutlined />}
          size="small"
          onClick={() => onEdit(gift)}
        />
        <Popconfirm
          title="确定删除这个礼物吗？"
          onConfirm={(e) => {
            e?.stopPropagation()
            onDelete(gift.id)
          }}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      </div>
    </div>
  )
}

const GiftManager: React.FC = () => {
  const gifts = useDashboardStore((state) => state.gifts)
  const fetchGifts = useDashboardStore((state) => state.fetchGifts)
  const addGift = useDashboardStore((state) => state.addGift)
  const updateGift = useDashboardStore((state) => state.updateGift)
  const deleteGift = useDashboardStore((state) => state.deleteGift)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchGifts()
  }, [fetchGifts])

  const handleAdd = () => {
    setEditingGift(null)
    form.resetFields()
    setDrawerOpen(true)
  }

  const handleEdit = (gift: Gift) => {
    setEditingGift(gift)
    form.setFieldsValue({
      name: gift.name,
      iconUrl: gift.iconUrl,
      price: gift.price,
    })
    setDrawerOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteGift(id)
    message.success('删除成功')
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      if (editingGift) {
        await updateGift(editingGift.id, values)
        message.success('更新成功')
      } else {
        await addGift(values)
        message.success('添加成功')
      }

      setDrawerOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gift-manager">
      <div className="gift-manager-header">
        <h3 className="gift-manager-title">
          <GiftOutlined className="title-icon" />
          礼物管理
        </h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="add-gift-btn"
        >
          添加礼物
        </Button>
      </div>
      <div className="gift-grid custom-scrollbar">
        {gifts.map((gift) => (
          <GiftCard
            key={gift.id}
            gift={gift}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        {gifts.length === 0 && (
          <div className="gift-empty">
            暂无礼物，点击上方按钮添加
          </div>
        )}
      </div>

      <Drawer
        title={editingGift ? '编辑礼物' : '添加礼物'}
        placement="right"
        width={360}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className="gift-drawer"
      >
        <Form form={form} layout="vertical" className="gift-form">
          <Form.Item
            label="礼物名称"
            name="name"
            rules={[{ required: true, message: '请输入礼物名称' }]}
          >
            <Input placeholder="请输入礼物名称" />
          </Form.Item>

          <Form.Item
            label="礼物图标URL"
            name="iconUrl"
            rules={[{ required: true, message: '请输入图标URL' }]}
          >
            <Input placeholder="请输入图标图片URL" />
          </Form.Item>

          <Form.Item
            label="价格（金币）"
            name="price"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber
              min={1}
              max={99999}
              style={{ width: '100%' }}
              placeholder="请输入价格"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              block
              className="submit-btn"
            >
              {editingGift ? '保存修改' : '添加礼物'}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default GiftManager
