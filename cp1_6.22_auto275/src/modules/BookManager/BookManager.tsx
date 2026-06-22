import React, { useState, useMemo, useCallback } from 'react';
import { Input, Button, Form, Modal, message, Select } from 'antd';
import { PlusOutlined, SearchOutlined, FireOutlined, BulbOutlined } from '@ant-design/icons';
import { useApp } from '@/context/AppContext';
import BookCard from './BookCard';
import { Book } from '@/types';

const { Option } = Select;

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  category: string;
  stock: number;
}

const categories = ['文学', '科幻', '历史', '经济', '哲学', '艺术', '科技', '传记', '小说', '教育'];

const BookManager: React.FC = () => {
  const { books, addBook, searchBooks, getHotBooks, readers, getRecommendations, borrowBook } = useApp();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [form] = Form.useForm<BookFormData>();

  const searchResults = useMemo(() => {
    const startTime = performance.now();
    const results = searchKeyword ? searchBooks(searchKeyword) : books.slice(0, 48);
    const endTime = performance.now();
    console.log(`搜索耗时: ${(endTime - startTime).toFixed(2)}ms`);
    return results;
  }, [searchKeyword, books, searchBooks]);

  const hotBooks = useMemo(() => getHotBooks(10), [getHotBooks]);
  const defaultReader = readers[0];
  const recommendedBooks = useMemo(() => 
    defaultReader ? getRecommendations(defaultReader.id, 10) : [], 
    [defaultReader, getRecommendations]
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  }, []);

  const handleAddBook = async () => {
    try {
      const values = await form.validateFields();
      addBook(values);
      message.success('图书添加成功');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleBookClick = useCallback((book: Book) => {
    setSelectedBook(book);
  }, []);

  const handleBorrow = () => {
    if (!selectedBook || !defaultReader) return;
    const success = borrowBook(defaultReader.id, selectedBook.id);
    if (success) {
      message.success(`成功借阅: ${selectedBook.title}`);
    } else {
      message.error('库存不足，无法借阅');
    }
    setSelectedBook(null);
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">图书管理</h1>

      <div className="search-bar">
        <Input
          size="large"
          placeholder="搜索书名、作者或分类..."
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={handleSearch}
          style={{ maxWidth: 400 }}
          allowClear
        />
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          添加图书
        </Button>
        {searchKeyword && (
          <span style={{ color: '#888', fontSize: 13 }}>
            找到 {searchResults.length} 条结果
          </span>
        )}
      </div>

      {!searchKeyword && (
        <>
          <div className="recommend-section">
            <div className="recommend-title">
              <FireOutlined style={{ color: '#E67E22' }} />
              热门推荐
            </div>
            <div className="recommend-carousel">
              {hotBooks.map((book) => (
                <div 
                  key={book.id} 
                  className="recommend-card"
                  onClick={() => handleBookClick(book)}
                >
                  <div className="recommend-cover" style={{ background: book.coverColor }}>
                    <div className="recommend-cover-text">
                      {book.title.slice(1, 3)}
                    </div>
                  </div>
                  <div className="recommend-info">
                    <div className="recommend-book-title">{book.title}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                      {book.author}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {defaultReader && (
            <div className="recommend-section">
              <div className="recommend-title">
                <BulbOutlined style={{ color: '#F39C12' }} />
                为读者 {defaultReader.name} 推荐
              </div>
              <div className="recommend-carousel">
                {recommendedBooks.map((book) => (
                  <div 
                    key={book.id} 
                    className="recommend-card"
                    onClick={() => handleBookClick(book)}
                  >
                    <div className="recommend-cover" style={{ background: book.coverColor }}>
                      <div className="recommend-cover-text">
                        {book.title.slice(1, 3)}
                      </div>
                    </div>
                    <div className="recommend-info">
                      <div className="recommend-book-title">{book.title}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                        {book.author} · {book.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="section-title" style={{ marginTop: 32 }}>
        {searchKeyword ? '搜索结果' : '全部图书'}
      </div>
      
      <div className="book-grid">
        {searchResults.map((book) => (
          <BookCard key={book.id} book={book} onClick={handleBookClick} />
        ))}
      </div>

      {searchResults.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <div>没有找到相关图书</div>
        </div>
      )}

      <Modal
        title="添加新图书"
        open={isModalOpen}
        onOk={handleAddBook}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="书名"
            rules={[{ required: true, message: '请输入书名' }]}
          >
            <Input placeholder="请输入书名" />
          </Form.Item>
          <Form.Item
            name="author"
            label="作者"
            rules={[{ required: true, message: '请输入作者' }]}
          >
            <Input placeholder="请输入作者" />
          </Form.Item>
          <Form.Item
            name="isbn"
            label="ISBN"
            rules={[{ required: true, message: '请输入ISBN' }]}
          >
            <Input placeholder="请输入ISBN" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="stock"
            label="库存数量"
            rules={[{ required: true, message: '请输入库存数量' }]}
          >
            <Input type="number" min="1" placeholder="请输入库存数量" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="图书详情"
        open={!!selectedBook}
        onCancel={() => setSelectedBook(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedBook(null)}>
            关闭
          </Button>,
          <Button 
            key="borrow" 
            type="primary" 
            onClick={handleBorrow}
            disabled={!selectedBook || selectedBook.stock <= 0}
          >
            借阅此书
          </Button>,
        ]}
        width={500}
      >
        {selectedBook && (
          <div style={{ display: 'flex', gap: 20 }}>
            <div 
              style={{ 
                width: 120, 
                height: 160, 
                background: selectedBook.coverColor, 
                borderRadius: 8,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {selectedBook.title.slice(1, 3)}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 18, marginBottom: 8 }}>{selectedBook.title}</h3>
              <p style={{ color: '#666', marginBottom: 12 }}>作者：{selectedBook.author}</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="book-category">{selectedBook.category}</span>
                <span style={{ fontSize: 12, color: '#999' }}>ISBN: {selectedBook.isbn}</span>
              </div>
              <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8 }}>
                <div>库存数量：<strong>{selectedBook.stock}</strong> 本</div>
                <div>累计借阅：<strong>{selectedBook.borrowCount}</strong> 次</div>
                <div>热门程度：{'⭐'.repeat(selectedBook.hotLevel)}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookManager;
