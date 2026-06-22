import React, { useState, useMemo, useCallback } from 'react';
import { Button, Form, Input, Modal, message, Select, Tag } from 'antd';
import { PlusOutlined, UserAddOutlined, BookOutlined, BulbOutlined } from '@ant-design/icons';
import { useApp } from '@/context/AppContext';
import ReaderCard from './ReaderCard';
import BorrowRecord from './BorrowRecord';
import { Reader } from '@/types';

const { Option } = Select;

interface ReaderFormData {
  name: string;
  preferredCategories: string[];
  preferredAuthors: string[];
}

interface BorrowFormData {
  bookId: string;
}

const categories = ['文学', '科幻', '历史', '经济', '哲学', '艺术', '科技', '传记', '小说', '教育'];
const authors = ['村上春树', '余华', '刘慈欣', '海明威', '马尔克斯', '王小波', '张爱玲', '鲁迅', '莫言', '陈忠实'];

const ReaderManager: React.FC = () => {
  const { readers, books, addReader, borrowBook, getRecommendations, getStats } = useApp();
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [form] = Form.useForm<ReaderFormData>();
  const [borrowForm] = Form.useForm<BorrowFormData>();

  const stats = getStats();

  const availableBooks = useMemo(() => 
    books.filter(b => b.stock > 0), 
    [books]
  );

  const recommendedBooks = useMemo(() => 
    selectedReader ? getRecommendations(selectedReader.id, 10) : [],
    [selectedReader, getRecommendations]
  );

  const handleReaderClick = useCallback((reader: Reader) => {
    setSelectedReader(reader);
  }, []);

  const handleAddReader = async () => {
    try {
      const values = await form.validateFields();
      addReader(values);
      message.success('读者添加成功');
      setIsAddModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleBorrow = async () => {
    if (!selectedReader) return;
    try {
      const values = await borrowForm.validateFields();
      const success = borrowBook(selectedReader.id, values.bookId);
      if (success) {
        message.success('借阅成功');
        setIsBorrowModalOpen(false);
        borrowForm.resetFields();
      } else {
        message.error('借阅失败，请检查库存');
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleRecommendClick = (bookId: string) => {
    if (!selectedReader) return;
    const success = borrowBook(selectedReader.id, bookId);
    if (success) {
      message.success('借阅成功');
    } else {
      message.error('库存不足');
    }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">读者管理</h1>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-number">{stats.totalReaders}</div>
          <div className="stat-label">注册读者</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.borrowedBooks}</div>
          <div className="stat-label">当前借出</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: stats.overdueBooks > 0 ? '#E74C3C' : '#C49A6C' }}>
            {stats.overdueBooks}
          </div>
          <div className="stat-label">逾期未还</div>
        </div>
        <div className="stat-card">
          <Button 
            type="primary" 
            icon={<UserAddOutlined />}
            onClick={() => setIsAddModalOpen(true)}
            style={{ height: 40, marginTop: 8 }}
          >
            添加读者
          </Button>
        </div>
      </div>

      <div className="borrow-section">
        <div className="reader-list-panel">
          <div className="section-title">
            <BookOutlined style={{ marginRight: 8, color: '#C49A6C' }} />
            读者列表
          </div>
          <div className="reader-grid" style={{ gridTemplateColumns: '1fr' }}>
            {readers.map(reader => (
              <ReaderCard
                key={reader.id}
                reader={reader}
                active={selectedReader?.id === reader.id}
                onClick={handleReaderClick}
              />
            ))}
          </div>
        </div>

        <div>
          {selectedReader ? (
            <>
              <div className="detail-panel" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                      {selectedReader.name}
                    </h2>
                    <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                      共借阅 {selectedReader.borrowCount} 次 · 
                      逾期 {selectedReader.overdueCount} 次
                    </div>
                  </div>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setIsBorrowModalOpen(true)}
                  >
                    借阅图书
                  </Button>
                </div>

                {selectedReader.preferredCategories.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: '#666', marginRight: 8 }}>偏好分类：</span>
                    {selectedReader.preferredCategories.map((cat, idx) => (
                      <Tag key={idx} color="gold">{cat}</Tag>
                    ))}
                  </div>
                )}
                {selectedReader.preferredAuthors.length > 0 && (
                  <div>
                    <span style={{ fontSize: 13, color: '#666', marginRight: 8 }}>偏好作者：</span>
                    {selectedReader.preferredAuthors.map((author, idx) => (
                      <Tag key={idx} color="blue">{author}</Tag>
                    ))}
                  </div>
                )}
              </div>

              {recommendedBooks.length > 0 && (
                <div className="detail-panel" style={{ marginBottom: 24 }}>
                  <div className="section-title">
                    <BulbOutlined style={{ marginRight: 8, color: '#F39C12' }} />
                    为 {selectedReader.name} 推荐
                  </div>
                  <div className="recommend-carousel">
                    {recommendedBooks.map((book) => (
                      <div 
                        key={book.id} 
                        className="recommend-card"
                        onClick={() => handleRecommendClick(book.id)}
                      >
                        <div className="recommend-cover" style={{ background: book.coverColor }}>
                          <div className="recommend-cover-text">
                            {book.title.slice(1, 3)}
                          </div>
                        </div>
                        <div className="recommend-info">
                          <div className="recommend-book-title">{book.title}</div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                            {book.author} · 库存 {book.stock}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 8 }}>
                    点击推荐卡片可直接借阅
                  </div>
                </div>
              )}

              <div className="detail-panel">
                <div className="section-title">借阅记录</div>
                <BorrowRecord readerId={selectedReader.id} />
              </div>
            </>
          ) : (
            <div className="detail-panel">
              <div className="empty-state">
                <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
                <div>请从左侧选择一位读者查看详情</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        title="添加新读者"
        open={isAddModalOpen}
        onOk={handleAddReader}
        onCancel={() => {
          setIsAddModalOpen(false);
          form.resetFields();
        }}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="读者姓名"
            rules={[{ required: true, message: '请输入读者姓名' }]}
          >
            <Input placeholder="请输入读者姓名" />
          </Form.Item>
          <Form.Item
            name="preferredCategories"
            label="偏好分类（可多选）"
          >
            <Select mode="multiple" placeholder="请选择偏好分类" allowClear>
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="preferredAuthors"
            label="偏好作者（可多选）"
          >
            <Select mode="multiple" placeholder="请选择偏好作者" allowClear>
              {authors.map(author => (
                <Option key={author} value={author}>{author}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`为 ${selectedReader?.name} 借阅图书`}
        open={isBorrowModalOpen}
        onOk={handleBorrow}
        onCancel={() => {
          setIsBorrowModalOpen(false);
          borrowForm.resetFields();
        }}
        okText="确认借阅"
        cancelText="取消"
      >
        <Form form={borrowForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="bookId"
            label="选择图书"
            rules={[{ required: true, message: '请选择要借阅的图书' }]}
          >
            <Select placeholder="请选择图书" showSearch optionFilterProp="children">
              {availableBooks.map(book => (
                <Option key={book.id} value={book.id}>
                  {book.title} - {book.author} (库存: {book.stock})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ fontSize: 12, color: '#888', background: '#F5F5F5', padding: 12, borderRadius: 6 }}>
            <div>借阅期：14天</div>
            <div>应还日期：{new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}</div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ReaderManager;
