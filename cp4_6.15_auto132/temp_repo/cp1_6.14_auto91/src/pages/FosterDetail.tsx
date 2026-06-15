import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFosterDetail, submitApplication, FosterFamily } from '../api';

const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六'];

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

interface DatePickerProps {
  value: string | null;
  minDate?: string;
  maxDate?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, minDate, maxDate, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(value ? parseDate(value) : new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const days = useMemo(() => {
    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const result: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      result.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
    }
    return result;
  }, [viewDate]);

  const today = formatDate(new Date());

  const handleSelect = (d: Date) => {
    const s = formatDate(d);
    if (minDate && s < minDate) return;
    if (maxDate && s > maxDate) return;
    onChange(s);
    setOpen(false);
  };

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  return (
    <div className="date-picker-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="date-input-btn"
        onClick={() => setOpen(!open)}
      >
        {value || placeholder || '选择日期'} ▾
      </button>
      {open && (
        <div className="calendar-popup">
          <div className="calendar-header">
            <button type="button" className="calendar-nav-btn" onClick={prevMonth}>‹</button>
            <div className="calendar-month">
              {viewDate.getFullYear()}年{viewDate.getMonth() + 1}月
            </div>
            <button type="button" className="calendar-nav-btn" onClick={nextMonth}>›</button>
          </div>
          <div className="calendar-grid">
            {WEEKDAY_CN.map((w) => (
              <div key={w} className="calendar-day-head">{w}</div>
            ))}
            {days.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} />;
              const s = formatDate(d);
              const isToday = s === today;
              const disabled = (minDate && s < minDate) || (maxDate && s > maxDate);
              const selected = s === value;
              return (
                <div
                  key={s}
                  className={`calendar-day ${isToday ? 'today' : ''} ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                  onClick={() => !disabled && handleSelect(d)}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="detail-rating">
      <span>
        {Array.from({ length: full }).map((_, i) => (
          <span key={`f${i}`} className="star-filled">★</span>
        ))}
        {half && <span className="star-filled">★</span>}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e${i}`} className="star-empty">★</span>
        ))}
      </span>
      <span className="detail-rating-score">{rating.toFixed(1)}</span>
    </div>
  );
};

const FosterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [family, setFamily] = useState<FosterFamily | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('猫');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getFosterDetail(id);
        if (!cancelled) setFamily(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    setSlideIndex(0);
  }, [family?.id]);

  useEffect(() => {
    if (!family || family.photos.length < 2) return;
    const t = setInterval(() => {
      setSlideIndex((i) => {
        const next = i + 1;
        return next >= family.photos.length ? 0 : next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, [family]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="loading-state">
          <div className="loading-spinner" />
          <div>正在加载寄养家庭详情...</div>
        </div>
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="page-wrapper">
        <div className="empty-state">
          <div className="empty-state-icon">😿</div>
          <div className="empty-state-text">{error || '未找到该寄养家庭'}</div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const today = formatDate(new Date());

  const photoCount = family?.photos.length || 0;

  const handlePrev = () => {
    if (photoCount < 2) return;
    setSlideIndex((i) => {
      const prev = i - 1;
      return prev < 0 ? photoCount - 1 : prev;
    });
  };

  const handleNext = () => {
    if (photoCount < 2) return;
    setSlideIndex((i) => {
      const next = i + 1;
      return next >= photoCount ? 0 : next;
    });
  };

  const canSubmit = startDate && endDate && ownerName.trim() && petName.trim() && petType;

  const handleSubmit = async () => {
    if (!canSubmit || !id) return;
    try {
      setSubmitting(true);
      await submitApplication({
        familyId: id,
        ownerName: ownerName.trim(),
        petName: petName.trim(),
        petType,
        startDate: startDate!,
        endDate: endDate!,
      });
      setShowSuccess(true);
    } catch (err: any) {
      alert(err?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const totalDays = startDate && endDate
    ? Math.max(1, Math.ceil((parseDate(endDate).getTime() - parseDate(startDate).getTime()) / 86400000) + 1)
    : 0;
  const totalFee = totalDays * family.dailyRate;

  return (
    <div className="page-wrapper">
      <button
        className="btn btn-secondary"
        style={{ marginBottom: 20 }}
        onClick={() => navigate('/')}
      >
        ← 返回列表
      </button>

      {family.photos.length > 0 && (
        <div className="carousel">
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${slideIndex * 100}%)` }}
          >
            {family.photos.map((p, i) => (
              <div key={i} className="carousel-slide">
                <img
                  src={p}
                  alt={`${family.name} 环境 ${i + 1}`}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="%23eee"/><text x="50%" y="50%" font-size="32" fill="%23999" text-anchor="middle" font-family="sans-serif">图片加载失败</text></svg>';
                  }}
                />
              </div>
            ))}
          </div>
          {family.photos.length > 1 && (
            <>
              <button className="carousel-btn prev" onClick={handlePrev} aria-label="上一张">‹</button>
              <button className="carousel-btn next" onClick={handleNext} aria-label="下一张">›</button>
              <div className="carousel-dots">
                {family.photos.map((_, i) => (
                  <button
                    key={i}
                    className={`carousel-dot ${i === slideIndex ? 'active' : ''}`}
                    onClick={() => setSlideIndex(i)}
                    aria-label={`第 ${i + 1} 张`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="detail-header">
        <div>
          <div className="detail-title-row">
            <h1 className="detail-name">{family.name}</h1>
            <div className="detail-badges">
              {family.verified && <span className="badge badge-verified">✓ 已通过平台认证</span>}
              <span className="badge badge-count">🏆 已寄养 {family.fosterCount} 次</span>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <StarRating rating={family.rating} />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--orange-primary)' }}>
            ¥{family.dailyRate} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>/天</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">📝 家庭简介</div>
        <p className="detail-description">{family.description}</p>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">🏷️ 可接收宠物类型</div>
        <div className="foster-tags">
          {family.petTypes.map((t) => (
            <span key={t} className="foster-tag" style={{ background: 'var(--cream-dark)', color: 'var(--wood-dark)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">✨ 可提供服务</div>
        <div className="services-list">
          {family.services.map((s) => (
            <div key={s} className="service-item">
              <span className="service-check">✓</span>
              <span>{s}</span>
            </div>
          ))}
          {family.walkDuration && (
            <div className="service-item">
              <span className="service-check">✓</span>
              <span>每日遛弯 {family.walkDuration}</span>
            </div>
          )}
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">📅 提交寄养申请</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">您的姓名</label>
            <input
              className="form-input"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="请输入您的姓名"
            />
          </div>
          <div className="form-group">
            <label className="form-label">宠物名字</label>
            <input
              className="form-input"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="请输入宠物名字"
            />
          </div>
          <div className="form-group">
            <label className="form-label">宠物类型</label>
            <select
              className="form-select"
              value={petType}
              onChange={(e) => setPetType(e.target.value)}
            >
              {['猫', '狗', '仓鼠', '兔子', '龙猫', '鹦鹉', '其他'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="date-row">
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="date-label">寄养开始日期</div>
            <DatePicker
              value={startDate}
              minDate={today}
              onChange={(v) => {
                setStartDate(v);
                if (endDate && v > endDate) setEndDate(null);
              }}
              placeholder="请选择开始日期"
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="date-label">寄养结束日期</div>
            <DatePicker
              value={endDate}
              minDate={startDate || today}
              onChange={setEndDate}
              placeholder="请选择结束日期"
            />
          </div>
          {totalDays > 0 && (
            <div style={{ padding: '10px 18px', background: 'var(--cream-dark)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>共 {totalDays} 天</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--wood-dark)' }}>¥{totalFee}</div>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? <span className="spinner" /> : null}
          {submitting ? '提交中...' : '提交寄养申请'}
        </button>
      </div>

      {showSuccess && (
        <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">✓</div>
            <div className="modal-title">申请已提交！</div>
            <div className="modal-message">
              您的寄养申请已成功发送给 {family.name}。<br />
              寄养家庭会在24小时内与您联系确认。
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowSuccess(false)}>
                继续浏览
              </button>
              <button className="btn btn-primary" onClick={() => { setShowSuccess(false); navigate('/'); }}>
                返回首页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FosterDetail;
