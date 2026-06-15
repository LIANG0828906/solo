import { useState } from 'react';
import { Upload, Home, Layers } from 'lucide-react';
import './Navbar.css';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => onNavigate('home')}>
          <div className="logo-icon">
            <Layers size={24} />
          </div>
          <span className="logo-text">ModelVault</span>
        </div>

        <div className="nav-links">
          <button
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            <Home size={18} />
            <span>模型库</span>
          </button>
          <button
            className={`nav-link upload-btn ${currentPage === 'upload' ? 'active' : ''}`}
            onClick={() => onNavigate('upload')}
          >
            <Upload size={18} />
            <span>上传</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
