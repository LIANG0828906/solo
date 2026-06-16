import React, { useMemo, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Select,
  Drawer,
  Modal,
  Popconfirm,
  message,
  Row,
  Col,
} from 'antd';
import type { TableProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import TransactionForm from '../components/TransactionForm';
import { useAppStore } from '../store/useAppStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import type { Transaction } from '../types';

const { RangePicker } = DatePicker;

const Transactions: React.FC = () => {
  const { transactions, removeTransaction } = useAppStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      list = list.filter((t) => {
        const d = dayjs(t.date);
        return d.isAfter(start) && d.isBefore(end);
      });
    }
    if (typeFilter !== 'all') {
      list = list.filter((t) => t.type === typeFilter);
    }
    if (categoryFilter !== 'all') {
      list = list.filter((t) => t.category === categoryFilter);
    }
    return list.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  }, [transactions, dateRange, typeFilter, categoryFilter]);

  const handleDelete = async (id: string) => {
    try {
      await removeTransaction(id);
      message.success('已删除');
    } catch {
      message.error('删除失败');
    }
  };

  const handleEdit = (record: Transaction) => {
    setEditing(record);
    if (window.innerWidth < 480) {
      setDrawerOpen(true);
    } else {
      setModalOpen(true);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    if (window.innerWidth < 480) {
      setDrawerOpen(true);
    } else {
      setModalOpen(true);
    }
  };

  const handleSuccess = () => {
    setDrawerOpen(false);
    setModalOpen(false);
    setEditing(null);
  };

  const handleCancel = () => {
    setDrawerOpen(false);
    setModalOpen(false);
    setEditing(null);
  };

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const columns: TableProps<Transaction>['columns'] = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (v) => dayjs(v).format('YYYY-MM-DD'),
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (v) =>
        v === 'income' ? (
          <Tag color="green">收入</Tag>
        ) : (
          <Tag color="red">支出</Tag>
        ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a, b) => a.amount - b.amount,
      render: (v, record) => (
        <span style={{ color: record.type === 'income' ? '#52C41A' : '#F5222D', fontWeight: 500 }}>
          {record.type === 'income' ? '+' : '-'}
          {v.toFixed(2)}
        </span>
      ),
      width: 120,
      align: 'right',
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const formTitle = editing ? '编辑交易' : '添加交易';

  return (
    <div>
      <Card
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8, marginBottom: 16 }}
        bodyStyle={{ padding: 16 }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(v) => setDateRange(v as [Dayjs, Dayjs] | null)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { label: '全部类型', value: 'all' },
                { label: '收入', value: 'income' },
                { label: '支出', value: 'expense' },
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              showSearch
              options={[
                { label: '全部类别', value: 'all' },
                ...allCategories.map((c) => ({ label: c, value: c })),
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={10} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加交易
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }} bodyStyle={{ padding: 0 }}>
        <Table<Transaction>
          columns={columns}
          dataSource={filteredTransactions}
          rowKey="id"
          scroll={{ x: 700 }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowClassName={() => 'transaction-row'}
        />
      </Card>

      <Modal
        title={formTitle}
        open={modalOpen}
        onCancel={handleCancel}
        footer={null}
        width={480}
        destroyOnClose
      >
        <TransactionForm editing={editing} onSuccess={handleSuccess} onCancel={handleCancel} />
      </Modal>

      <Drawer
        title={formTitle}
        open={drawerOpen}
        onClose={handleCancel}
        width="100%"
        placement="bottom"
        height="85%"
        destroyOnClose
      >
        <TransactionForm editing={editing} onSuccess={handleSuccess} onCancel={handleCancel} />
      </Drawer>
    </div>
  );
};

export default Transactions;
