import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { ConfigProvider, Modal, Form, Input, Select, Button } from 'antd';
import { BookOpen, Plus, Menu, X, BarChart3 } from 'lucide-react';
import BookCard from './components/BookCard';
import BookDetail from './components/BookDetail';
import Statistics from './components/Statistics';
import { useStore } from './store';

const tagOptions = [
  { label: '小说', value: '小说' },
  { label: '历史', value: '历史' },
  { label: '科幻', value: '科幻' },
  { label: '哲学', value: '哲学' },
  { label: '传记', value: '传记' },
  { label: '科普', value: '科普' },
  { label: '文学', value: '文学' },
  { label: '技术', value: '技术' },
];

const App: React.FC = () => {
  const { addBook, loadFromDB } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      await addBook({
        ...values,
        totalPages: Number(values.totalPages) || 0,
        status: values.status || 'want',
        currentPage: 0,
        tags: values.tags || [],
      });
      form.resetFields();
      setModalOpen(false);
    } catch {}
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6a994e',
          borderRadius: 8,
          colorBgContainer: '#fffbf5',
        },
      }}
    >
      <HashRouter>
        <nav
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'rgba(255,248,240,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(106,153,78,0.15)',
            padding: '0 24px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              color: '#3d5a1e',
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            <BookOpen size={26} color="#6a994e" />
            阅读轨迹
          </Link>

          <div
            className="nav-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setModalOpen(true)}
              style={{ borderRadius: 8 }}
            >
              添加图书
            </Button>
            <Link
              to="/statistics"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#6a994e',
                fontWeight: 500,
                textDecoration: 'none',
                fontSize: 15,
              }}
            >
              <BarChart3 size={18} />
              年度统计
            </Link>
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6a994e',
              padding: 4,
            }}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {menuOpen && (
          <div
            className="nav-mobile-menu"
            style={{
              position: 'fixed',
              top: 60,
              left: 0,
              right: 0,
              zIndex: 999,
              background: 'rgba(255,248,240,0.95)',
              backdropFilter: 'blur(12px)',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              borderBottom: '1px solid rgba(106,153,78,0.15)',
            }}
          >
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                setModalOpen(true);
                setMenuOpen(false);
              }}
              block
            >
              添加图书
            </Button>
            <Link
              to="/statistics"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#6a994e',
                fontWeight: 500,
                textDecoration: 'none',
                fontSize: 15,
                padding: '8px 0',
              }}
            >
              <BarChart3 size={18} />
              年度统计
            </Link>
          </div>
        )}

        <div style={{ paddingTop: 76, padding: '76px 24px 24px' }}>
          <Routes>
            <Route path="/" element={<BookList />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </div>

        <Modal
          title="添加图书"
          open={modalOpen}
          onOk={handleAdd}
          onCancel={() => {
            setModalOpen(false);
            form.resetFields();
          }}
          okText="添加"
          cancelText="取消"
          destroyOnClose
        >
          <Form form={form} layout="vertical" initialValues={{ status: 'want' }}>
            <Form.Item
              name="title"
              label="书名"
              rules={[{ required: true, message: '请输入书名' }]}
            >
              <Input placeholder="请输入书名" />
            </Form.Item>
            <Form.Item name="author" label="作者">
              <Input placeholder="请输入作者" />
            </Form.Item>
            <Form.Item name="publisher" label="出版社">
              <Input placeholder="请输入出版社" />
            </Form.Item>
            <Form.Item name="isbn" label="ISBN">
              <Input placeholder="请输入ISBN" />
            </Form.Item>
            <Form.Item name="totalPages" label="总页数">
              <Input type="number" placeholder="请输入总页数" />
            </Form.Item>
            <Form.Item name="tags" label="标签">
              <Select
                mode="multiple"
                options={tagOptions}
                placeholder="选择标签"
              />
            </Form.Item>
            <Form.Item name="coverUrl" label="封面链接">
              <Input placeholder="请输入封面图片链接" />
            </Form.Item>
            <Form.Item name="status" label="阅读状态">
              <Select
                options={[
                  { label: '想读', value: 'want' },
                  { label: '在读', value: 'reading' },
                  { label: '已读', value: 'read' },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>
      </HashRouter>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop {
            display: none !important;
          }
          .nav-hamburger {
            display: block !important;
          }
        }
      `}</style>
    </ConfigProvider>
  );
};

const BookList: React.FC = () => {
  const { books, filterTag, filterStatus, searchQuery, setFilterTag, setFilterStatus, setSearchQuery } = useStore();

  const filtered = books.filter((b) => {
    if (filterTag && !b.tags.includes(filterTag)) return false;
    if (filterStatus && b.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!b.title.toLowerCase().includes(q) && !b.author.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="搜索书名或作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 280 }}
          allowClear
        />
        <Select
          placeholder="标签筛选"
          value={filterTag || undefined}
          onChange={(v) => setFilterTag(v || '')}
          allowClear
          options={tagOptions}
          style={{ minWidth: 120 }}
        />
        <Select
          placeholder="状态筛选"
          value={filterStatus || undefined}
          onChange={(v) => setFilterStatus(v || '')}
          allowClear
          options={[
            { label: '想读', value: 'want' },
            { label: '在读', value: 'reading' },
            { label: '已读', value: 'read' },
          ]}
          style={{ minWidth: 120 }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {filtered.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: 60, fontSize: 16 }}>
          暂无图书，点击"添加图书"开始记录阅读旅程
        </div>
      )}
    </div>
  );
};

export default App;
