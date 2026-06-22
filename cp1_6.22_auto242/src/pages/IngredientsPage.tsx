import React, { useState } from 'react';
import IngredientCard from '../components/IngredientCard';
import type { Ingredient } from '../types';

interface IngredientsPageProps {
  ingredients: Ingredient[];
  onAddIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  onUpdateIngredient: (id: string, data: Partial<Ingredient>) => void;
  onDeleteIngredient: (id: string) => void;
}

const IngredientsPage: React.FC<IngredientsPageProps> = ({ 
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
}) => {
  const [familyFilter, setFamilyFilter] = useState<string>('全部');
  const [stockFilter, setStockFilter] = useState<string>('全部');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const families = ['全部', ...Array.from(new Set(ingredients.map(i => i.family)))];
  const stockOptions = ['全部', '充足', '低库存', '缺货'];

  const filteredIngredients = ingredients.filter(ing => {
    if (familyFilter !== '全部' && ing.family !== familyFilter) return false;
    
    if (stockFilter === '缺货' && ing.stock > 0) return false;
    if (stockFilter === '低库存' && (ing.stock <= 0 || ing.stock >= 20)) return false;
    if (stockFilter === '充足' && ing.stock < 20) return false;
    
    return true;
  });

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: '天然精油',
    family: '花香',
    stock: 0,
    unit: 'ml',
    cost: 0,
    supplier: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIngredient) {
      onUpdateIngredient(selectedIngredient.id, formData);
    } else {
      onAddIngredient(formData);
    }
    setShowAddModal(false);
    setSelectedIngredient(null);
    setFormData({
      name: '',
      brand: '',
      type: '天然精油',
      family: '花香',
      stock: 0,
      unit: 'ml',
      cost: 0,
      supplier: '',
    });
  };

  const openEdit = (ing: Ingredient) => {
    setSelectedIngredient(ing);
    setFormData({
      name: ing.name,
      brand: ing.brand,
      type: ing.type,
      family: ing.family,
      stock: ing.stock,
      unit: ing.unit,
      cost: ing.cost,
      supplier: ing.supplier,
    });
    setShowAddModal(true);
  };

  return (
    <div className="ingredients-page">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#3C2415',
            fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
            margin: '0 0 8px 0',
          }}>
            原料库
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
            margin: 0,
          }}>
            共 {ingredients.length} 种香料原料
          </p>
        </div>
        
        <button
          onClick={() => {
            setSelectedIngredient(null);
            setFormData({
              name: '',
              brand: '',
              type: '天然精油',
              family: '花香',
              stock: 0,
              unit: 'ml',
              cost: 0,
              supplier: '',
            });
            setShowAddModal(true);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#C9A96E',
            color: '#FDFBF7',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            transition: 'background-color 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#B8974E';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#C9A96E';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          + 添加原料
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: '#8B7355',
            marginBottom: '6px',
            fontFamily: "'Inter', sans-serif",
          }}>
            香调家族
          </label>
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D4C5A9',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              backgroundColor: '#FDFBF7',
              color: '#3C2415',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '120px',
            }}
          >
            {families.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: '#8B7355',
            marginBottom: '6px',
            fontFamily: "'Inter', sans-serif",
          }}>
            库存状态
          </label>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D4C5A9',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              backgroundColor: '#FDFBF7',
              color: '#3C2415',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '120px',
            }}
          >
            {stockOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 280px)',
        gap: '20px',
      }}>
        {filteredIngredients.map(ing => (
          <IngredientCard 
            key={ing.id} 
            ingredient={ing}
            onClick={() => openEdit(ing)}
          />
        ))}
      </div>

      {filteredIngredients.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#A6967C',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
        }}>
          没有找到符合条件的原料
        </div>
      )}

      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(60, 36, 21, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
        }}
        onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FDFBF7',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(60,36,21,0.2)',
            }}
          >
            <h2 style={{
              fontSize: '22px',
              fontWeight: 600,
              color: '#3C2415',
              fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
              margin: '0 0 20px 0',
            }}>
              {selectedIngredient ? '编辑原料' : '添加新原料'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>原料名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                
                <div>
                  <label style={labelStyle}>品牌</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                
                <div>
                  <label style={labelStyle}>类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="天然精油">天然精油</option>
                    <option value="合成香料">合成香料</option>
                    <option value="天然提取物">天然提取物</option>
                    <option value="基础油">基础油</option>
                  </select>
                </div>
                
                <div>
                  <label style={labelStyle}>香调家族</label>
                  <select
                    value={formData.family}
                    onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="花香">花香</option>
                    <option value="木质">木质</option>
                    <option value="辛香">辛香</option>
                    <option value="柑橘">柑橘</option>
                    <option value="果香">果香</option>
                    <option value="草本">草本</option>
                    <option value="麝香">麝香</option>
                    <option value="海洋">海洋</option>
                    <option value="东方">东方</option>
                  </select>
                </div>
                
                <div>
                  <label style={labelStyle}>库存量</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                    style={inputStyle}
                    required
                  />
                </div>
                
                <div>
                  <label style={labelStyle}>单位</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                    <option value="drops">滴</option>
                  </select>
                </div>
                
                <div>
                  <label style={labelStyle}>购买成本 (元/{formData.unit})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    style={inputStyle}
                    required
                  />
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>供应商</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'flex-end',
                marginTop: '24px',
              }}>
                {selectedIngredient && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('确定要删除这个原料吗？')) {
                        onDeleteIngredient(selectedIngredient.id);
                        setShowAddModal(false);
                        setSelectedIngredient(null);
                      }
                    }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      color: '#C47A7A',
                      border: '1px solid #C47A7A',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                      cursor: 'pointer',
                      marginRight: 'auto',
                    }}
                  >
                    删除
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedIngredient(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#8B7355',
                    border: '1px solid #D4C5A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F0EBE0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#C9A96E',
                    color: '#FDFBF7',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer',
                    transition: 'background-color 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#B8974E';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#C9A96E';
                  }}
                >
                  {selectedIngredient ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#8B7355',
  marginBottom: '6px',
  fontFamily: "'Inter', sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #D4C5A9',
  borderRadius: '6px',
  fontSize: '13px',
  fontFamily: "'Inter', sans-serif",
  backgroundColor: '#FDFBF7',
  color: '#3C2415',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'box-shadow 0.2s, border-color 0.2s',
};

export default IngredientsPage;
