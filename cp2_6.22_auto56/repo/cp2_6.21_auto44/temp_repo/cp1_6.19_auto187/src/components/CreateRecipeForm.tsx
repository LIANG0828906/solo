import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLAVOR_TAGS, COOKING_METHODS } from '../module1/types';
import { useRecipeStore } from '../store/useRecipeStore';

export const CreateRecipeForm: React.FC = () => {
  const { isCreateModalOpen, toggleCreateModal, addRecipe } = useRecipeStore();

  const [name, setName] = useState('');
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [cookingMethod, setCookingMethod] = useState(COOKING_METHODS[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [icon, setIcon] = useState('vegetable');
  const [rating, setRating] = useState(4);

  const iconOptions = [
    { id: 'tomato', label: '🍅 番茄' },
    { id: 'chili', label: '🌶️ 辣椒' },
    { id: 'fish', label: '🐟 鱼' },
    { id: 'meat', label: '🥩 肉' },
    { id: 'vegetable', label: '🥬 蔬菜' },
    { id: 'egg', label: '🥚 蛋' },
    { id: 'noodle', label: '🍜 面条' },
    { id: 'rice', label: '🍚 米饭' },
    { id: 'soup', label: '🍲 汤' },
    { id: 'dessert', label: '🍰 甜点' },
  ];

  const toggleTagSelection = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((t) => t !== tagId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, tagId];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedTags.length === 0) return;

    addRecipe({
      name: name.trim(),
      ingredients: ingredientsInput
        .split(/[,，、\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      cookingMethod,
      flavorTags: selectedTags,
      rating,
      likes: 0,
      description: description.trim() || '美味的家常菜',
      steps: stepsInput
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean),
      icon,
    });

    setName('');
    setIngredientsInput('');
    setCookingMethod(COOKING_METHODS[0]);
    setSelectedTags([]);
    setDescription('');
    setStepsInput('');
    setIcon('vegetable');
    setRating(4);
  };

  return (
    <AnimatePresence>
      {isCreateModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCreateModal}
            style={{
              position: 'fixed',
              inset: 0,
              background: '#00000080',
              zIndex: 200,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '520px',
              maxHeight: '90vh',
              background: '#FEFAF0',
              borderRadius: '16px',
              padding: '24px',
              zIndex: 201,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '2px dashed #D2B48C',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-handwriting)',
                  fontSize: '32px',
                  color: '#5C4033',
                }}
              >
                ✨ 新建食谱卡片
              </h2>
              <button
                onClick={toggleCreateModal}
                style={{
                  fontSize: '24px',
                  color: '#8B7355',
                  padding: '4px 8px',
                  borderRadius: '8px',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px', color: '#5C4033' }}>
                  食谱名称 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：麻婆豆腐"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px', color: '#5C4033' }}>
                  选择图标
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {iconOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setIcon(opt.id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '999px',
                        border: `2px solid ${icon === opt.id ? '#8B6F47' : '#D2B48C'}`,
                        background: icon === opt.id ? '#F5E6C8' : 'transparent',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px', color: '#5C4033' }}>
                  主要食材（用逗号或换行分隔）
                </label>
                <textarea
                  value={ingredientsInput}
                  onChange={(e) => setIngredientsInput(e.target.value)}
                  placeholder="例如：豆腐, 猪肉末, 豆瓣酱"
                  rows={2}
                  style={textareaStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px', color: '#5C4033' }}>
                    烹饪方式
                  </label>
                  <select
                    value={cookingMethod}
                    onChange={(e) => setCookingMethod(e.target.value as typeof cookingMethod)}
                    style={selectStyle}
                  >
                    {COOKING_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px', color: '#5C4033' }}>
                    评分
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 0' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{ fontSize: '22px', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <span style={{ color: star <= rating ? '#FFD93D' : '#D2B48C' }}>★</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px', color: '#5C4033' }}>
                  风味标签 *（选择 1-3 个）
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {FLAVOR_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTagSelection(tag.id)}
                        disabled={!isSelected && selectedTags.length >= 3}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '999px',
                          border: `2px solid ${tag.color}`,
                          background: isSelected ? tag.color : 'transparent',
                          color: '#5C4033',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '13px',
                          cursor: !isSelected && selectedTags.length >= 3 ? 'not-allowed' : 'pointer',
                          opacity: !isSelected && selectedTags.length >= 3 ? 0.5 : 1,
                        }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px', color: '#5C4033' }}>
                  简短描述
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="一句话描述这道菜的特点"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px', color: '#5C4033' }}>
                  烹饪步骤（每行一步）
                </label>
                <textarea
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  placeholder={"1. 先将食材洗净\n2. 热锅下油..."}
                  rows={4}
                  style={textareaStyle}
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                type="submit"
                disabled={!name.trim() || selectedTags.length === 0}
                style={{
                  marginTop: '8px',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  background: '#8B6F47',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: !name.trim() || selectedTags.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: !name.trim() || selectedTags.length === 0 ? 0.6 : 1,
                  fontFamily: 'var(--font-handwriting)',
                  letterSpacing: '1px',
                }}
              >
                🍳 生成食谱卡片
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '2px dashed #D2B48C',
  borderRadius: '10px',
  fontSize: '14px',
  outline: 'none',
  background: '#FFFFFF',
  color: '#5C4033',
  fontFamily: 'var(--font-body)',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '60px',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};
