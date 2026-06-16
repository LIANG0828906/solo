import React from 'react';
import { useMusicStore, SavedFragment } from '../store/musicStore';

const SavedList: React.FC = () => {
  const { savedFragments, loadFragment, deleteFragment } = useMusicStore();

  if (savedFragments.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: '#7F8C8D',
          fontSize: 14,
        }}
      >
        暂无收藏片段。解析乐谱后点击"收藏"按钮保存。
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '12px',
        padding: '12px',
      }}
    >
      {savedFragments.map((fragment: SavedFragment) => (
        <div
          key={fragment.id}
          style={{
            width: 180,
            height: 120,
            backgroundColor: '#1E1E1E',
            borderRadius: '8px',
            padding: '12px',
            color: '#ECF0F1',
            position: 'relative',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            justifySelf: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => loadFragment(fragment.id)}
        >
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 12,
              right: 40,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={fragment.title}
          >
            {fragment.title}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`确定要删除 "${fragment.title}" 吗？`)) {
                deleteFragment(fragment.id);
              }
            }}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 24,
              height: 24,
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#7F8C8D',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E74C3C';
              e.currentTarget.style.color = '#FFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#7F8C8D';
            }}
            title="删除"
          >
            ×
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 12,
              fontSize: 11,
              color: '#95A5A6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 2,
            }}
          >
            <span>{fragment.bpm} BPM</span>
            <span>{fragment.noteCount} 音符</span>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 12,
              fontSize: 10,
              color: '#3498DB',
            }}
          >
            点击播放
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedList;
