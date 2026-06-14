import { useState, useRef } from 'react';
import { useDataStore } from '@/utils/dataStore';
import { CATEGORY_LABELS, type Category } from '@/types';

const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const GripIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

export default function PublishPage() {
  const { addProduct, navigate } = useDataStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [condition, setCondition] = useState(7);
  const [description, setDescription] = useState('');
  const [exchangePreference, setExchangePreference] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductTitle, setNewProductTitle] = useState('');

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 6 - images.length;
    const toProcess = Array.from(files).slice(0, remaining);
    toProcess.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          setImages((prev) => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    const dt = e.dataTransfer;
    if (dt.files && dt.files.length > 0) {
      const remaining = 6 - images.length;
      const toProcess = Array.from(dt.files).slice(0, remaining);
      toProcess.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setImages((prev) => [...prev, result]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDragIndex(index);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null || dragIndex === index) return;
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleItemDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleItemDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newImages = [...images];
    const [movedItem] = newImages.splice(dragIndex, 1);
    newImages.splice(targetIndex, 0, movedItem);
    setImages(newImages);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleItemDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('请填写物品名称');
      return;
    }
    if (images.length === 0) {
      alert('请至少上传一张图片');
      return;
    }
    const newProduct = addProduct({
      title: title.trim(),
      category,
      condition,
      description: description.trim(),
      images,
      exchangePreference: exchangePreference.trim() || '不限',
    });
    setNewProductImage(images[0]);
    setNewProductTitle(title.trim());
    setShowSuccessCard(true);
    setTimeout(() => {
      setShowSuccessCard(false);
      navigate({ name: 'browse' });
    }, 2000);
  };

  const conditionLabel = (value: number) => {
    if (value >= 9) return '几乎全新';
    if (value >= 7) return '成色较好';
    if (value >= 5) return '有使用痕迹';
    if (value >= 3) return '有明显磨损';
    return '品相一般';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-inner" style={{ maxWidth: 768 }}>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            发布闲置
          </h1>
        </div>
      </div>

      <div className="page-content py-6 animate-fade-in" style={{ maxWidth: 768 }}>
        <div style={{ marginBottom: 24 }}>
          <label className="input-label" style={{ display: 'block', marginBottom: 12 }}>
            物品照片
            <span style={{ marginLeft: 8, color: 'var(--morandi-brown)', fontWeight: 400, fontSize: 13 }}>
              （最多6张，拖拽可排序）
            </span>
          </label>

          <div
            className="upload-grid"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {images.map((img, index) => {
              const isDragging = dragIndex === index;
              const isDragOver = dragOverIndex === index && dragIndex !== index;
              return (
                <div
                  key={index}
                  className={`upload-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleItemDragStart(e, index)}
                  onDragOver={(e) => handleItemDragOver(e, index)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e) => handleItemDrop(e, index)}
                  onDragEnd={handleItemDragEnd}
                >
                  <img src={img} alt={`图片 ${index + 1}`} />
                  <div className="upload-item-overlay">
                    <span className="upload-item-index">{index + 1}</span>
                    <div className="upload-item-actions">
                      <GripIcon className="upload-drag-hint" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removeImage(index);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="upload-remove-btn"
                        aria-label="删除图片"
                      >
                        <XIcon style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {images.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="upload-add-btn"
              >
                <UploadIcon className="upload-add-icon" />
                <span className="upload-add-text">添加图片</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label className="input-label">物品名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：Kindle Paperwhite 电子书阅读器"
              className="input"
              maxLength={50}
            />
          </div>

          <div className="input-group">
            <label className="input-label">物品类别</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`tag ${category === cat ? 'active' : ''}`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="input-label">新旧程度</label>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--morandi-blue)' }}>
                {condition}/10 · {conditionLabel(condition)}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={condition}
              onChange={(e) => setCondition(Number(e.target.value))}
              className="slider"
              style={{
                background: `linear-gradient(to right, #A8B5A0 0%, #A8B5A0 ${(condition - 1) * 11.11}%, #E8E6E1 ${(condition - 1) * 11.11}%, #E8E6E1 100%)`,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--morandi-brown)' }}>
              <span>较旧</span>
              <span>较新</span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">详细描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述物品的使用情况、购买时间、是否有瑕疵等..."
              rows={4}
              className="textarea"
              maxLength={500}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--morandi-brown)' }}>
              {description.length}/500
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">
              交换意向
              <span style={{ marginLeft: 6, color: 'var(--morandi-brown)', fontWeight: 400, fontSize: 13 }}>
                （想换什么类型的物品）
              </span>
            </label>
            <input
              type="text"
              value={exchangePreference}
              onChange={(e) => setExchangePreference(e.target.value)}
              placeholder="例如：想换一套心理学书籍，或不限"
              className="input"
              maxLength={100}
            />
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary btn-block btn-lg"
          >
            发布物品
          </button>
        </div>
      </div>

      {showSuccessCard && (
        <div className="modal-backdrop">
          <div className="success-card">
            <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div className="success-icon-wrap">
                <ImageIcon style={{ width: 28, height: 28 }} />
              </div>
              <h3 className="success-title">发布成功！</h3>
              <p className="success-desc">你的商品卡片已生成，正在跳转到浏览页...</p>
              <div className="success-preview">
                <img src={newProductImage} alt={newProductTitle} />
                <p>{newProductTitle}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
