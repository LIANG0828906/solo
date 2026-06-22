import { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Table,
  Modal,
  Popconfirm,
  message,
  Image,
  Tag,
  Space,
  Flex,
  FormInstance
} from 'antd';
import {
  PlusCircleOutlined,
  UploadOutlined,
  UnorderedListOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import { useMarketplaceStore } from '../store/useMarketplaceStore';
import type { Item, ItemCategory, Area } from '../types';

const { TextArea } = Input;

interface ListingFormValues {
  name: string;
  category: ItemCategory;
  description: string;
  price: number;
  images: string[];
}

interface EditFormValues {
  price: number;
  description: string;
}

const categoryOptions: { value: ItemCategory; label: string }[] = [
  { value: '家具', label: '家具' },
  { value: '电器', label: '电器' },
  { value: '书籍', label: '书籍' },
  { value: '服装', label: '服装' },
  { value: '其他', label: '其他' }
];

const areas: Area[] = ['东区', '西区', '南区', '北区'];

const DEFAULT_IMAGE = 'https://picsum.photos/seed/default/120/90';

export default function MyListingsPage() {
  const {
    items,
    currentUser,
    createItem,
    updateItem,
    deleteItem,
    loadItems
  } = useMarketplaceStore();

  const [form] = Form.useForm<ListingFormValues>();
  const [editForm] = Form.useForm<EditFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [deleteShaking, setDeleteShaking] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const myListings = items.filter(i => i.sellerId === currentUser?.id);

  const getRandomArea = (): Area => areas[Math.floor(Math.random() * areas.length)];
  const getRandomDistance = (): number => Math.round((Math.random() * 10 + 0.5) * 10) / 10;

  const handleSubmit = async (values: ListingFormValues) => {
    if (!currentUser) {
      messageApi.error('请先登录');
      return;
    }

    setSubmitting(true);
    try {
      const validImages = (values.images || []).filter(img => img && img.trim());

      await createItem({
        name: values.name.trim(),
        category: values.category,
        description: values.description.trim(),
        price: values.price,
        images: validImages,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerAvatar: currentUser.avatar,
        sellerRegisterDate: currentUser.registerDate,
        distance: getRandomDistance(),
        area: getRandomArea()
      });

      messageApi.success('发布成功！');
      form.resetFields();
    } catch (error) {
      messageApi.error('发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    editForm.setFieldsValue({
      price: item.price,
      description: item.description
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;

    try {
      const values = await editForm.validateFields();
      await updateItem(editingItem.id, {
        price: values.price,
        description: values.description.trim()
      });
      messageApi.success('更新成功！');
      setEditModalVisible(false);
      setEditingItem(null);
    } catch (error) {
      // 校验失败不处理
    }
  };

  const handleDeleteClick = (item: Item) => {
    setDeletingItem(item);
    setDeleteShaking(false);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      const success = await deleteItem(deletingItem.id);
      if (success) {
        messageApi.success('删除成功！');
      } else {
        messageApi.error('删除失败');
      }
    } catch (error) {
      messageApi.error('删除失败，请重试');
    } finally {
      setDeleteModalVisible(false);
      setDeletingItem(null);
    }
  };

  const handleDeleteShake = () => {
    setDeleteShaking(true);
    setTimeout(() => setDeleteShaking(false), 600);
  };

  const columns = [
    {
      title: '缩略图',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      render: (images: string[]) => (
        <Image
          src={images.length > 0 ? images[0] : DEFAULT_IMAGE}
          alt="缩略图"
          width={60}
          height={45}
          style={{ objectFit: 'cover', borderRadius: 6 }}
          preview={false}
        />
      )
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: ItemCategory) => <Tag color="blue">{category}</Tag>
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => (
        <span style={{ color: '#E53935', fontWeight: 600 }}>¥{price}</span>
      )
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: Item) => (
        <Space size={8}>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ padding: 0 }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，确定要删除吗？"
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteClick(record)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: 0 }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {contextHolder}

      <div
        style={{
          background: '#FFFFFF',
          padding: 24,
          borderRadius: 12,
          border: '1px solid #D7CCC8',
          boxShadow: '0 2px 8px rgba(93, 64, 55, 0.08)'
        }}
      >
        <Flex align="center" gap={8} style={{ marginBottom: 24 }}>
          <PlusCircleOutlined style={{ fontSize: 22, color: '#8D6E63' }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#5D4037', margin: 0 }}>
            发布物品
          </h2>
        </Flex>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ images: [''] }}
          className="custom-form"
        >
          <Form.Item
            label="物品名称"
            name="name"
            rules={[
              { required: true, message: '请输入物品名称' },
              { max: 50, message: '最多50个字符' }
            ]}
          >
            <Input placeholder="请输入物品名称" size="large" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            label="物品类别"
            name="category"
            rules={[{ required: true, message: '请选择物品类别' }]}
          >
            <Select
              placeholder="请选择物品类别"
              size="large"
              options={categoryOptions}
            />
          </Form.Item>

          <Form.Item
            label="物品描述"
            name="description"
            rules={[{ max: 500, message: '最多500个字符' }]}
          >
            <TextArea
              placeholder="请输入物品描述..."
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="价格(元)"
            name="price"
            rules={[
              { required: true, message: '请输入价格' },
              {
                type: 'number',
                min: 1,
                message: '价格必须为正整数'
              },
              {
                validator: (_: unknown, value: number) => {
                  if (value && !Number.isInteger(value)) {
                    return Promise.reject('价格必须为正整数');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              min={1}
              step={1}
              size="large"
              style={{ width: '100%' }}
              placeholder="请输入价格"
            />
          </Form.Item>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#5D4037' }}>
              图片URL(最多3张)
            </label>
            <Form.List
              name="images"
              maxCount={3}
              rules={[
                {
                  validator: async (_: unknown, value: string[]) => {
                    if (value) {
                      const validCount = value.filter(img => img && img.trim()).length;
                      if (validCount > 3) {
                        return Promise.reject('最多上传3张图片');
                      }
                    }
                  }
                }
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Flex key={key} align="center" gap={8} style={{ marginBottom: 12 }}>
                      <Form.Item
                        {...restField}
                        name={name}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="请输入图片URL" size="large" />
                      </Form.Item>
                      {fields.length > 0 && (
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ fontSize: 20, color: '#E53935', cursor: 'pointer' }}
                        />
                      )}
                    </Flex>
                  ))}
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      disabled={fields.length >= 3}
                      style={{ width: '100%', height: 40 }}
                    >
                      添加图片
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              icon={<UploadOutlined />}
              loading={submitting}
              block
              style={{
                height: 44,
                fontSize: 15,
                fontWeight: 500,
                background: '#8D6E63',
                borderColor: '#8D6E63',
                borderRadius: 8
              }}
            >
              发布物品
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          padding: 24,
          borderRadius: 12,
          border: '1px solid #D7CCC8',
          boxShadow: '0 2px 8px rgba(93, 64, 55, 0.08)'
        }}
      >
        <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
          <UnorderedListOutlined style={{ fontSize: 22, color: '#8D6E63' }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#5D4037', margin: 0 }}>
            我的发布 ({myListings.length})
          </h2>
        </Flex>

        <Table
          columns={columns}
          dataSource={myListings}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: total => `共 ${total} 条`
          }}
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <div style={{ color: '#8D6E63' }}>暂无发布的物品</div>
              </div>
            )
          }}
        />
      </div>

      <Modal
        open={editModalVisible}
        title={
          <Flex align="center" gap={8}>
            <EditOutlined style={{ color: '#8D6E63' }} />
            <span style={{ fontWeight: 600, color: '#5D4037' }}>编辑物品</span>
          </Flex>
        }
        onCancel={() => {
          setEditModalVisible(false);
          setEditingItem(null);
        }}
        onOk={handleEditSubmit}
        okText="保存"
        cancelText="取消"
        centered
        width={500}
        okButtonProps={{
          style: { background: '#8D6E63', borderColor: '#8D6E63' }
        }}
      >
        {editingItem && (
          <div style={{ marginBottom: 16, padding: 12, background: '#FFF8E7', borderRadius: 8 }}>
            <div style={{ fontWeight: 500, color: '#5D4037' }}>{editingItem.name}</div>
            <div style={{ fontSize: 12, color: '#8D6E63', marginTop: 4 }}>
              类别：{editingItem.category}
            </div>
          </div>
        )}
        <Form form={editForm} layout="vertical" className="custom-form">
          <Form.Item
            label="价格(元)"
            name="price"
            rules={[
              { required: true, message: '请输入价格' },
              { type: 'number', min: 1, message: '价格必须为正整数' },
              {
                validator: (_: unknown, value: number) => {
                  if (value && !Number.isInteger(value)) {
                    return Promise.reject('价格必须为正整数');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              min={1}
              step={1}
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="物品描述"
            name="description"
            rules={[{ max: 500, message: '最多500个字符' }]}
          >
            <TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={deleteModalVisible}
        title={
          <Flex align="center" gap={8}>
            <DeleteOutlined style={{ color: '#E53935' }} />
            <span style={{ fontWeight: 600, color: '#5D4037' }}>确认删除</span>
          </Flex>
        }
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeletingItem(null);
        }}
        onOk={handleDeleteConfirm}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        centered
        width={420}
        className={deleteShaking ? 'modal-shake' : ''}
      >
        {deletingItem && (
          <Flex vertical gap={16}>
            <div
              onClick={handleDeleteShake}
              style={{
                padding: 16,
                background: '#FFF3E0',
                borderRadius: 8,
                border: '1px solid #FFCCBC',
                cursor: 'pointer'
              }}
            >
              <Flex align="center" gap={12}>
                <Image
                  src={deletingItem.images.length > 0 ? deletingItem.images[0] : DEFAULT_IMAGE}
                  width={60}
                  height={45}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                  preview={false}
                />
                <div>
                  <div style={{ fontWeight: 500, color: '#5D4037' }}>{deletingItem.name}</div>
                  <div style={{ fontSize: 13, color: '#E53935', marginTop: 2 }}>
                    ¥{deletingItem.price}
                  </div>
                </div>
              </Flex>
            </div>
            <div style={{ fontSize: 14, color: '#5D4037' }}>
              ⚠️ 删除后将无法恢复，确定要删除此物品吗？
            </div>
            <div style={{ fontSize: 12, color: '#8D6E63' }}>
              点击上方物品可进行抖动确认
            </div>
          </Flex>
        )}
      </Modal>
    </div>
  );
}
