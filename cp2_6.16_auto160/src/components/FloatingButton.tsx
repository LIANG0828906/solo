import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, ImagePlus } from 'lucide-react';
import { useExhibitStore } from '../store';
import './FloatingButton.css';

function FloatingButton() {
  const { openForm } = useExhibitStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddExhibit = () => {
    openForm();
    setIsOpen(false);
  };

  const handleUploadImage = () => {
    openForm();
    setIsOpen(false);
  };

  return (
    <div className="floating-button-container" ref={menuRef}>
      <div className={`sub-menu ${isOpen ? 'open' : ''}`}>
        <button className="sub-menu-item" onClick={handleUploadImage}>
          <Upload size={18} />
          <span className="sub-menu-label">上传图片</span>
        </button>
        <button className="sub-menu-item" onClick={handleAddExhibit}>
          <ImagePlus size={18} />
          <span className="sub-menu-label">添加展品</span>
        </button>
      </div>

      <button
        className={`fab-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? '关闭菜单' : '打开菜单'}
      >
        <Plus size={24} className="fab-icon" />
      </button>
    </div>
  );
}

export default FloatingButton;
