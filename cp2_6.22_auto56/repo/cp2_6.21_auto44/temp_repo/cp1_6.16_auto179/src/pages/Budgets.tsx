import React, { useState } from 'react';
import {
  Row,
  Col,
  Progress,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
  Card,
} from 'antd';
import {
  CoffeeOutlined,
  CarOutlined,
  ShoppingOutlined,
  SmileOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  ReadOutlined,
  AppstoreOutlined,
  WarningFilled,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import { EXPENSE_CATEGORIES } from '../types';
import type { Budget } from '../types';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  餐饮: <CoffeeOutlined />,
  交通: <CarOutlined />,
  购物: <ShoppingOutlined />,
  娱乐: <SmileOutlined />,
  住房: <HomeOutlined />,
  医疗: <MedicineBoxOutlined />,
  教育: <ReadOutlined />,
  其他: <AppstoreOutlined />,
};

const CATEGORY_COLORS: Record<string, string> = {
  餐饮: '#FA8C16',
  交通: '#1890FF',
  购物: '#EB2F96',
  娱乐: '#722ED1',
  住房: '#13C2C2',
  医疗: '#F5222D',
  教育: '#52C41A',
  其他: '#8C8C8C',
};

const getProgressColor = (percent: number): string => {
  if (percent < 60) return '#52C41A';
  if (percent <= 85) return '#FAAD14';
  return '#F5222D';
};

const Budgets: React.FC = () => {
  const { budgets, currentUser, editBudget, addBudget } = useAppStore();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [form] = Form.useForm();

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    form.setFieldsValue({ amount: budget.amount });
    setEditModalOpen(true);
  };

  const handleAdd = () => {
    setEditingBudget(null);
    form.resetFields();
    setEditModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingBudget) {
        await editBudget(editingBudget.id, { amount: values.amount });
        message.success('预算已更新');
      } else {
        const category = form.getFieldValue('category');
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (currentUser) {
          await addBudget({
            userId: currentUser.id,
            category,
            amount: values.amount,
            month: currentMonth,
          });
          message.success('预算已创建');
        }
      }
      setEditModalOpen(false);
      setEditingBudget(null);
    } catch {
      // validation error
    }
  };

  const existingCategories = budgets.map((b) => b.category);
  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) => !existingCategories.includes(c)
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>月度预算管理</h2>
        {availableCategories.length > 0 && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增预算
          </Button>
        )}
      </div>

      <Row gutter={[16, 16]}>
        {budgets.map((budget) => {
          const used = budget.used || 0;
          const percent = budget.amount > 0 ? Math.min((used / budget.amount) * 100, 100) : 0;
          const isOver = used > budget.amount;
          const color = getProgressColor(percent);

          return (
            <Col xs={24} sm={12} md={8} key={budget.id}>
              <div className="budget-card">
                <div
                  className="category-icon"
                  style={{ background: CATEGORY_COLORS[budget.category] || '#8C8C8C' }}
                >
                  {CATEGORY_ICONS[budget.category] || <AppstoreOutlined />}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{budget.category}</div>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(budget)}
                  >
                    编辑
                  </Button>
                </div>
                <Progress
                  percent={Math.round(percent)}
                  strokeColor={color}
                  showInfo={false}
                  style={{ marginBottom: 8 }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: isOver ? '#F5222D' : 'rgba(0,0,0,0.65)',
                  }}
                >
                  <span>
                    已用 ¥{used.toFixed(2)}
                  </span>
                  <span>
                    预算 ¥{budget.amount.toFixed(2)}
                  </span>
                </div>
                {isOver && (
                  <div className="warning-corner">
                    <WarningFilled className="warning-icon-pulse" />
                  </div>
                )}
              </div>
            </Col>
          );
        })}
      </Row>

      {budgets.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'rgba(0,0,0,0.45)' }}>暂无预算设置，点击右上角新增预算</p>
        </Card>
      )}

      <Modal
        title={editingBudget ? '编辑预算' : '新增预算'}
        open={editModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingBudget(null);
        }}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          {!editingBudget && (
            <Form.Item
              label="类别"
              name="category"
              rules={[{ required: true, message: '请选择类别' }]}
            >
              <select
                className="ant-select"
                style={{
                  width: '100%',
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid #d9d9d9',
                  padding: '0 11px',
                  fontSize: 14,
                }}
                onChange={(e) => form.setFieldValue('category', e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  请选择类别
                </option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Form.Item>
          )}
          {editingBudget && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>类别</div>
              <div style={{ fontSize: 14 }}>{editingBudget.category}</div>
            </div>
          )}
          <Form.Item
            label="预算金额（元）"
            name="amount"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={100} precision={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Budgets;
