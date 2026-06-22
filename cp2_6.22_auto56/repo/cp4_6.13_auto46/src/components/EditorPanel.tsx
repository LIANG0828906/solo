import { useAppStore } from '@/store/useAppStore';
import { TEMPLATE_OPTIONS } from '@/types';
import { clamp } from '@/utils/helpers';
import styles from './EditorPanel.module.css';

interface Props {
  onAddToPortfolio?: () => void;
  onExport?: () => void;
}

export default function EditorPanel({ onAddToPortfolio, onExport }: Props) {
  const currentLayout = useAppStore((s) => s.currentLayout);
  const updateLayout = useAppStore((s) => s.updateLayout);
  const photos = useAppStore((s) => s.photos);
  const portfolios = useAppStore((s) => s.portfolios);
  const currentPhotoId = useAppStore((s) => s.currentPhotoId);
  const addPhotoToPortfolio = useAppStore((s) => s.addPhotoToPortfolio);
  const createPortfolio = useAppStore((s) => s.createPortfolio);
  const currentPhoto = photos.find((p) => p.id === currentPhotoId);

  const handleMargin = (v: number) => updateLayout({ margin: clamp(v, 0, 50) });
  const handleRadius = (v: number) => updateLayout({ borderRadius: clamp(v, 0, 20) });

  const handleAdd = (portfolioId: string) => {
    if (!currentPhotoId) return;
    addPhotoToPortfolio(portfolioId, currentPhotoId);
    alert('已添加到作品集');
  };

  const handleNewPortfolio = () => {
    const id = createPortfolio();
    if (currentPhotoId) addPhotoToPortfolio(id, currentPhotoId);
    alert('已创建新作品集并添加');
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>排版编辑</h3>
        {currentPhoto && <div className={styles.photoName}>{currentPhoto.title}</div>}
      </div>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>排版模板</div>
        <div className={styles.templateGrid}>
          {TEMPLATE_OPTIONS.map((t) => (
            <button
              key={t.id}
              className={`${styles.templateCard} ${currentLayout.templateType === t.id ? styles.active : ''}`}
              onClick={() => updateLayout({ templateType: t.id, subStyle: 0 })}
            >
              <TemplatePreview type={t.id} />
              <div className={styles.tplName}>{t.name}</div>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>子样式</div>
        <div className={styles.subList}>
          {TEMPLATE_OPTIONS.find((t) => t.id === currentLayout.templateType)?.subStyles.map((name, idx) => (
            <button
              key={idx}
              className={`${styles.subBtn} ${currentLayout.subStyle === idx ? styles.subActive : ''}`}
              onClick={() => updateLayout({ subStyle: idx })}
            >
              <span className={styles.subDot} />
              {name}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>参数微调</div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>
            <span>边距</span>
            <em>{currentLayout.margin}px</em>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            value={currentLayout.margin}
            onChange={(e) => handleMargin(Number(e.target.value))}
            className={styles.range}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>
            <span>圆角</span>
            <em>{currentLayout.borderRadius}px</em>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={currentLayout.borderRadius}
            onChange={(e) => handleRadius(Number(e.target.value))}
            className={styles.range}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>
            <span>边框 / 背景色</span>
            <em style={{ color: currentLayout.borderColor }}>■ {currentLayout.borderColor}</em>
          </div>
          <div className={styles.colorRow}>
            <input
              type="color"
              value={currentLayout.borderColor}
              onChange={(e) => updateLayout({ borderColor: e.target.value })}
              className={styles.colorPicker}
            />
            <div className={styles.colorPresets}>
              {['#FFFFFF', '#F5F1E8', '#2D2D2D', '#E8DED1', '#4A90D9', '#000000'].map((c) => (
                <button
                  key={c}
                  className={styles.colorDot}
                  style={{ backgroundColor: c }}
                  onClick={() => updateLayout({ borderColor: c })}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>加入作品集</div>
        {portfolios.length === 0 ? (
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleNewPortfolio}>
            创建新作品集
          </button>
        ) : (
          <div className={styles.pfList}>
            {portfolios.map((p) => (
              <button
                key={p.id}
                className={styles.pfItem}
                onClick={() => handleAdd(p.id)}
              >
                <span className={styles.pfDot} />
                <span className={styles.pfName}>{p.title}</span>
                <span className={styles.pfCount}>{p.items.length} 张</span>
              </button>
            ))}
            <button className={styles.pfNew} onClick={handleNewPortfolio}>
              + 创建新作品集
            </button>
          </div>
        )}
      </section>

      <div className={styles.actions}>
        {onAddToPortfolio && (
          <button className="btn btn-outline" onClick={onAddToPortfolio}>
            作品集管理
          </button>
        )}
        {onExport && (
          <button className="btn btn-primary" onClick={onExport}>
            导出排版
          </button>
        )}
      </div>
    </aside>
  );
}

function TemplatePreview({ type }: { type: 'full' | 'border' | 'spread' }) {
  return (
    <svg viewBox="0 0 64 40" className={styles.tplPreview}>
      {type === 'full' && (
        <>
          <rect x="0" y="0" width="64" height="40" rx="2" fill="#f1f1f1" />
          <rect x="0" y="0" width="64" height="40" rx="2" fill="#7a7a7a" opacity="0.35" />
        </>
      )}
      {type === 'border' && (
        <>
          <rect x="0" y="0" width="64" height="40" rx="2" fill="#ffffff" stroke="#e5e5e5" />
          <rect x="7" y="6" width="50" height="28" rx="1" fill="#c8d6e5" />
        </>
      )}
      {type === 'spread' && (
        <>
          <rect x="0" y="0" width="64" height="40" rx="2" fill="#ffffff" stroke="#e5e5e5" />
          <rect x="4" y="5" width="27" height="30" rx="1" fill="#8395a7" />
          <rect x="33" y="5" width="27" height="30" rx="1" fill="#576574" />
          <line x1="32" y1="5" x2="32" y2="35" stroke="#d0d0d0" strokeDasharray="1 2" />
        </>
      )}
    </svg>
  );
}
