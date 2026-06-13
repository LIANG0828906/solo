import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityApi } from './api';
import { useApp } from './context/AppContext';

const BoldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 4h6a4 4 0 0 1 0 8H7z"/>
    <path d="M7 12h7a4 4 0 0 1 0 8H7z"/>
  </svg>
);

const ItalicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="4" x2="10" y2="4"/>
    <line x1="14" y1="20" x2="5" y2="20"/>
    <line x1="15" y1="4" x2="9" y2="20"/>
  </svg>
);

const ListIcon2 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const NumberedListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="6" x2="21" y2="6"/>
    <line x1="10" y1="12" x2="21" y2="12"/>
    <line x1="10" y1="18" x2="21" y2="18"/>
    <path d="M4 6h1v4"/>
    <path d="M4 10h2"/>
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const GEO_SUGGESTIONS = [
  '北京市朝阳区朝阳公园',
  '北京市海淀区颐和园',
  '北京市西城区什刹海',
  '上海市浦东新区世纪公园',
  '上海市黄浦区外滩',
  '上海市徐汇区徐家汇公园',
  '广州市天河区体育中心',
  '广州市越秀区越秀公园',
  '深圳市南山区深圳湾公园',
  '深圳市福田区莲花山公园',
  '杭州市西湖区西湖风景区',
  '成都市高新区天府绿道',
  '武汉市武昌区东湖风景区',
  '南京市玄武区玄武湖公园',
  '青岛市黄岛区金沙滩',
  '西安市雁塔区大雁塔广场',
];

const CreateActivity = () => {
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const { toast } = useApp();

  const filteredSuggestions = GEO_SUGGESTIONS.filter(
    (s) => location && s.toLowerCase().includes(location.toLowerCase())
  ).slice(0, 6);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    });
  };

  const getDescription = () => {
    return editorRef.current?.innerHTML || '';
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = '请输入活动标题';
    if (!getDescription().trim()) newErrors.description = '请输入活动描述';
    if (!date) newErrors.date = '请选择活动日期';
    if (!location.trim()) newErrors.location = '请输入活动地点';
    if (!maxParticipants) {
      newErrors.maxParticipants = '请输入最大参与人数';
    } else if (!Number.isInteger(Number(maxParticipants)) || Number(maxParticipants) < 1) {
      newErrors.maxParticipants = '参与人数必须为正整数';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast('请检查表单填写', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await activityApi.create({
        title: title.trim(),
        description: getDescription(),
        coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
        date,
        location: location.trim(),
        maxParticipants: Number(maxParticipants),
      });
      toast('活动创建成功！获得50积分 🌿', 'success');
      navigate(`/activities/${res.data.id}`);
    } catch (err: any) {
      toast(err.response?.data?.error || '创建失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🌱 发起环保活动</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            创建活动可获得 50 环保积分奖励
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 32 }}>
          <div className="form-group">
            <label className="form-label">
              活动标题 <span style={{ color: '#E07A5F' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="给活动起一个吸引人的名字"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: '' }); }}
              maxLength={60}
              style={{ borderColor: errors.title ? '#E07A5F' : undefined }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {errors.title && <span style={{ color: '#E07A5F', fontSize: 13 }}>{errors.title}</span>}
              <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 'auto' }}>{title.length}/60</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              活动描述 <span style={{ color: '#E07A5F' }}>*</span>
            </label>
            <div className="rich-editor">
              <div className="rich-toolbar">
                <button
                  type="button"
                  className={`rich-toolbar-btn ${activeFormats.bold ? 'active' : ''}`}
                  onClick={() => execCommand('bold')}
                  title="加粗"
                >
                  <BoldIcon />
                </button>
                <button
                  type="button"
                  className={`rich-toolbar-btn ${activeFormats.italic ? 'active' : ''}`}
                  onClick={() => execCommand('italic')}
                  title="斜体"
                >
                  <ItalicIcon />
                </button>
                <div style={{ width: 1, background: 'var(--forest-100)', margin: '4px 6px' }} />
                <button
                  type="button"
                  className={`rich-toolbar-btn ${activeFormats.insertUnorderedList ? 'active' : ''}`}
                  onClick={() => execCommand('insertUnorderedList')}
                  title="无序列表"
                >
                  <ListIcon2 />
                </button>
                <button
                  type="button"
                  className={`rich-toolbar-btn ${activeFormats.insertOrderedList ? 'active' : ''}`}
                  onClick={() => execCommand('insertOrderedList')}
                  title="有序列表"
                >
                  <NumberedListIcon />
                </button>
              </div>
              <div
                ref={editorRef}
                className="rich-content"
                contentEditable
                data-placeholder="详细介绍活动内容、流程、注意事项等..."
                onInput={() => { setErrors({ ...errors, description: '' }); updateActiveFormats(); }}
                onBlur={updateActiveFormats}
                style={{ minHeight: 180 }}
              />
            </div>
            {errors.description && (
              <span style={{ color: '#E07A5F', fontSize: 13, display: 'block', marginTop: 6 }}>{errors.description}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">封面图 URL（可选）</label>
            <input
              type="url"
              className="form-input"
              placeholder="https:// 图片链接，留空将使用默认封面"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
            {coverImage && (
              <div style={{ marginTop: 12 }}>
                <img
                  src={coverImage}
                  alt="封面预览"
                  style={{
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">
                活动日期时间 <span style={{ color: '#E07A5F' }}>*</span>
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={date}
                min={minDateTime}
                onChange={(e) => { setDate(e.target.value); setErrors({ ...errors, date: '' }); }}
                style={{ borderColor: errors.date ? '#E07A5F' : undefined }}
              />
              {errors.date && <span style={{ color: '#E07A5F', fontSize: 13 }}>{errors.date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                最大参与人数 <span style={{ color: '#E07A5F' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                placeholder="请输入正整数"
                value={maxParticipants}
                onChange={(e) => { setMaxParticipants(e.target.value); setErrors({ ...errors, maxParticipants: '' }); }}
                style={{ borderColor: errors.maxParticipants ? '#E07A5F' : undefined }}
              />
              {errors.maxParticipants && <span style={{ color: '#E07A5F', fontSize: 13 }}>{errors.maxParticipants}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              活动地点 <span style={{ color: '#E07A5F' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}>
                  <LocationIcon />
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="输入活动地点，选择推荐地址或自定义"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setShowSuggestions(true); setErrors({ ...errors, location: '' }); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  style={{
                    paddingLeft: 44,
                    borderColor: errors.location ? '#E07A5F' : undefined,
                  }}
                />
              </div>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="geo-suggestions">
                  {filteredSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className="geo-suggestion-item"
                      onMouseDown={() => { setLocation(s); setShowSuggestions(false); }}
                    >
                      <LocationIcon />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.location && <span style={{ color: '#E07A5F', fontSize: 13, display: 'block', marginTop: 6 }}>{errors.location}</span>}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 24,
            paddingTop: 24,
            borderTop: '1px solid var(--forest-50)',
          }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 32px' }}>
              {loading ? '创建中...' : '✨ 发布活动'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateActivity;
