import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const PRESET_TAGS = ['恐龙', '公主', '冒险', '动物', '自然', '亲情', '科普', '童话'];

function RecordPage() {
  const navigate = useNavigate();
  const { addRecord, fetchAll } = useAppStore();

  const [childName, setChildName] = useState('');
  const [bookName, setBookName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName || !bookName || !date || selectedTags.length === 0 || rating === 0) {
      alert('请完整填写所有信息（包括标签和星级）');
      return;
    }
    setSubmitting(true);
    const ok = await addRecord({ childName, bookName, date, tags: selectedTags, rating });
    setSubmitting(false);
    if (ok) {
      setSuccess(true);
      await fetchAll();
      setTimeout(() => navigate('/home'), 1200);
    }
  };

  return (
    <div className="record-page">
      <div className="section-header">
        <h1 className="section-title">📝 记录阅读时光</h1>
        <p className="section-subtitle">记录越详细，推荐越精准</p>
      </div>

      {success && (
        <div className="success-banner">
          ✅ 记录成功！正在为您更新推荐列表...
        </div>
      )}

      <form className="record-form" onSubmit={handleSubmit}>
        <div className="form-left">
          <label className="form-label">兴趣标签（多选）</label>
          <div className="tags-grid">
            {PRESET_TAGS.map((tag) => {
              const selected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={'tag-btn' + (selected ? ' selected' : '')}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <p className="form-hint">
            已选 {selectedTags.length} 个标签
          </p>
        </div>

        <div className="form-right">
          <div className="form-group">
            <label className="form-label">孩子姓名</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入孩子姓名"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">绘本名称</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：好饿的毛毛虫"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">阅读日期</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">星级评价</label>
            <div className="star-rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={'star-btn' + (i < rating ? ' filled' : '')}
                  onClick={() => setRating(i + 1)}
                >
                  ★
                </button>
              ))}
              <span className="rating-text">
                {rating > 0 ? `${rating} 星` : '请选择'}
              </span>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? '提交中...' : '✨ 提交记录'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecordPage;
