import React, { useRef } from 'react';
import { useCollage } from '../context/CollageContext';

interface ToolbarProps {
  userName: string;
  roomId: string;
  userCount: number;
}

const Toolbar: React.FC<ToolbarProps> = ({ userName, roomId, userCount }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addLayer } = useCollage();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const maxSize = 300;
            let width = img.width;
            let height = img.height;
            if (width > height && width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
            addLayer(event.target?.result as string, width, height);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = '';
  };

  const tools = [
    { icon: '📤', label: '上传素材', onClick: handleUploadClick },
    { icon: '↶', label: '撤销', onClick: () => {} },
    { icon: '↷', label: '重做', onClick: () => {} },
    { icon: '🔍+', label: '放大', onClick: () => {} },
    { icon: '🔍-', label: '缩小', onClick: () => {} },
    { icon: '💾', label: '导出', onClick: () => {} },
  ];

  return (
    <div
      className="toolbar"
      style={{
        height: 50,
        backgroundColor: '#16213e',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
        borderBottom: '1px solid #1f2937',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 16 }}>
        <span style={{ fontSize: 22 }}>🎨</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>拼贴协作</span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {tools.map((tool, index) => (
          <button
            key={index}
            onClick={tool.onClick}
            title={tool.label}
            style={{
              minWidth: 44,
              height: 44,
              padding: '0 12px',
              border: 'none',
              borderRadius: 8,
              backgroundColor: 'transparent',
              color: '#d1d5db',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#0f3460';
              (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: 16 }}>{tool.icon}</span>
            <span style={{ fontSize: 13 }}>{tool.label}</span>
          </button>
        ))}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#1f2937',
            padding: '6px 12px',
            borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 12, color: '#9ca3af' }}>房间:</span>
          <span style={{ fontSize: 13, color: '#4ecdc4', fontFamily: 'monospace' }}>
            {roomId}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#1f2937',
            padding: '6px 12px',
            borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>👥</span>
          <span style={{ fontSize: 13, color: '#d1d5db' }}>{userCount} 在线</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#1f2937',
            padding: '6px 12px',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: '#4ecdc4',
            }}
          />
          <span style={{ fontSize: 13, color: '#fff' }}>{userName}</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default Toolbar;
