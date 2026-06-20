import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, Item, getRandomAvatarColor } from '../data';

interface ItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<Item, 'id' | 'createdAt'>) => void;
}

const categories: Category[] = ['电子产品', '书籍', '家居', '服饰', '其他'];

const ItemForm: React.FC<ItemFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('电子产品');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; description?: string } = {};

    if (!name.trim() || name.length > 20) {
      newErrors.name = '请填写物品名称（20字以内）';
    }
    if (!description.trim() || description.length > 100) {
      newErrors.description = '请填写物品描述（100字以内）';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      category,
      imageUrl: imageUrl.trim(),
      ownerName: '我',
      ownerAvatar: getRandomAvatarColor()
    });

    setName('');
    setDescription('');
    setCategory('电子产品');
    setImageUrl('');
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCategory('电子产品');
    setImageUrl('');
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 100
            }}
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: 450,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              padding: 32,
              zIndex: 101
            }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 24, color: '#333' }}>
              发布闲置物品
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#555', marginBottom: 8 }}>
                  物品名称 <span style={{ color: '#FF6584' }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  placeholder="请输入物品名称（20字以内）"
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 14px',
                    borderRadius: 8,
                    border: errors.name ? '1px solid #FF6584' : '1px solid #E0E0E0',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    if (!errors.name) {
                      e.target.style.borderImage = 'linear-gradient(to right, #6C63FF, #FF6584) 1';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderImage = 'none';
                    if (!errors.name) {
                      e.target.style.borderColor = '#E0E0E0';
                    }
                  }}
                />
                {errors.name && (
                  <p style={{ color: '#FF6584', fontSize: 12, margin: '6px 0 0 0' }}>{errors.name}</p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#555', marginBottom: 8 }}>
                  物品描述 <span style={{ color: '#FF6584' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={100}
                  placeholder="请输入物品描述（100字以内）"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: errors.description ? '1px solid #FF6584' : '1px solid #E0E0E0',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    resize: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    if (!errors.description) {
                      e.target.style.borderImage = 'linear-gradient(to right, #6C63FF, #FF6584) 1';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderImage = 'none';
                    if (!errors.description) {
                      e.target.style.borderColor = '#E0E0E0';
                    }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  {errors.description ? (
                    <p style={{ color: '#FF6584', fontSize: 12, margin: 0 }}>{errors.description}</p>
                  ) : <div />}
                  <span style={{ fontSize: 12, color: '#999' }}>{description.length}/100</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#555', marginBottom: 8 }}>
                  物品类别
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 14px',
                    borderRadius: 8,
                    border: '1px solid #E0E0E0',
                    fontSize: 14,
                    outline: 'none',
                    backgroundColor: '#FFF',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#555', marginBottom: 8 }}>
                  图片URL（可选）
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="请输入图片链接"
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 14px',
                    borderRadius: 8,
                    border: '1px solid #E0E0E0',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderImage = 'linear-gradient(to right, #6C63FF, #FF6584) 1';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderImage = 'none';
                    e.target.style.borderColor = '#E0E0E0';
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 8,
                    border: '1px solid #E0E0E0',
                    backgroundColor: '#FAFAFA',
                    color: '#666',
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                >
                  取消
                </button>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.95 }}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                    color: '#FFF',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  确认发布
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ItemForm;
