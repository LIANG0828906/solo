import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { FABRIC_TYPES, SIZES } from '../types';

export const ClientOrder: React.FC = () => {
  const { formulas, fetchAvailableFormulas, addOrder, loading } = useStore();
  const [fabricType, setFabricType] = useState('');
  const [size, setSize] = useState('');
  const [formulaId, setFormulaId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [referenceImage, setReferenceImage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [fabricDropdownOpen, setFabricDropdownOpen] = useState(false);
  const [formulaDropdownOpen, setFormulaDropdownOpen] = useState(false);

  useEffect(() => {
    fetchAvailableFormulas();
  }, [fetchAvailableFormulas]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fabricType || !size || !formulaId || !customerName || !customerPhone) {
      alert('请填写完整信息');
      return;
    }

    await addOrder({
      fabricType,
      size,
      formulaId: parseInt(formulaId),
      referenceImage,
      customerName,
      customerPhone
    });

    setShowSuccess(true);
    setFabricType('');
    setSize('');
    setFormulaId('');
    setCustomerName('');
    setCustomerPhone('');
    setReferenceImage('');
    
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const selectedFabric = FABRIC_TYPES.find(f => f.value === fabricType);
  const selectedFormula = formulas.find(f => f.id === parseInt(formulaId));

  return (
    <div>
      <h1 className="page-title">🎨 在线定制染色</h1>
      
      {showSuccess && (
        <div className="success-toast">
          ✓ 订单提交成功！我们会尽快与您联系
        </div>
      )}

      <form className="card" onSubmit={handleSubmit}>
        <div className="inline-form">
          <div className="form-group">
            <label>您的姓名</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="请输入您的姓名"
            />
          </div>

          <div className="form-group">
            <label>联系电话</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="请输入联系电话"
            />
          </div>

          <div className="form-group">
            <label>布料种类</label>
            <div className="fabric-select-wrapper">
              <div 
                className="dropdown-option"
                style={{ 
                  border: '2px solid #E0E0E0', 
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => setFabricDropdownOpen(!fabricDropdownOpen)}
              >
                {selectedFabric ? (
                  <>
                    <span className="fabric-texture">{selectedFabric.texture}</span>
                    <div className="fabric-info">
                      <span className="fabric-label">{selectedFabric.label}</span>
                    </div>
                  </>
                ) : (
                  <span style={{ color: '#9E9E9E' }}>请选择布料种类</span>
                )}
                <span style={{ marginLeft: 'auto', color: '#8D6E63' }}>▼</span>
              </div>
              
              {fabricDropdownOpen && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  background: 'white', 
                  border: '2px solid #E0E0E0',
                  borderRadius: '8px',
                  marginTop: '4px',
                  zIndex: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                }}>
                  {FABRIC_TYPES.map(fabric => (
                    <div 
                      key={fabric.value}
                      className="dropdown-option"
                      onClick={() => {
                        setFabricType(fabric.value);
                        setFabricDropdownOpen(false);
                      }}
                    >
                      <span className="fabric-texture">{fabric.texture}</span>
                      <div className="fabric-info">
                        <span className="fabric-label">{fabric.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>尺寸</label>
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="">请选择尺寸</option>
              {SIZES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label>染色配方</label>
            <div className="fabric-select-wrapper">
              <div 
                className="dropdown-option"
                style={{ 
                  border: '2px solid #E0E0E0', 
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => setFormulaDropdownOpen(!formulaDropdownOpen)}
              >
                {selectedFormula ? (
                  <div className="formula-select-option">
                    <div 
                      className="color-block"
                      style={{ background: `linear-gradient(135deg, ${selectedFormula.colorFrom}, ${selectedFormula.colorTo})` }}
                    ></div>
                    <span>{selectedFormula.name}</span>
                  </div>
                ) : (
                  <span style={{ color: '#9E9E9E' }}>请选择染色配方</span>
                )}
                <span style={{ marginLeft: 'auto', color: '#8D6E63' }}>▼</span>
              </div>
              
              {formulaDropdownOpen && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  background: 'white', 
                  border: '2px solid #E0E0E0',
                  borderRadius: '8px',
                  marginTop: '4px',
                  zIndex: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {formulas.map(formula => (
                    <div 
                      key={formula.id}
                      className="dropdown-option"
                      onClick={() => {
                        setFormulaId(formula.id.toString());
                        setFormulaDropdownOpen(false);
                      }}
                    >
                      <div 
                        className="color-block"
                        style={{ background: `linear-gradient(135deg, ${formula.colorFrom}, ${formula.colorTo})` }}
                      ></div>
                      <span>{formula.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group full-width">
            <label>参考图（可选）</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload" className="file-upload-area">
              <p>📷 点击上传参考图片</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>支持 JPG、PNG 格式</p>
            </label>
            {referenceImage && (
              <img 
                src={referenceImage} 
                alt="参考图预览" 
                className="reference-image-preview"
              />
            )}
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
          {loading ? '提交中...' : '提交定制需求'}
        </button>
      </form>
    </div>
  );
};
