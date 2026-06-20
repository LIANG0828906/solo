import React, { useState, useRef, useCallback } from 'react';
import { useGradientStore, Theme } from '../stores/gradientStore';
import { formatGradientCSS } from '../engine/gradientEngine';

const ConfirmModal: React.FC<{
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ message, onConfirm, onCancel }) => (
  <div
    className="modal-overlay"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}
    onClick={onCancel}
  >
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: 28,
        width: 360,
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p style={{ fontSize: 15, color: '#333', marginBottom: 24, lineHeight: 1.6 }}>
        {message}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 20px',
            background: '#F5F5F5',
            color: '#666',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E0E0E0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F5F5F5';
          }}
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: '8px 20px',
            background: '#FF7043',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FF8A65';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FF7043';
          }}
        >
          确定
        </button>
      </div>
    </div>
  </div>
);

const SaveThemeModal: React.FC<{
  onSave: (name: string) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: 28,
          width: 360,
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#333',
            marginBottom: 20,
          }}
        >
          保存为主题
        </h3>
        <input
          ref={inputRef}
          className="modal-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入主题名称..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) onSave(name.trim());
          }}
          style={{
            width: '100%',
            height: 40,
            borderRadius: 8,
            border: '1px solid #E0E0E0',
            padding: '0 12px',
            fontSize: 14,
            color: '#333',
            outline: 'none',
            marginBottom: 20,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px',
              background: '#F5F5F5',
              color: '#666',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E0E0E0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F5F5F5';
            }}
          >
            取消
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim()}
            style={{
              padding: '8px 20px',
              background: name.trim() ? '#4CAF50' : '#C8E6C9',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              if (name.trim()) e.currentTarget.style.background = '#5CBF60';
            }}
            onMouseLeave={(e) => {
              if (name.trim()) e.currentTarget.style.background = '#4CAF50';
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

const ThemeCard: React.FC<{
  theme: Theme;
  index: number;
  onLoad: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}> = ({ theme, index, onLoad, onDelete, onDragStart, onDragOver, onDragEnd }) => {
  const thumbCSS = formatGradientCSS(theme.stops);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onClick={onLoad}
      onContextMenu={(e) => {
        e.preventDefault();
        onDelete();
      }}
      style={{
        height: 50,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.06)',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition:
          'background-color 0.2s ease-out, transform 0.2s ease-out',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
      }}
    >
      <div
        style={{
          width: 40,
          height: 20,
          borderRadius: 4,
          background: thumbCSS,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 13,
          color: '#D0D0E0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {theme.name}
      </span>
      <span
        style={{
          fontSize: 10,
          color: '#666680',
          flexShrink: 0,
        }}
      >
        ⠿
      </span>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const {
    themes,
    sidebarOpen,
    toggleSidebar,
    saveTheme,
    deleteTheme,
    reorderThemes,
    loadTheme,
  } = useGradientStore();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      reorderThemes(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, reorderThemes]);

  const handleSave = useCallback(
    (name: string) => {
      saveTheme(name);
      setShowSaveModal(false);
    },
    [saveTheme]
  );

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteTheme(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteTheme]);

  const themeToDelete = themes.find((t) => t.id === deleteTarget);

  return (
    <>
      <button
        onClick={toggleSidebar}
        style={{
          position: 'fixed',
          top: 16,
          left: sidebarOpen ? 248 : 16,
          zIndex: 200,
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(45,45,68,0.9)',
          border: '1px solid #3E3E5E',
          color: '#E0E0E0',
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.3s ease, background-color 0.2s ease-out',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(62,62,94,0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(45,45,68,0.9)';
        }}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      <div
        className="sidebar-panel"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 240,
          height: '100vh',
          background: '#F5F5F5',
          borderRadius: '0 12px 12px 0',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          opacity: sidebarOpen ? 1 : 0,
          zIndex: 150,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: '1px solid #E0E0E0',
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#333',
              marginBottom: 12,
            }}
          >
            预设主题
          </h3>
          <button
            onClick={() => setShowSaveModal(true)}
            style={{
              width: '100%',
              padding: '8px 0',
              background: '#4CAF50',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5CBF60';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4CAF50';
            }}
          >
            + 保存当前渐变
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {themes.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: '#999',
                fontSize: 12,
                padding: '24px 0',
              }}
            >
              暂无保存的主题
            </div>
          ) : (
            themes.map((theme, index) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                index={index}
                onLoad={() => loadTheme(theme.id)}
                onDelete={() => setDeleteTarget(theme.id)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              />
            ))
          )}
        </div>

        <div
          style={{
            padding: 12,
            borderTop: '1px solid #E0E0E0',
            fontSize: 10,
            color: '#999',
            textAlign: 'center',
          }}
        >
          左键加载 · 右键删除 · 拖拽排序
        </div>
      </div>

      {showSaveModal && (
        <SaveThemeModal
          onSave={handleSave}
          onCancel={() => setShowSaveModal(false)}
        />
      )}

      {deleteTarget && themeToDelete && (
        <ConfirmModal
          message={`确定删除此主题"${themeToDelete.name}"？`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
};
