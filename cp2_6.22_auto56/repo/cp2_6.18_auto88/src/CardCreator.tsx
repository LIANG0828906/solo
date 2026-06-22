import React, { useState, useRef, useEffect } from 'react';
import { CardType, useCardStore } from './store';

interface CardCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPosition: { x: number; y: number };
}

export default function CardCreator({ isOpen, onClose, defaultPosition }: CardCreatorProps) {
  const [cardType, setCardType] = useState<CardType>('text');
  const [textContent, setTextContent] = useState('');
  const [todoContent, setTodoContent] = useState('');
  const [todoChecked, setTodoChecked] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const addCard = useCardStore((state) => state.addCard);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCardType('text');
      setTextContent('');
      setTodoContent('');
      setTodoChecked(false);
      setImageUrl('');
      setIsRecording(false);
      setAudioUrl('');
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleConfirm = () => {
    const baseCard = {
      type: cardType,
      content: '',
      position: defaultPosition,
      rotation: 0,
    };

    switch (cardType) {
      case 'text':
        if (!textContent.trim()) return;
        addCard({ ...baseCard, content: textContent });
        break;
      case 'image':
        if (!imageUrl) return;
        addCard({ ...baseCard, content: '', imageUrl });
        break;
      case 'voice':
        if (!audioUrl) return;
        addCard({ ...baseCard, content: '', audioUrl });
        break;
      case 'todo':
        if (!todoContent.trim()) return;
        addCard({ ...baseCard, content: todoContent, checked: todoChecked });
        break;
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'opacity 0.3s ease-in',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>
          新建卡片
        </h3>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {(['text', 'image', 'voice', 'todo'] as CardType[]).map((type) => (
            <button
              key={type}
              onClick={() => setCardType(type)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: cardType === type ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                backgroundColor: cardType === type ? '#EFF6FF' : 'white',
                color: cardType === type ? '#3B82F6' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {type === 'text' ? '文本' : type === 'image' ? '图片' : type === 'voice' ? '语音' : '待办'}
            </button>
          ))}
        </div>

        {cardType === 'text' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
              文本内容
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="输入文本内容..."
              style={{
                width: '100%',
                height: '120px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
              onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
            />
          </div>
        )}

        {cardType === 'image' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
              上传图片
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                border: `2px dashed ${isDragging ? '#3B82F6' : '#D1D5DB'}`,
                backgroundColor: isDragging ? '#EFF6FF' : '#F9FAFB',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {imageUrl ? (
                <div>
                  <img src={imageUrl} alt="Preview" style={{ maxHeight: '150px', borderRadius: '8px' }} />
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>点击更换图片</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>拖放图片到此处，或点击选择文件</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>支持 JPG、PNG、GIF 格式</p>
                </div>
              )}
            </div>
          </div>
        )}

        {cardType === 'voice' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
              语音录制
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: isRecording ? '#6B7280' : '#EF4444',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {isRecording ? '■' : '●'}
              </button>
              <div style={{ flex: 1 }}>
                {audioUrl ? (
                  <div>
                    <p style={{ fontSize: '14px', color: '#059669', marginBottom: '8px' }}>✓ 录音完成</p>
                    <audio controls src={audioUrl} style={{ width: '100%' }} />
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>
                    {isRecording ? '正在录音...点击停止' : '点击按钮开始录音'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {cardType === 'todo' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
              待办事项
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={todoChecked}
                onChange={(e) => setTodoChecked(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#3B82F6',
                }}
              />
              <input
                type="text"
                value={todoContent}
                onChange={(e) => setTodoContent(e.target.value)}
                placeholder="输入待办内容..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#3B82F6',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s ease',
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
