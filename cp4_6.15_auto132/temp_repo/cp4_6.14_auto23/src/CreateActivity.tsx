import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityApi } from './api';
import { useApp } from './context/AppContext';

const BoldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
  </svg>
);

const ItalicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="4" x2="10" y2="4"/>
    <line x1="14" y1="20" x2="5" y2="20"/>
    <line x1="15" y1="4" x2="9" y2="20"/>
  </svg>
);

const ListULIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const ListOLIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="6" x2="21" y2="6"/>
    <line x1="10" y1="12" x2="21" y2="12"/>
    <line x1="10" y1="18" x2="21" y2="18"/>
    <path d="M4 6h1v4"/>
    <path d="M4 10H2"/>
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const GEO_SUGGESTIONS = [
  '北京市朝阳区朝阳公园',
  '北京市海淀区中关村',
  '北京市西城区西单',
  '上海市浦东新区陆家嘴',
  '上海市徐汇区衡山路',
  '广州市天河区珠江新城',
  '深圳市南山区科技园',
  '杭州市西湖区西湖',
  '成都市锦江区春熙路',
  '武汉市武昌区东湖',
  '南京市鼓楼区新街口',
  '青岛市黄岛区金沙滩',
  '西安市雁塔区大雁塔',
  '苏州市工业园区金鸡湖',
];

const CreateActivity = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [showGeo, setShowGeo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useApp();
  const navigate = useNavigate();

  const filteredSuggestions = location.trim()
    ? GEO_SUGGESTIONS.filter((s) => s.toLowerCase().includes(location.toLowerCase()))
    : [];

  const execCommand = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      setDescription(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    // 编辑器初始化后不自动填充内容，让 placeholder 生效
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = '请输入活动标题';
    if (!description || description.replace(/<[^>]*>/g, '').trim().length === 0) e.description = '请输入活动描述';
    if (!date) e.date = '请选择活动日期';
    if (!location.trim()) e.location = '请输入活动地点';
    const n = parseInt(maxParticipants, 10);
    if (!maxParticipants || isNaN(n) || n < 1 || !Number.isInteger(n)) e.maxParticipants = '请输入正整数';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast('请检查表单填写', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await activityApi.create({
        title: title.trim(),
        description,
        coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
        date,
        location: location.trim(),
        maxParticipants: parseInt(maxParticipants, 10),
      });
      toast('活动创建成功！获得50积分', 'success');
      setTimeout(() => navigate(`/activities/${res.data.id}`), 500);
    } catch (err: any) {
      toast(err.response?.data?.error || '创建失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectGeo = (s: string) => {
    setLocation(s);
    setShowGeo(false);
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🌱 发起环保活动</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            创建一个有意义的环保活动，邀请更多人一起守护地球
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 32 }}>
        <div className="form-group">
          <label className="form-label">
            活动标题 <span style={{ color: '#E07A5F' }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="例如：周末公园清洁行动"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ borderColor: errors.title ? '#E07A5F' : undefined }}
          />
          {errors.title && <p style={{ color: '#E07A5F', fontSize: 12, marginTop: 6 }}>{errors.title}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">
            活动描述 <span style={{ color: '#E07A5F' }}>*</span>
          </label>
          <div className="rich-editor" style={{ borderColor: errors.description ? '#E07A5F' : undefined }}>
            <div className="rich-toolbar">
              <button
                type="button"
                className="rich-toolbar-btn"
                onClick={() => execCommand('bold')}
                title="加粗"
              >
                <BoldIcon />
              </button>
              <button
                type="button"
                className="rich-toolbar-btn"
                onClick={() => execCommand('italic')}
                title="斜体"
              >
                <ItalicIcon />
              </button>
              <div style={{ width: 1, background: 'var(--forest-100)', margin: '4px 8px' }} />
              <button
                type="button"
                className="rich-toolbar-btn"
                onClick={() => execCommand('insertUnorderedList')}
                title="无序列表"
              >
                <ListULIcon />
              </button>
              <button
                type="button"
                className="rich-toolbar-btn"
                onClick={() => execCommand('insertOrderedList')}
                title="有序列表"
              >
                <ListOLIcon />
              </button>
            </div>
            <div
              ref={editorRef}
              className="rich-content"
              contentEditable
              suppressContentEditableWarning
              data-placeholder="请输入活动详情、集合信息、注意事项等..."
              onInput={(e) => setDescription((e.target as HTMLDivElement).innerHTML)}
              onBlur={(e) => setDescription((e.target as HTMLDivElement).innerHTML)}
              style={{ minHeight: 180 }}
            />
          </div>
          {errors.description && (
            <p style={{ color: '#E07A5F', fontSize: 12, marginTop: 6 }}>{errors.description}</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">封面图 URL（可选）</label>
          <input
            type="text"
            className="form-input"
            placeholder="粘贴图片链接，留空将使用默认封面"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
          />
          {coverImage && (
            <div style={{ marginTop: 12 }}>
              <img
                src={coverImage}
                alt="预览"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
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
              onChange={(e) => setDate(e.target.value)}
              style={{ borderColor: errors.date ? '#E07A5F' : undefined }}
            />
            {errors.date && <p style={{ color: '#E07A5F', fontSize: 12, marginTop: 6 }}>{errors.date}</p>}
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
              placeholder="例如：50"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              style={{ borderColor: errors.maxParticipants ? '#E07A5F' : undefined }}
            />
            {errors.maxParticipants && (
              <p style={{ color: '#E07A5F', fontSize: 12, marginTop: 6 }}>{errors.maxParticipants}</p>
            )}
          </div>
        </div>

        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">
            活动地点 <span style={{ color: '#E07A5F' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <MapPinIcon />
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="例如：北京市朝阳区朝阳公园南门"
              style={{ paddingLeft: 44, borderColor: errors.location ? '#E07A5F' : undefined }}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setShowGeo(true);
              }}
              onFocus={() => setShowGeo(true)}
              onBlur={() => setTimeout(() => setShowGeo(false), 200)}
            />
            {showGeo && filteredSuggestions.length > 0 && (
              <div className="geo-suggestions">
                {filteredSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className="geo-suggestion-item"
                    onMouseDown={() => selectGeo(s)}
                  >
                    <MapPinIcon />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.location && <p style={{ color: '#E07A5F', fontSize: 12, marginTop: 6 }}>{errors.location}</p>}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(-1)}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ minWidth: 140 }}
          >
            {loading ? '创建中...' : '✓ 发布活动'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateActivity;
