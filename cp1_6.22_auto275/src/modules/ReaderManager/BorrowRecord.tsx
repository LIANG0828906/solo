import React, { useMemo } from 'react';
import { Table, Button } from 'antd';
import { useApp } from '@/context/AppContext';
import { BorrowRecord as BorrowRecordType } from '@/types';

interface BorrowRecordProps {
  readerId: string;
}

const BorrowRecord: React.FC<BorrowRecordProps> = ({ readerId }) => {
  const { borrowRecords, books, returnBook } = useApp();

  const readerRecords = useMemo(() => {
    return borrowRecords
      .filter(r => r.readerId === readerId)
      .sort((a, b) => b.borrowDate.getTime() - a.borrowDate.getTime());
  }, [borrowRecords, readerId]);

  const getBookTitle = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.title : '未知图书';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN');
  };

  const getOverdueDays = (record: BorrowRecordType) => {
    if (record.returnDate) return 0;
    const now = new Date();
    const due = new Date(record.dueDate);
    if (now <= due) return 0;
    return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  };

  const columns = [
    {
      title: '图书名称',
      dataIndex: 'bookId',
      key: 'bookId',
      render: (bookId: string) => (
        <span style={{ fontWeight: 500 }}>{getBookTitle(bookId)}</span>
      ),
    },
    {
      title: '借阅日期',
      dataIndex: 'borrowDate',
      key: 'borrowDate',
      render: (date: Date) => formatDate(date),
      width: 120,
    },
    {
      title: '应还日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: Date, record: BorrowRecordType) => (
        <span style={{ 
          color: !record.returnDate && new Date() > new Date(date) ? '#E74C3C' : 'inherit' 
        }}>
          {formatDate(date)}
        </span>
      ),
      width: 120,
    },
    {
      title: '归还日期',
      dataIndex: 'returnDate',
      key: 'returnDate',
      render: (date?: Date) => date ? formatDate(date) : '-',
      width: 120,
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, record: BorrowRecordType) => {
        if (record.returnDate) {
          return <span className="normal-badge">已归还</span>;
        }
        const overdueDays = getOverdueDays(record);
        if (overdueDays > 0) {
          return <span className="overdue-badge">逾期 {overdueDays} 天</span>;
        }
        return <span className="normal-badge">借阅中</span>;
      },
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: BorrowRecordType) => {
        if (!record.returnDate) {
          return (
            <Button 
              type="primary" 
              size="small"
              onClick={() => returnBook(record.id)}
            >
              归还
            </Button>
          );
        }
        return null;
      },
      width: 80,
    },
  ];

  if (readerRecords.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
        <div>暂无借阅记录</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <Table 
        dataSource={readerRecords}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 6 }}
        size="middle"
      />
    </div>
  );
};

export default BorrowRecord;
