import React, { useState, useEffect } from 'react';
import type { Book, Category } from '../types';
import { CATEGORIES } from '../types';

interface BookFormProps {
  book: Book | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function BookForm({ book, onSubmit, onCancel }: BookFormProps) {
  const [form, setForm] = useState<{
    title: string;
    author: string;
    category: Category;
    publishYear: number | '';
    publisher: string;
    isbn: string;
    condition: number;
    conditionDesc: string;
    price: number | '';
    stock: number | '';
  }>({
    title: '',
    author: '',
    category: '文学',
    publishYear: '',
    publisher: '',
    isbn: '',
    condition: 4,
    conditionDesc: '',
    price: '',
    stock: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (book) {
      setForm({
        title: book.title,
        author: book.author,
        category: book.category,
        publishYear: book.publishYear,
        publisher: book.publisher,
        isbn: book.isbn,
        condition: book.condition,
        conditionDesc: book.conditionDesc,
        price: book.price,
        stock: book.stock,
      });
    } else {
      setForm({
        title: '',
        author: '',
        category: '文学',
        publishYear: '',
        publisher: '',
        isbn: '',
        condition: 4,
        conditionDesc: '',
        price: '',
        stock: '',
      });
    }
    setErrors({});
  }, [book]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof typeof form, string>> = {};
    if (!form.title.trim()) newErrors.title = '书名不能为空';
    if (!form.author.trim()) newErrors.author = '作者不能为空';
    if (form.price === '' || Number(form.price) <= 0) newErrors.price = '价格必须为正数';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: keyof typeof form) => {
    const newErrors: Partial<Record<keyof typeof form, string>> = { ...errors };
    if (field === 'title' && !form.title.trim()) newErrors.title = '书名不能为空';
    else if (field === 'author' && !form.author.trim()) newErrors.author = '作者不能为空';
    else if (field === 'price' && (form.price === '' || Number(form.price) <= 0)) newErrors.price = '价格必须为正数';
    else delete newErrors[field];
    setErrors(newErrors);
  };

  const handleChange = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body = {
        ...form,
        publishYear: Number(form.publishYear),
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (book) {
        await fetch(`/api/books/${book.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field: keyof typeof form): React.CSSProperties => ({
    width: '100%',
    border: `2px solid ${errors[field] ? '#D32F2F' : '#D7CCC8'}`,
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    background: errors[field] ? '#FFF5F5' : '#fff',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    fontFamily: 'var(--font-sans)',
    color: 'var(--color-text)',
  });

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'white',
        padding: '28px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '24px',
          color: '#3E2723',
        }}
      >
        {book ? '编辑书籍' : '上架新书'}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px 20px',
        }}
        className="admin-form-grid"
      >
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
            书名
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            style={inputStyle('title')}
          />
          {errors.title && (
            <div className="fade-in" style={{ color: '#D32F2F', fontSize: '12px', marginTop: '4px' }}>
              {errors.title}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
            作者
          </label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => handleChange('author', e.target.value)}
            onBlur={() => handleBlur('author')}
            style={inputStyle('author')}
          />
          {errors.author && (
            <div className="fade-in" style={{ color: '#D32F2F', fontSize: '12px', marginTop: '4px' }}>
              {errors.author}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
            分类
          </label>
          <select
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value as Category)}
            style={inputStyle('category')}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
            出版年份
          </label>
          <input
            type="number"
            value={form.publishYear}
            onChange={(e) => handleChange('publishYear', e.target.value ? Number(e.target.value) : '')}
            style={inputStyle('publishYear')}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
            出版社
          </label>
          <input
            type="text"
            value={form.publisher}
            onChange={(e) => handleChange('publisher', e.target.value)}
            style={inputStyle('publisher')}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
            ISBN
          </label>
          <input
            type="text"
            value={form.isbn}
            onChange={(e) => handleChange('isbn', e.target.value)}
            style={inputStyle('isbn')}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
            品相
          </label>
          <select
            value={form.condition}
            onChange={(e) => handleChange('condition', Number(e.target.value))}
            style={inputStyle('condition')}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
            价格
          </label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value ? Number(e.target.value) : '')}
            onBlur={() => handleBlur('price')}
            style={inputStyle('price')}
          />
          {errors.price && (
            <div className="fade-in" style={{ color: '#D32F2F', fontSize: '12px', marginTop: '4px' }}>
              {errors.price}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
            库存
          </label>
          <input
            type="number"
            value={form.stock}
            onChange={(e) => handleChange('stock', e.target.value ? Number(e.target.value) : '')}
            style={inputStyle('stock')}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6D4C41', marginBottom: '6px' }}>
            品相描述
          </label>
          <textarea
            rows={3}
            value={form.conditionDesc}
            onChange={(e) => handleChange('conditionDesc', e.target.value)}
            style={inputStyle('conditionDesc')}
          />
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: '1px solid #D7CCC8',
            color: '#6D4C41',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: '#FF7043',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          {submitting ? '提交中...' : book ? '保存修改' : '上架书籍'}
        </button>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .admin-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}
