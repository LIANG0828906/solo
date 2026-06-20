import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Search, Plus } from 'lucide-react';

interface NavbarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, searchQuery }) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <Link 
        to="/" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          fontWeight: 700,
          fontSize: '20px',
          color: 'var(--accent-blue)',
          marginRight: '32px'
        }}
      >
        <Code2 size={28} />
        <span>CodeShare</span>
      </Link>

      <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
        <Search 
          size={18} 
          style={{ 
            position: 'absolute', 
            left: '14px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)'
          }} 
        />
        <input
          type="text"
          placeholder="搜索代码片段..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            width: '100%',
            height: '40px',
            padding: '0 14px 0 42px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-secondary)',
            fontSize: '14px',
            color: 'var(--text-primary)',
            transition: 'var(--transition)',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent-blue)';
            e.target.style.backgroundColor = 'var(--bg-primary)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.backgroundColor = 'var(--bg-secondary)';
          }}
        />
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
        <button
          onClick={() => navigate('/create')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '40px',
            padding: '0 18px',
            backgroundColor: 'var(--accent-blue)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Plus size={18} />
          <span>新建</span>
        </button>

        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '2px solid #B0B0B0',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)',
          cursor: 'pointer',
          transition: 'var(--transition)'
        }}>
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=current" 
            alt="用户头像" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
