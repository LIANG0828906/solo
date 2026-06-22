import { useState, useRef } from 'react';
import { DataManager, EmotionType, EMOTION_META, Blessing } from '../utils/DataManager';

interface Props {
  onSubmitted: (blessing: Blessing) => void;
}

const MAX_CONTENT = 200;
const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function GuestForm({ onSubmitted }: Props) {
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState<EmotionType>('warm');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChooseFile = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError('');
    const slotsLeft = MAX_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, slotsLeft);
    const newPhotos: string[] = [];
    for (const file of list) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`图片「${file.name}」超过5MB限制`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        setError(`「${file.name}」不是图片文件`);
        continue;
      }
      try {
        const base64 = await DataManager.fileToBase64(file);
        newPhotos.push(base64);
      } catch {
        setError(`「${file.name}」读取失败`);
      }
    }
    setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!content.trim()) {
      setError('请输入祝福语');
      return;
    }
    if (content.length > MAX_CONTENT) {
      setError(`祝福语不能超过${MAX_CONTENT}字`);
      return;
    }
    try {
      setSubmitting(true);
      const b = DataManager.addBlessing({
        nickname: nickname.trim(),
        content: content.trim(),
        emotion,
        photos
      });
      onSubmitted(b);
      setNickname('');
      setContent('');
      setEmotion('warm');
      setPhotos([]);
    } catch {
      setError('发送失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="guest-form card" onSubmit={handleSubmit}>
      <div className="form-title">✉️ 写下你的祝福</div>

      <div className="form-row">
        <label className="form-label">昵称</label>
        <input
          type="text"
          className="form-input"
          placeholder="请输入你的昵称"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          maxLength={20}
        />
      </div>

      <div className="form-row">
        <label className="form-label">祝福语</label>
        <textarea
          className="form-textarea"
          placeholder="写下你想对新人说的话…"
          value={content}
          onChange={e => setContent(e.target.value.slice(0, MAX_CONTENT))}
          maxLength={MAX_CONTENT}
        />
        <div className="char-count">
          {content.length}/{MAX_CONTENT}
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">选择心情</label>
        <div className="emotion-picker">
          {(Object.keys(EMOTION_META) as EmotionType[]).map(k => {
            const m = EMOTION_META[k];
            const selected = emotion === k;
            return (
              <button
                key={k}
                type="button"
                title={m.label}
                aria-label={m.label}
                className={`emotion-btn ${selected ? 'is-selected' : ''}`}
                style={{
                  background: selected ? m.bg : '#fafafa',
                  transform: selected ? 'scale(1.2)' : 'scale(1)',
                  borderColor: selected ? m.color : 'transparent'
                }}
                onClick={() => setEmotion(k)}
              >
                <span style={{ fontSize: 22 }}>{m.emoji}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">上传照片 (最多{MAX_PHOTOS}张，单张≤5MB)</label>
        <div className="photo-preview">
          {photos.map((src, i) => (
            <div key={i} className="photo-thumb">
              <img src={src} alt="" />
              <button
                type="button"
                className="photo-remove"
                onClick={() => removePhoto(i)}
                aria-label="移除图片"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button type="button" className="photo-add" onClick={handleChooseFile} aria-label="添加图片">
              <span style={{ fontSize: 28, color: '#bbb' }}>+</span>
              <span style={{ fontSize: 11, color: '#999', marginTop: 4 }}>添加图片</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {error && <div className="form-error">{error}</div>}

      <div style={{ marginTop: 8 }}>
        <button type="submit" className="btn-gold" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? '发送中…' : '💝 发送祝福'}
        </button>
      </div>
    </form>
  );
}

export default GuestForm;
