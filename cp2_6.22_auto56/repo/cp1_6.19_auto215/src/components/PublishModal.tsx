import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { ItemCategory } from '../types';

const categories: ItemCategory[] = ['书籍', '电子', '家居', '服饰', '运动', '其他'];

export function PublishModal() {
  const { showPublishModal, setShowPublishModal, addItem } = useStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('其他');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !weight) return;

    addItem({
      name: name.trim(),
      category,
      weight: parseFloat(weight) || 0,
      description: description.trim(),
      imageUrl: `https://picsum.photos/seed/${Date.now()}/400/300`,
      distance: 0.1,
    });

    setName('');
    setCategory('其他');
    setWeight('');
    setDescription('');
    setShowPublishModal(false);
  };

  return (
    <AnimatePresence>
      {showPublishModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPublishModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 100,
              backdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: 420,
              background: 'rgba(26, 38, 52, 0.95)',
              backdropFilter: 'blur(12px)',
              borderRadius: 16,
              padding: 24,
              zIndex: 101,
              color: '#E0E0E0',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>发布闲置物品</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: '#BDC3C7' }}>
                物品名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入物品名称"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#E0E0E0',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: '#BDC3C7' }}>
                物品类别
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map((cat) => (
                  <motion.button
                    key={cat}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 16,
                      border: 'none',
                      fontSize: 12,
                      cursor: 'pointer',
                      background: category === cat ? '#4A90D9' : 'rgba(255,255,255,0.1)',
                      color: category === cat ? '#fff' : '#E0E0E0',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: '#BDC3C7' }}>
                预估重量 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="请输入预估重量"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#E0E0E0',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: '#BDC3C7' }}>
                图片上传
              </label>
              <div
                style={{
                  width: '100%',
                  height: 100,
                  borderRadius: 8,
                  border: '2px dashed rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#95A5A6',
                  fontSize: 13,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                📷 点击上传图片（占位）
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: '#BDC3C7' }}>
                物品描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请描述物品的新旧程度、使用情况等"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#E0E0E0',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPublishModal(false)}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#E0E0E0',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                取消
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!name.trim() || !weight}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  border: 'none',
                  background: name.trim() && weight ? '#2ECC71' : '#95A5A6',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: name.trim() && weight ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease',
                }}
              >
                发布
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
