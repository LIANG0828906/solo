import React, { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; cover: string }) => void;
  submitting?: boolean;
}

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #e94560 0%, #0f3460 100%)',
];

export const CreateModal: React.FC<Props> = ({ open, onClose, onSubmit, submitting }) => {
  const [title, setTitle] = useState('');
  const [cover, setCover] = useState('');
  const [closing, setClosing] = useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle('');
      setCover('');
      setClosing(false);
    }
  }, [open]);

  if (!open) return null;

  const closeAnimated = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const finalCover =
      cover || `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>${(() => {
          const g = gradients[Math.floor(Math.random() * gradients.length)];
          const match = g.match(/#([0-9a-f]{6})/gi);
          if (!match) return "<stop offset='0%' stop-color='#0f3460'/><stop offset='100%' stop-color='#e94560'/>";
          return `<stop offset='0%' stop-color='${match[0]}'/><stop offset='100%' stop-color='${match[1] || match[0]}'/>`;
        })()}</linearGradient></defs><rect width='400' height='300' fill='url(%23g)'/><text x='50%' y='54%' fill='white' font-size='48' font-family='sans-serif' font-weight='bold' text-anchor='middle' opacity='0.9'>${title
          .trim()
          .slice(0, 2)
          .toUpperCase()}</text></svg>`
      )}`;
    onSubmit({ title: title.trim(), cover: finalCover });
  };

  return (
    <div className={`modal-mask ${closing ? 'closing' : ''}`} onClick={closeAnimated}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">创建新故事板</h3>
        <div className="form-group">
          <label>故事板标题</label>
          <input
            autoFocus
            placeholder="例如：四季插画集 · 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
        </div>
        <div className="form-group">
          <label>封面图片 URL（可选，留空自动生成占位色块）</label>
          <div className="cover-preview">
            {cover ? <img src={cover} alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /> : <span>自动生成渐变占位封面</span>}
          </div>
          <input placeholder="https://..." value={cover} onChange={(e) => setCover(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={closeAnimated} disabled={submitting}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? '创建中…' : '创建并编辑'}
          </button>
        </div>
      </div>
    </div>
  );
};
