import { useState, useRef, ChangeEvent } from 'react';
import type { Movie, Category, WatchRecord } from './types';
import { ALL_CATEGORIES } from './types';
import StarRating from './StarRating';

interface MovieFormProps {
  editingMovie: Movie | null;
  onCancel: () => void;
  onSave: (movie: Movie) => void;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const CROP_RATIO = 2 / 3;

function cropImageToRatio(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片加载失败'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const iw = img.width;
        const ih = img.height;
        const srcRatio = iw / ih;
        let sx = 0,
          sy = 0,
          sw = iw,
          sh = ih;
        if (srcRatio > CROP_RATIO) {
          sw = ih * CROP_RATIO;
          sx = (iw - sw) / 2;
        } else {
          sh = iw / CROP_RATIO;
          sy = (ih - sh) / 2;
        }
        const targetW = 400;
        const targetH = targetW / CROP_RATIO;
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas不可用'));
          return;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function MovieForm({ editingMovie, onCancel, onSave }: MovieFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [poster, setPoster] = useState<string>(editingMovie?.poster || '');
  const [titleCn, setTitleCn] = useState(editingMovie?.titleCn || '');
  const [titleEn, setTitleEn] = useState(editingMovie?.titleEn || '');
  const [director, setDirector] = useState(editingMovie?.director || '');
  const [year, setYear] = useState<number | ''>(editingMovie?.year || '');
  const [watchDate, setWatchDate] = useState(editingMovie?.watchDate || todayStr());
  const [rating, setRating] = useState(editingMovie?.rating || 0);
  const [comment, setComment] = useState(editingMovie?.comment || '');
  const [categories, setCategories] = useState<Category[]>(editingMovie?.categories || []);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleCategory = (c: Category) => {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const fileName = file.name.toLowerCase();
    const hasImageExt = /\.(png|jpe?g|webp|gif|bmp)$/i.test(fileName);

    if (!file.type.startsWith('image/') && !hasImageExt) {
      alert(`不支持的文件格式：${file.type || fileName.split('.').pop()?.toUpperCase() || '未知'}\n请选择 PNG、JPG、WEBP、GIF 等图片格式`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type) && !hasImageExt) {
      alert(`不支持的图片格式：${file.type || '未知'}\n请选择 PNG、JPG、WEBP 或 GIF 格式`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      alert(`图片文件过大：${sizeMB}MB\n请选择不超过 5MB 的图片`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const cropped = await cropImageToRatio(file);
      setPoster(cropped);
    } catch (err) {
      console.error(err);
      alert('图片处理失败，请尝试其他图片');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!titleCn.trim()) errs.titleCn = '请输入中文片名';
    if (!director.trim()) errs.director = '请输入导演名称';
    if (!year || year < 1888 || year > new Date().getFullYear() + 5)
      errs.year = '请输入有效的年份';
    if (!watchDate) errs.watchDate = '请选择观看日期';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    let watchHistory: WatchRecord[] = editingMovie?.watchHistory || [];
    if (editingMovie) {
      const dateChanged = editingMovie.watchDate !== watchDate;
      const ratingChanged = editingMovie.rating !== rating;
      const commentChanged = editingMovie.comment !== comment;
      if (dateChanged || ratingChanged || commentChanged) {
        const oldRecord: WatchRecord = {
          id: uid(),
          date: editingMovie.watchDate,
          comment: editingMovie.comment,
          rating: editingMovie.rating,
        };
        watchHistory = [...watchHistory, oldRecord];
      }
    }

    const finalPoster =
      poster ||
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
        `movie poster, cinematic, ${titleCn || titleEn || 'film'}, dark mood, dramatic lighting`
      )}&image_size=portrait_2_3`;

    const movie: Movie = {
      id: editingMovie?.id || uid(),
      poster: finalPoster,
      titleCn: titleCn.trim(),
      titleEn: titleEn.trim(),
      director: director.trim(),
      year: Number(year),
      watchDate,
      rating,
      comment,
      categories,
      watchHistory,
    };

    setTimeout(() => {
      onSave(movie);
      setSubmitting(false);
    }, 150);
  };

  return (
    <div className="form-container">
      <div className="back-btn" onClick={onCancel}>
        <span>←</span>
        <span>返回</span>
      </div>

      <div className="glass form-card">
        <div
          className="page-title"
          style={{ marginBottom: 24, fontSize: 24 }}
        >
          {editingMovie ? '编辑电影' : '添加新电影'}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>电影海报（2:3 自动裁切）</label>
              <div
                className="poster-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                {poster ? (
                  <>
                    <img src={poster} alt="海报预览" />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '12px',
                        background:
                          'linear-gradient(transparent, rgba(0,0,0,0.75))',
                        fontSize: 13,
                        textAlign: 'center',
                      }}
                    >
                      点击更换海报
                    </div>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">🖼️</div>
                    <div className="poster-upload-hint">
                      点击上传本地图片
                      <br />
                      将自动按 2:3 比例居中裁切
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="form-group">
                <label>
                  中文片名 <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="text"
                  value={titleCn}
                  onChange={(e) => setTitleCn(e.target.value)}
                  placeholder="例如：星际穿越"
                />
                {errors.titleCn && (
                  <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                    {errors.titleCn}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>英文片名（可选）</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="例如：Interstellar"
                />
              </div>

              <div className="form-group">
                <label>
                  导演 <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="text"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  placeholder="例如：克里斯托弗·诺兰"
                />
                {errors.director && (
                  <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                    {errors.director}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>
                  上映年份 <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="number"
                  value={year}
                  min={1888}
                  max={new Date().getFullYear() + 5}
                  onChange={(e) =>
                    setYear(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="例如：2014"
                />
                {errors.year && (
                  <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                    {errors.year}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group full">
              <label>
                观看日期 <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="date"
                value={watchDate}
                onChange={(e) => setWatchDate(e.target.value)}
                max={todayStr()}
              />
              {errors.watchDate && (
                <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                  {errors.watchDate}
                </div>
              )}
            </div>

            <div className="form-group full">
              <label>个人评分（1-10 分，点击星标评分）</label>
              <div style={{ padding: '4px 0' }}>
                <StarRating rating={rating} onChange={setRating} size="lg" />
              </div>
            </div>

            <div className="form-group full">
              <label>分类标签（可多选）</label>
              <div className="category-chips">
                {ALL_CATEGORIES.map((c) => (
                  <div
                    key={c}
                    className={`chip ${categories.includes(c) ? 'active' : ''}`}
                    onClick={() => toggleCategory(c)}
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group full">
              <label>观影评论（最多 500 字）</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="写下你的观影感受、喜欢的片段、难忘的台词..."
                rows={6}
              />
              <div
                className={`char-count ${comment.length > 450 ? 'warning' : ''}`}
              >
                {comment.length} / 500
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              取消
            </button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? '保存中...' : editingMovie ? '保存修改' : '添加电影'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
