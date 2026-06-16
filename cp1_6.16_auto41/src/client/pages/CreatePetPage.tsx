import { useState, useCallback } from 'react';
import { PET_COLORS } from '../types';
import './CreatePetPage.css';

interface CreatePetPageProps {
  onCreate: (name: string, color: string) => void;
}

const CreatePetPage = function CreatePetPage({ onCreate }: CreatePetPageProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PET_COLORS[0]);

  const handleSubmit = useCallback(() => {
    if (name.trim()) {
      onCreate(name.trim(), selectedColor);
    }
  }, [name, selectedColor, onCreate]);

  return (
    <div className="create-pet-page">
      <div className="create-card animate-scale-in">
        <h1 className="create-title">
          <span className="title-icon">🐱</span>
          领养你的宠物
        </h1>
        
        <div className="pet-preview">
          <div 
            className="preview-pet"
            style={{ ['--pet-color' as string]: selectedColor }}
          >
            <div className="preview-body">
              <div className="preview-ears">
                <div className="preview-ear left" />
                <div className="preview-ear right" />
              </div>
              <div className="preview-face">
                <div className="preview-eyes">
                  <div className="preview-eye" />
                  <div className="preview-eye" />
                </div>
                <div className="preview-nose" />
                <div className="preview-mouth" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">给宠物起个名字</label>
          <input
            type="text"
            className="name-input"
            placeholder="输入宠物名字..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={10}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">选择毛色</label>
          <div className="color-options">
            {PET_COLORS.map(color => (
              <button
                key={color}
                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>
        
        <button
          className="create-btn"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          开始养宠 🎉
        </button>
      </div>
    </div>
  );
};

export default CreatePetPage;
