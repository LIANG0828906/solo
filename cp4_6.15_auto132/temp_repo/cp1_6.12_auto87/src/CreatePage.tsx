import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dateTime: '',
    location: '',
    welcomeMessage: '',
  });
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ code: string; shareLink: string } | null>(null);
  const [toast, setToast] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [monthAnimating, setMonthAnimating] = useState<'prev' | 'next' | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2300);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('图片大小不能超过8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBackgroundImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入活动名称';
    if (!formData.dateTime) newErrors.dateTime = '请选择活动日期和时间';
    if (!formData.location.trim()) newErrors.location = '请输入活动地点';
    if (!formData.welcomeMessage.trim()) newErrors.welcomeMessage = '请输入欢迎语';
    if (!backgroundImage) newErrors.backgroundImage = '请上传氛围图片';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('请填写所有必填项');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          backgroundImage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreated({ code: data.event.code, shareLink: `${window.location.origin}/event/${data.event.code}` });
      } else {
        showToast(data.error || '创建失败，请重试');
      }
    } catch (err) {
      showToast('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label}已复制`);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast(`${label}已复制`);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const changeMonth = (dir: -1 | 1) => {
    setMonthAnimating(dir === 1 ? 'next' : 'prev');
    setTimeout(() => {
      setCurrentMonth((prev) => {
        let { year, month } = prev;
        month += dir;
        if (month < 0) { month = 11; year--; }
        if (month > 11) { month = 0; year++; }
        return { year, month };
      });
      setMonthAnimating(null);
    }, 200);
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
    const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    const selectedDate = formData.dateTime ? formData.dateTime.split('T')[0] : '';
    const today = new Date().toISOString().split('T')[0];

    return (
      <div className="date-picker-wrapper">
        <div className="calendar-header">
          <button type="button" className="month-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
          <div className={`calendar-month-label ${monthAnimating ? `anim-${monthAnimating}` : ''}`}>
            {currentMonth.year}年 {monthNames[currentMonth.month]}
          </div>
          <button type="button" className="month-nav-btn" onClick={() => changeMonth(1)}>›</button>
        </div>
        <div className="calendar-grid-header">
          {weekDays.map((d) => <div key={d} className="calendar-weekday">{d}</div>)}
        </div>
        <div className="calendar-grid">
          {days.map((d, i) => {
            if (d === null) return <div key={i} className="calendar-cell empty" />;
            const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isPast = dateStr < today;
            return (
              <button
                key={i}
                type="button"
                className={`calendar-cell ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`}
                disabled={isPast}
                onClick={() => {
                  const currentTime = formData.dateTime ? formData.dateTime.split('T')[1] : '18:00';
                  handleChange('dateTime', `${dateStr}T${currentTime}`);
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
        {formData.dateTime && (
          <div className="time-input-row">
            <label>时间：</label>
            <input
              type="time"
              value={formData.dateTime.split('T')[1] || ''}
              onChange={(e) => {
                const date = formData.dateTime.split('T')[0];
                handleChange('dateTime', `${date}T${e.target.value}`);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-wrapper create-page">
      <div className="page-header">
        <h1 className="rounded-title">🍸 创建团队酒会</h1>
        <p className="subtitle">轻松筹办，快乐相聚</p>
      </div>

      {!created ? (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>活动名称 *</label>
            <input
              type="text"
              placeholder="例如：2026年会庆典 · 春日茶话会"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label>活动日期与时间 *</label>
            {renderCalendar()}
            {errors.dateTime && <p className="error-text">{errors.dateTime}</p>}
          </div>

          <div className="form-group">
            <label>活动地点 *</label>
            <input
              type="text"
              placeholder="例如：公司大会议室 · 外滩8号包厢"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className={errors.location ? 'error' : ''}
            />
            {errors.location && <p className="error-text">{errors.location}</p>}
          </div>

          <div className="form-group">
            <label>欢迎语 *</label>
            <textarea
              rows={3}
              placeholder="写一段温暖的欢迎语，邀请大家共赴美好时光~"
              value={formData.welcomeMessage}
              onChange={(e) => handleChange('welcomeMessage', e.target.value)}
              className={errors.welcomeMessage ? 'error' : ''}
            />
            {errors.welcomeMessage && <p className="error-text">{errors.welcomeMessage}</p>}
          </div>

          <div className="form-group">
            <label>氛围图片 *</label>
            <div
              className={`image-upload-area ${backgroundImage ? 'has-image' : ''} ${errors.backgroundImage ? 'error' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {backgroundImage ? (
                <>
                  <img src={backgroundImage} alt="preview" />
                  <div className="image-overlay">
                    <span>点击更换图片</span>
                  </div>
                </>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📸</div>
                  <p>点击或拖拽上传一张氛围图片</p>
                  <p className="upload-hint">建议尺寸 1920×1080，支持 JPG/PNG</p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            {errors.backgroundImage && <p className="error-text">{errors.backgroundImage}</p>}
          </div>

          <button type="submit" className="primary-btn submit-btn" disabled={loading}>
            {loading ? '创建中...' : '✨ 生成邀请码'}
          </button>
        </form>
      ) : (
        <div className="card result-card fade-in">
          <div className="result-header">
            <div className="success-icon">🎉</div>
            <h2>活动创建成功！</h2>
            <p>将下方邀请码或链接分享给团队成员即可开始投票</p>
          </div>

          <div className="result-section">
            <label>📌 活动邀请码</label>
            <div className="copy-row">
              <div className="code-display">{created.code}</div>
              <button
                type="button"
                className="primary-btn copy-btn"
                onClick={() => copyToClipboard(created.code, '邀请码')}
              >
                复制邀请码
              </button>
            </div>
          </div>

          <div className="result-section">
            <label>🔗 分享链接</label>
            <div className="copy-row">
              <input type="text" readOnly value={created.shareLink} className="link-input" />
              <button
                type="button"
                className="primary-btn copy-btn"
                onClick={() => copyToClipboard(created.shareLink, '链接')}
              >
                复制链接
              </button>
            </div>
          </div>

          <div className="result-actions">
            <button
              type="button"
              className="primary-btn go-event-btn"
              onClick={() => navigate(`/event/${created.code}`)}
            >
              立即进入活动页 →
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setCreated(null);
                setFormData({ name: '', dateTime: '', location: '', welcomeMessage: '' });
                setBackgroundImage('');
              }}
            >
              创建另一个活动
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast toast-enter">
          ✓ {toast}
        </div>
      )}
    </div>
  );
};

export default CreatePage;
