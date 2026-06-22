import React, { useState, memo } from 'react';
import { Loader2, Image } from 'lucide-react';
import { Note, ImageNoteContent } from '../types';
import NoteBase from './NoteBase';

interface ImageNoteProps {
  note: Note;
  isDragging: boolean;
  isConnecting: boolean;
  isConnectionSource: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onContentChange: (content: ImageNoteContent) => void;
  onConnectionStart: (e: React.MouseEvent) => void;
}

const ImageNote: React.FC<ImageNoteProps> = memo(
  ({
    note,
    isDragging,
    isConnecting,
    isConnectionSource,
    onMouseDown,
    onDelete,
    onContentChange,
    onConnectionStart,
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState('');
    const content = note.content as ImageNoteContent;

    const handleDoubleClick = () => {
      setIsEditing(true);
      setImageUrl(content.url);
    };

    const handleSubmit = () => {
      setIsEditing(false);
      if (imageUrl !== content.url) {
        setIsLoading(true);
        onContentChange({ url: imageUrl });
      }
    };

    const handleImageLoad = () => {
      setIsLoading(false);
    };

    const handleImageError = () => {
      setIsLoading(false);
    };

    return (
      <NoteBase
        note={note}
        isDragging={isDragging}
        isConnecting={isConnecting}
        isConnectionSource={isConnectionSource}
        onMouseDown={onMouseDown}
        onDelete={onDelete}
        onDoubleClick={handleDoubleClick}
        onConnectionStart={onConnectionStart}
      >
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="请输入图片URL..."
              onMouseDown={(e) => e.stopPropagation()}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #EAB308',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              确认
            </button>
          </div>
        ) : content.url ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLoading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(254, 243, 199, 0.8)',
                }}
              >
                <Loader2
                  size={24}
                  color="#EAB308"
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              </div>
            )}
            <img
              src={content.url}
              alt="便签图片"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                maxWidth: '300px',
                maxHeight: '300px',
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                objectFit: 'contain',
                display: isLoading ? 'none' : 'block',
              }}
            />
          </div>
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100px',
              cursor: 'pointer',
              color: '#92400E',
              gap: '8px',
            }}
          >
            <Image size={32} />
            <span style={{ fontSize: '13px' }}>双击添加图片URL</span>
          </div>
        )}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </NoteBase>
    );
  }
);

ImageNote.displayName = 'ImageNote';

export default ImageNote;
