import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/store/useAppStore';
import type { Ingredient, IngredientCategory } from '@/types';

interface AddRecipeFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const COVER_COLORS = [
  '#FF6B6B', '#E67E22', '#F1C40F', '#2ECC71', '#3498DB',
  '#9B59B6', '#E91E63', '#1ABC9C', '#C44536', '#7D6608',
];

const CATEGORIES: { value: IngredientCategory; label: string }[] = [
  { value: 'vegetables', label: '蔬菜类' },
  { value: 'meat', label: '肉类' },
  { value: 'seasoning', label: '调味品' },
  { value: 'drygoods', label: '干货类' },
  { value: 'other', label: '其他' },
];

export function AddRecipeForm({ isOpen, onClose }: AddRecipeFormProps) {
  const addRecipe = useAppStore((state) => state.addRecipe);
  
  const [name, setName] = useState('');
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: uuidv4(), name: '', quantity: 0, unit: 'g', category: 'other' },
  ]);
  const [steps, setSteps] = useState<string[]>(['']);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: uuidv4(), name: '', quantity: 0, unit: 'g', category: 'other' },
    ]);
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    }
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    const validIngredients = ingredients.filter(
      (ing) => ing.name.trim() && ing.quantity > 0
    );
    const validSteps = steps.filter((step) => step.trim());
    
    if (validIngredients.length === 0 || validSteps.length === 0) return;
    
    addRecipe({
      name: name.trim(),
      coverColor,
      ingredients: validIngredients,
      steps: validSteps,
    });
    
    setName('');
    setCoverColor(COVER_COLORS[0]);
    setIngredients([{ id: uuidv4(), name: '', quantity: 0, unit: 'g', category: 'other' }]);
    setSteps(['']);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(44, 62, 80, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '90%',
            maxWidth: 500,
            maxHeight: '85vh',
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            overflowY: 'auto',
          }}
        >
          <h2 style={{
            margin: '0 0 20px 0',
            fontSize: 20,
            fontWeight: 600,
            color: '#2C3E50',
          }}>
            添加新菜谱
          </h2>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 14,
              fontWeight: 500,
              color: '#2C3E50',
            }}>
              菜名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入菜名"
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid #E0E0E0',
                fontSize: 14,
                color: '#2C3E50',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#E67E22';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E0E0E0';
              }}
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 14,
              fontWeight: 500,
              color: '#2C3E50',
            }}>
              封面颜色
            </label>
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}>
              {COVER_COLORS.map((color) => (
                <motion.div
                  key={color}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCoverColor(color)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: color,
                    cursor: 'pointer',
                    border: coverColor === color ? '3px solid #E67E22' : '2px solid transparent',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <label style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#2C3E50',
              }}>
                食材清单
              </label>
              <button
                onClick={addIngredient}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#FFF8F0',
                  color: '#E67E22',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FDEBD0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFF8F0';
                }}
              >
                + 添加食材
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ingredients.map((ing, index) => (
                <div key={ing.id} style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}>
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                    placeholder="食材名"
                    style={{
                      flex: 1,
                      height: 36,
                      padding: '0 10px',
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="number"
                    value={ing.quantity || ''}
                    onChange={(e) => updateIngredient(ing.id, 'quantity', Number(e.target.value))}
                    placeholder="数量"
                    style={{
                      width: 60,
                      height: 36,
                      padding: '0 8px',
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                    placeholder="单位"
                    style={{
                      width: 50,
                      height: 36,
                      padding: '0 8px',
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <select
                    value={ing.category}
                    onChange={(e) => updateIngredient(ing.id, 'category', e.target.value as IngredientCategory)}
                    style={{
                      height: 36,
                      padding: '0 8px',
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      fontSize: 13,
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {ingredients.length > 1 && (
                    <button
                      onClick={() => removeIngredient(ing.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: '#FFEBEE',
                        color: '#E74C3C',
                        fontSize: 16,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <label style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#2C3E50',
              }}>
                烹饪步骤
              </label>
              <button
                onClick={addStep}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#FFF8F0',
                  color: '#E67E22',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FDEBD0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFF8F0';
                }}
              >
                + 添加步骤
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {steps.map((step, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}>
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#E67E22',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 6,
                  }}>
                    {index + 1}
                  </span>
                  <textarea
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder="描述这一步的做法"
                    rows={2}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      fontSize: 13,
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(index)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: '#FFEBEE',
                        color: '#E74C3C',
                        fontSize: 16,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: '1px solid #E0E0E0',
                backgroundColor: '#FFFFFF',
                color: '#7F8C8D',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F5F5F5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#E67E22',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#D35400';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E67E22';
              }}
            >
              保存菜谱
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
