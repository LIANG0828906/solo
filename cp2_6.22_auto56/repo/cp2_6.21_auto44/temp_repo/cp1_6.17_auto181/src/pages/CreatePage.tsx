import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalligraphyEngine } from '../CalligraphyEngine';
import { useAppStore } from '../store';
import axios from 'axios';

const COLORS = [
  { name: '墨黑', value: '#1A1A1A' },
  { name: '朱砂', value: '#C23B22' },
  { name: '石青', value: '#4A7C59' },
  { name: '藤黄', value: '#D4A373' },
  { name: '钛白', value: '#F0E6D3' },
  { name: '胭脂', value: '#8B2252' },
  { name: '赭石', value: '#6B4226' }
];

function CreatePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CalligraphyEngine | null>(null);
  const [selectedColor, setSelectedColor] = useState('#1A1A1A');
  const [isSaving, setIsSaving] = useState(false);
  const { user, addWork } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    engineRef.current = new CalligraphyEngine(canvas);

    const handleResize = () => {
      if (!container || !engineRef.current) return;
      const strokes = engineRef.current.getStrokes();
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      engineRef.current.setStrokes(strokes);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setColor(selectedColor);
    }
  }, [selectedColor]);

  const handleSave = useCallback(async () => {
    if (!engineRef.current || isSaving) return;
    
    setIsSaving(true);
    try {
      const workData = engineRef.current.getWorkData(user.id);
      const response = await axios.post('/api/works', {
        ...workData,
        title: '我的书法作品',
        userId: user.id
      });
      
      addWork(response.data);
      alert('作品保存成功！');
      navigate('/gallery');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [user, addWork, navigate, isSaving]);

  const handleClear = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.clear();
    }
  }, []);

  return (
    <div className="create-page">
      <div className="canvas-container">
        <canvas ref={canvasRef} className="calligraphy-canvas" />
        
        <div className="color-palette">
          {COLORS.map((color) => (
            <div
              key={color.value}
              className={`color-swatch ${selectedColor === color.value ? 'selected' : ''}`}
              style={{ backgroundColor: color.value }}
              title={color.name}
              onClick={() => setSelectedColor(color.value)}
            />
          ))}
        </div>
        
        <div style={{ position: 'absolute', top: '20px', right: '80px', display: 'flex', gap: '10px' }}>
          <button
            onClick={handleClear}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#8B4513',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F0E1'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'}
            title="清空画布"
          >
            清空
          </button>
        </div>
        
        <button 
          className="save-btn"
          onClick={handleSave}
          disabled={isSaving}
          title="保存作品"
        >
          {isSaving ? '...' : '✓'}
        </button>
      </div>
      
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        <p>使用鼠标或触摸在画布上书写 | 选择左侧颜料调整笔触颜色 | 点击右上角保存</p>
      </div>
    </div>
  );
}

export default CreatePage;
