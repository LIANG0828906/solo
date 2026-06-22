import React, { useState } from 'react';
import TestingCard from '../components/TestingCard';
import type { TestingRecord, Recipe } from '../types';

interface TestingPageProps {
  records: TestingRecord[];
  recipes: Recipe[];
  onAddRecord: (record: Omit<TestingRecord, 'id'>) => void;
}

const TestingPage: React.FC<TestingPageProps> = ({ records, recipes, onAddRecord }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    recipeId: '',
    date: new Date().toISOString().split('T')[0],
    duration: '30分钟',
    rating: 3,
    longevity: '4-6小时',
    evolution: '',
  });

  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getRecipeById = (id: string) => recipes.find(r => r.id === id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipeId) {
      alert('请选择配方');
      return;
    }
    onAddRecord(formData);
    setShowAddModal(false);
    setFormData({
      recipeId: '',
      date: new Date().toISOString().split('T')[0],
      duration: '30分钟',
      rating: 3,
      longevity: '4-6小时',
      evolution: '',
    });
  };

  const renderStarInput = () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setFormData({ ...formData, rating: star })}
        style={{
          fontSize: '28px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: star <= formData.rating ? '#C9A96E' : '#D4C5A9',
          transition: 'transform 0.3s ease, color 0.15s',
          transform: star <= formData.rating ? 'scale(1.1)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = star <= formData.rating ? 'scale(1.1)' : 'scale(1)';
        }}
      >
        ★
      </button>
    ))}
    </div>
  );

  return (
    <div className="testing-page">
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
            试香记录
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
            margin: 0,
          }}>
            共 {records.length} 条试香笔记
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
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
          + 记录试香
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px',
      }}>
        {sortedRecords.map(record => (
          <TestingCard
            key={record.id}
            record={record}
            recipe={getRecipeById(record.recipeId)}
          />
        ))}
      </div>

      {records.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#A6967C',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
        }}>
          还没有试香记录，点击上方按钮记录你的第一次试香吧
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
              记录试香
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>选择配方</label>
                <select
                  value={formData.recipeId}
                  onChange={(e) => setFormData({ ...formData, recipeId: e.target.value })}
                  style={inputStyle}
                  required
                >
                  <option value="">请选择配方</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={labelStyle}>试香日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              
              <div>
                <label style={labelStyle}>试香时长</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="例如：30分钟"
                  style={inputStyle}
                  required
                />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>主观评分</label>
                {renderStarInput()}
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>留香时长</label>
                <select
                  value={formData.longevity}
                  onChange={(e) => setFormData({ ...formData, longevity: e.target.value })}
                  style={inputStyle}
                >
                  <option value="1-2小时">1-2小时</option>
                  <option value="2-4小时">2-4小时</option>
                  <option value="4-6小时">4-6小时</option>
                  <option value="6-8小时">6-8小时</option>
                  <option value="8-10小时">8-10小时</option>
                  <option value="10小时以上">10小时以上</option>
                </select>
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>气味随时间的演变</label>
                <textarea
                  value={formData.evolution}
                  onChange={(e) => setFormData({ ...formData, evolution: e.target.value })}
                  placeholder="描述前调、中调、后调的变化..."
                  style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                  rows={4}
                  required
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#B8974E';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#C9A96E';
                }}
              >
                保存
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

export default TestingPage;
