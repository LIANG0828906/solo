import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, DatePicker, Select, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { useAppStore } from '../store/useAppStore';
import type { Transaction } from '../types';

interface TransactionFormProps {
  editing?: Transaction | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormValues {
  date: Dayjs;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  editing = null,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm<FormValues>();
  const { currentUser, budgets, addTransaction, editTransaction } = useAppStore();
  const [type, setType] = useState<'income' | 'expense'>(editing?.type || 'expense');
  const [amount, setAmount] = useState<number | null>(editing?.amount || null);
  const [category, setCategory] = useState<string>(editing?.category || '');

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        date: dayjs(editing.date),
        type: editing.type,
        category: editing.category,
        amount: editing.amount,
        note: editing.note,
      });
      setType(editing.type);
      setCategory(editing.category);
      setAmount(editing.amount);
    } else {
      form.resetFields();
      form.setFieldsValue({
        date: dayjs(),
        type: 'expense',
      });
      setType('expense');
      setCategory('');
      setAmount(null);
    }
  }, [editing, form]);

  const handleTypeChange = (value: 'income' | 'expense') => {
    setType(value);
    form.setFieldValue('category', undefined);
    setCategory('');
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    const lastNote = localStorage.getItem(`lastNote_${value}`);
    if (lastNote && !form.getFieldValue('note')) {
      form.setFieldValue('note', lastNote);
    }
  };

  const getBudgetImpact = (): { text: string; color: string } => {
    if (type !== 'expense' || !category || !amount) {
      return { text: '', color: '' };
    }
    const budget = budgets.find((b) => b.category === category);
    if (!budget) {
      return { text: '', color: '' };
    }
    const remaining = budget.amount - (budget.used || 0) - amount;
    if (remaining >= 0) {
      return {
        text: `预算剩余 ${remaining.toFixed(2)} 元`,
        color: '#52C41A',
      };
    }
    return {
      text: `超支 ${Math.abs(remaining).toFixed(2)} 元`,
      color: '#F5222D',
    };
  };

  const budgetImpact = getBudgetImpact();

  const onFinish = async (values: FormValues) => {
    if (!currentUser) return;

    const data = {
      userId: currentUser.id,
      date: values.date.format('YYYY-MM-DD'),
      type: values.type,
      category: values.category,
      amount: values.amount,
      note: values.note || '',
    };

    try {
      if (editing) {
        await editTransaction(editing.id, data);
        message.success('交易记录已更新');
      } else {
        await addTransaction(data);
        message.success('交易记录已添加');
        if (values.category && values.note) {
          localStorage.setItem(`lastNote_${values.category}`, values.note);
        }
      }
      onSuccess?.();
    } catch {
      message.error(editing ? '更新失败' : '添加失败');
    }
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="日期"
        name="date"
        rules={[{ required: true, message: '请选择日期' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        label="交易类型"
        name="type"
        rules={[{ required: true, message: '请选择类型' }]}
      >
        <Select
          options={[
            { label: '收入', value: 'income' },
            { label: '支出', value: 'expense' },
          ]}
          onChange={handleTypeChange}
        />
      </Form.Item>

      <Form.Item
        label="类别"
        name="category"
        rules={[{ required: true, message: '请选择类别' }]}
      >
        <Select
          placeholder="请选择类别"
          options={categories.map((c) => ({ label: c, value: c }))}
          onChange={handleCategoryChange}
        />
      </Form.Item>

      <Form.Item
        label="金额"
        name="amount"
        rules={[{ required: true, message: '请输入金额' }]}
      >
        <div className="amount-input-wrapper">
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            step={0.01}
            precision={2}
            placeholder="请输入金额"
            onChange={(v) => setAmount(v as number | null)}
          />
          {budgetImpact.text && (
            <span className="budget-impact" style={{ color: budgetImpact.color }}>
              {budgetImpact.text}
            </span>
          )}
        </div>
      </Form.Item>

      <Form.Item label="备注" name="note">
        <Input.TextArea rows={2} placeholder="请输入备注（可选）" />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        {onCancel && (
          <Button style={{ marginRight: 8 }} onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
          {editing ? '保存修改' : '添加交易'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TransactionForm;
