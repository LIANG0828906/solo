import React, { useState, useRef, useEffect } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';

const editorStyle: React.CSSProperties = {
  width: 400,
  backgroundColor: '#FDF6E3',
  borderRadius: 12,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxShadow: '0 4px 16px rgba(224, 208, 188, 0.3)',
  maxHeight: '100vh',
  overflowY: 'auto',
  flexShrink: 0,
};

const inputBaseStyle: React.CSSProperties = {
  border: '2px solid #D4A373',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  backgroundColor: '#FFFBF0',
  color: '#5C4033',
  outline: 'none',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
};

const MapPinIcon = ({ bounce }: { bounce: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#C9733F"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transition: 'transform 0.2s ease', transform: bounce ? 'translateY(-3px)' : 'translateY(0)' }}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#C9733F' : 'none'} stroke="#C9733F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B7A63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B7A63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const EventEditor: React.FC = () => {
  const { events, selectedEventId, addEvent, updateEvent, deleteEvent } = useTimelineStore();
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [location, setLocation] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [titleFocused, setTitleFocused] = useState(false);
  const [locationBounce, setLocationBounce] = useState(false);
  const [cursorBlink, setCursorBlink] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      const d = new Date(selectedEvent.date);
      setYear(d.getFullYear());
      setMonth(d.getMonth() + 1);
      setDay(d.getDate());
      setLocation(selectedEvent.location);
      setTags(selectedEvent.tags);
      setContent(selectedEvent.content);
      setImages(selectedEvent.images);
      setIsPublic(selectedEvent.isPublic);
    } else {
      resetForm();
    }
  }, [selectedEventId]);

  const resetForm = () => {
    setTitle('');
    setYear(new Date().getFullYear());
    setMonth(new Date().getMonth() + 1);
    setDay(new Date().getDate());
    setLocation('');
    setTags([]);
    setContent('');
    setImages([]);
    setIsPublic(true);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    Array.from(files).forEach(file => {
      if (images.length >= 3) return;
      if (!allowedTypes.includes(file.type)) return;
      if (file.size > maxSize) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setImages(prev => [...prev, result].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const eventData = {
      title: title.trim(),
      date: dateStr,
      location: location.trim(),
      tags,
      content: content.trim(),
      images,
      isPublic,
      userId: 'user0',
      authorName: '我',
      authorAvatar: '',
    };

    if (selectedEventId) {
      await updateEvent(selectedEventId, eventData);
    } else {
      await addEvent(eventData);
    }
    resetForm();
    useTimelineStore.getState().setSelectedEvent(null);
  };

  const handleDelete = async () => {
    if (selectedEventId && confirm('确定要删除这个事件吗？')) {
      await deleteEvent(selectedEventId);
      resetForm();
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
    if (e.target.value) {
      setLocationBounce(true);
      setTimeout(() => setLocationBounce(false), 300);
    }
  };

  const handleContentFocus = () => setCursorBlink(true);
  const handleContentBlur = () => setCursorBlink(false);

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <form style={editorStyle} onSubmit={handleSubmit} className="stagger-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ color: '#5C4033', fontSize: 20, fontWeight: 700 }}>
          {selectedEventId ? '编辑事件' : '新建事件'}
        </h2>
        {selectedEventId && (
          <button
            type="button"
            onClick={handleDelete}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #C9733F',
              borderRadius: 8,
              color: '#C9733F',
              cursor: 'pointer',
              fontSize: 12,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C9733F'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#C9733F'; }}
          >
            <TrashIcon /> 删除
          </button>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <label style={{ display: 'block', fontSize: 13, color: '#8B7A63', marginBottom: 6, fontWeight: 500 }}>事件标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
          placeholder="给这个时刻起个名字..."
          style={{
            ...inputBaseStyle,
            width: '100%',
            height: 40,
            border: titleFocused ? '2px solid transparent' : '2px solid #D4A373',
            backgroundImage: titleFocused ? 'linear-gradient(#FDF6E3, #FDF6E3), linear-gradient(90deg, #D4A373, #E6B98A, #D4A373)' : undefined,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            backgroundSize: titleFocused ? '200% 100%' : undefined,
            animation: titleFocused ? 'gradientShift 2s linear infinite' : undefined,
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, color: '#8B7A63', marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarIcon /> 日期
        </label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            style={{ ...inputBaseStyle, flex: 1, cursor: 'pointer' }}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="range"
              min="1"
              max="12"
              value={month}
              onChange={(e) => {
                const m = parseInt(e.target.value);
                setMonth(m);
                if (day > new Date(year, m, 0).getDate()) {
                  setDay(new Date(year, m, 0).getDate());
                }
              }}
              style={{
                width: 200,
                height: 6,
                borderRadius: 3,
                background: `linear-gradient(to right, #D4A373 0%, #D4A373 ${(month - 1) / 11 * 100}%, #E0D0BC ${(month - 1) / 11 * 100}%, #E0D0BC 100%)`,
                appearance: 'none',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <span style={{ color: '#5C4033', fontSize: 14, minWidth: 30, textAlign: 'center' }}>{month}月</span>
          </div>
          <select
            value={day}
            onChange={(e) => setDay(parseInt(e.target.value))}
            style={{ ...inputBaseStyle, width: 70, cursor: 'pointer' }}
          >
            {days.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, color: '#8B7A63', marginBottom: 6, fontWeight: 500 }}>地点</label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            <MapPinIcon bounce={locationBounce} />
          </div>
          <input
            type="text"
            value={location}
            onChange={handleLocationChange}
            placeholder="发生在哪里？"
            style={{
              ...inputBaseStyle,
              width: '100%',
              paddingLeft: 40,
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, color: '#8B7A63', marginBottom: 6, fontWeight: 500 }}>标签</label>
        <div
          style={{
            ...inputBaseStyle,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            minHeight: 44,
            alignItems: 'center',
            padding: '6px 10px',
          }}
        >
          {tags.map(tag => (
            <span
              key={tag}
              className="tag-fade-in"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                backgroundColor: '#F5E6CA',
                color: '#5C4033',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8B7A63',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#C9733F'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8B7A63'; }}
              >
                <XIcon />
              </button>
            </span>
          ))}
          <input
            ref={tagInputRef}
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={handleAddTag}
            placeholder={tags.length === 0 ? '添加标签...' : ''}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              color: '#5C4033',
              flex: 1,
              minWidth: 80,
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, color: '#8B7A63', marginBottom: 6, fontWeight: 500 }}>故事内容</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={handleContentFocus}
          onBlur={handleContentBlur}
          placeholder="记录下这一刻的感受和故事..."
          style={{
            width: 400 - 48,
            height: 160,
            backgroundColor: '#F5ECD6',
            borderRadius: 8,
            border: '2px solid transparent',
            padding: 12,
            fontSize: 14,
            color: '#5C4033',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.6,
            transition: 'border-color 0.2s',
          }}
        />
        {cursorBlink && !content && (
          <div style={{ position: 'absolute', marginTop: -148, marginLeft: 12, pointerEvents: 'none' }}>
            <span className="cursor-blink" style={{ color: '#5C4033', fontSize: 14 }}></span>
          </div>
        )}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, color: '#8B7A63', marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ImageIcon /> 图片 ({images.length}/3)
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className="tag-fade-in"
              style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(224, 208, 188, 0.5)' }}
            >
              <img src={img} alt={`上传的图片 ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="delete-hover"
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(92, 64, 51, 0.8)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.7,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.animation = 'heartFill 0.3s'; }}
              >
                <XIcon />
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                border: '2px dashed #D4A373',
                backgroundColor: 'rgba(253, 246, 227, 0.5)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D4A373',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5E6CA'; e.currentTarget.style.borderColor = '#C9733F'; e.currentTarget.style.color = '#C9733F'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(253, 246, 227, 0.5)'; e.currentTarget.style.borderColor = '#D4A373'; e.currentTarget.style.color = '#D4A373'; }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <label style={{ fontSize: 13, color: '#8B7A63', fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{ marginRight: 8, accentColor: '#C9733F', width: 16, height: 16, cursor: 'pointer' }}
          />
          公开到社区广场
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          type="submit"
          style={{
            flex: 1,
            height: 44,
            backgroundColor: '#C9733F',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(201, 115, 63, 0.3)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B56534'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C9733F'; e.currentTarget.style.transform = 'translateY(0)'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {selectedEventId ? '保存修改' : '创建事件'}
        </button>
        {selectedEventId && (
          <button
            type="button"
            onClick={() => { resetForm(); useTimelineStore.getState().setSelectedEvent(null); }}
            style={{
              padding: '0 20px',
              height: 44,
              backgroundColor: '#F5E6CA',
              color: '#5C4033',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E6D0A8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F5E6CA'; }}
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
};
