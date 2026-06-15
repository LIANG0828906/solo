import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Shuffle, Trash2, Upload, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { v4 as uuidv4 } from 'uuid';
import { useStore, type Meme, type AnimationType, type AnimationSpeed, type OverlayElement } from '../store/useStore';

const DEFAULT_STICKERS = ['😂', '❤️', '💣', '🔥', '😎', '🤔', '👍', '😭', '🎉', '💀', '✨', '🤡'];

const HOT_PHRASES = [
  '绝绝子',
  '我真的会谢',
  '栓Q',
  '笑不活了',
  '这很难评',
  '主打一个陪伴',
  '开什么国际玩笑',
  '有点东西但不多',
  '咱就是说',
  '一整个大无语'
];

function getAnimationStyle(type: AnimationType, speed: AnimationSpeed, loopCount: number | 'infinite') {
  if (type === 'none') return {};
  const speedClass = speed === 'slow' ? '1.5s' : speed === 'medium' ? '0.8s' : '0.4s';
  const iteration = loopCount === 'infinite' ? 'infinite' : `${loopCount}`;
  return {
    animation: `${type} ${speedClass} ease-in-out ${iteration}`,
    transformOrigin: 'center center',
  };
}

function SmileyIllustration() {
  return (
    <svg className="empty-state-smiley" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="56" fill="#F5E642" stroke="#2C2C2C" strokeWidth="3"/>
      <circle cx="44" cy="50" r="6" fill="#2C2C2C"/>
      <circle cx="76" cy="50" r="6" fill="#2C2C2C"/>
      <path d="M36 72 Q60 92 84 72" stroke="#2C2C2C" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <circle cx="30" cy="66" r="4" fill="#FFB3BA" opacity="0.6"/>
      <circle cx="90" cy="66" r="4" fill="#FFB3BA" opacity="0.6"/>
    </svg>
  );
}

interface UploadModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; imageUrl: string; tags: string[]; category: string }) => void;
  categories: string[];
  addCategory: (cat: string) => void;
}

function UploadModal({ onClose, onSubmit, categories, addCategory }: UploadModalProps) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && tags.length < 3 && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed) {
      addCategory(trimmed);
      setCategory(trimmed);
      setNewCategory('');
      setShowNewCategory(false);
    }
  };

  const handleSubmit = () => {
    if (name && imageUrl) {
      onSubmit({ name, imageUrl, tags, category });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fadeInScale" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">上传新表情包</h2>
          <button className="btn" style={{ padding: '6px' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-[#F5E642] hover:bg-[#FFFDE7] transition-all"
            style={{ borderColor: imageUrl ? '#F5E642' : '#E0E0E0', background: imageUrl ? '#FFFDE7' : 'transparent' }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="preview" className="max-h-40 mx-auto rounded-lg" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Upload size={40} />
                <p className="font-medium">点击上传图片 (PNG/JPG/GIF)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">表情包名称</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给表情包起个名字"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">分类</label>
            {!showNewCategory ? (
              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button className="btn btn-secondary" onClick={() => setShowNewCategory(true)}>
                  <Plus size={18} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="新分类名称"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button className="btn btn-primary" onClick={handleAddCategory}>确定</button>
                <button className="btn" onClick={() => setShowNewCategory(false)}>
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">标签 (最多3个)</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={tags.length >= 3 ? '已达到最大标签数' : '输入标签后按回车'}
                disabled={tags.length >= 3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button className="btn btn-secondary" onClick={handleAddTag} disabled={tags.length >= 3}>
                添加
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {tags.map((tag, idx) => (
                  <span key={idx} className="tag">
                    {tag}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button className="btn btn-secondary flex-1" onClick={onClose}>取消</button>
            <button className="btn btn-primary flex-1" onClick={handleSubmit} disabled={!name || !imageUrl}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RandomMemeModalProps {
  memes: Meme[];
  onClose: () => void;
  onSave: (meme: Meme, overlays: OverlayElement[]) => void;
}

function RandomMemeModal({ memes, onClose, onSave }: RandomMemeModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [randomMeme, setRandomMeme] = useState<Meme | null>(null);
  const [overlays, setOverlays] = useState<OverlayElement[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateRandom = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const meme = memes[Math.floor(Math.random() * memes.length)];
      const phrase = HOT_PHRASES[Math.floor(Math.random() * HOT_PHRASES.length)];
      const sticker = DEFAULT_STICKERS[Math.floor(Math.random() * DEFAULT_STICKERS.length)];
      
      const newOverlays: OverlayElement[] = [
        {
          id: uuidv4(),
          type: 'text',
          content: phrase,
          x: 50,
          y: 20,
          width: 180,
          height: 50,
          rotation: Math.random() * 10 - 5,
          opacity: 1,
          zIndex: 1,
          fontSize: 24,
          color: '#2C2C2C',
        },
        {
          id: uuidv4(),
          type: 'sticker',
          content: sticker,
          x: 200,
          y: 120,
          width: 60,
          height: 60,
          rotation: Math.random() * 20 - 10,
          opacity: 1,
          zIndex: 2,
        },
      ];
      setRandomMeme(meme);
      setOverlays(newOverlays);
      setIsGenerating(false);
    }, 300);
  };

  const handleSave = async () => {
    if (!randomMeme || !previewRef.current) return;
    setIsSaving(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: null,
        useCORS: true,
        scale: 1,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      onSave(randomMeme, overlays);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      onSave(randomMeme, overlays);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (memes.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content animate-fadeInScale text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-lg mb-4">先上传一些表情包再来抽奖吧～</p>
          <button className="btn btn-primary" onClick={onClose}>好的</button>
        </div>
      </div>
    );
  }

  if (!randomMeme && !isGenerating) {
    generateRandom();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fadeInScale" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Shuffle size={24} /> 随机表情彩蛋
          </h2>
          <button className="btn" style={{ padding: '6px' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {isGenerating ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#F5E642] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">生成中...</p>
            </div>
          </div>
        ) : randomMeme && (
          <div>
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <div
                ref={previewRef}
                className="preview-canvas animate-fadeInScale"
                style={{ width: '100%', maxWidth: 400, margin: '0 auto', aspectRatio: 'auto' }}
              >
                <img
                  src={randomMeme.imageUrl}
                  alt={randomMeme.name}
                  style={{ width: '100%', display: 'block' }}
                />
                {overlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className="draggable-element"
                    style={{
                      left: `${(overlay.x / 400) * 100}%`,
                      top: `${(overlay.y / 300) * 100}%`,
                      width: overlay.width,
                      height: overlay.height,
                      transform: `rotate(${overlay.rotation}deg)`,
                      opacity: overlay.opacity,
                      zIndex: overlay.zIndex,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {overlay.type === 'text' ? (
                      <div
                        style={{
                          fontSize: overlay.fontSize,
                          color: overlay.color,
                          fontWeight: 700,
                          fontFamily: "'Fredoka', 'Noto Sans SC', sans-serif",
                          textShadow: '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                        }}
                      >
                        {overlay.content}
                      </div>
                    ) : (
                      <div style={{ fontSize: 48 }}>{overlay.content}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-4 text-center">
              原图：<span className="font-medium text-gray-700">{randomMeme.name}</span>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={generateRandom} disabled={isGenerating}>
                <Shuffle size={18} /> 再来一次
              </button>
              <button className="btn btn-primary flex-1" onClick={handleSave} disabled={isSaving}>
                <Plus size={18} /> {isSaving ? '保存中...' : '保存为新品'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { memes, categories, searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, addMeme, updateMeme, addCategory, deleteMeme, getFilteredMemes } = useStore();
  const [showUpload, setShowUpload] = useState(false);
  const [showRandom, setShowRandom] = useState(false);

  const filteredMemes = useMemo(() => getFilteredMemes(), [memes, searchQuery, selectedCategory, getFilteredMemes]);

  const handleUpload = async (data: { name: string; imageUrl: string; tags: string[]; category: string }) => {
    await addMeme({
      ...data,
      overlays: [],
      animation: { type: 'none', speed: 'medium', loopCount: 'infinite' },
    });
    setShowUpload(false);
  };

  const handleRandomSave = async (originalMeme: Meme, overlays: OverlayElement[]) => {
    const previewEl = document.querySelector('.preview-canvas') as HTMLElement;
    let imageUrl = originalMeme.imageUrl;
    
    if (previewEl) {
      try {
        const canvasOpts = {
          backgroundColor: null,
          useCORS: true,
          scale: 2,
          logging: false,
        };
        const canvasPromise = html2canvas(previewEl, canvasOpts);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 2000)
        );
        const canvas = await Promise.race([canvasPromise, timeoutPromise]);
        imageUrl = canvas.toDataURL('image/png');
      } catch (err) {
        console.warn('html2canvas failed, using original image', err);
      }
    }

    await addMeme({
      name: `${originalMeme.name}·随机版`,
      imageUrl,
      tags: [...originalMeme.tags, '随机'],
      category: originalMeme.category,
      overlays,
      animation: { type: 'none', speed: 'medium', loopCount: 'infinite' },
    });
  };

  return (
    <div>
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">😄</span>
          表情包工坊
        </div>

        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            className="input"
            placeholder="搜索表情包名称或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={() => setShowRandom(true)}>
            <Shuffle size={18} />
            <span className="hidden sm:inline">随机生成</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Plus size={18} />
            <span className="hidden sm:inline">上传表情包</span>
          </button>
        </div>
      </header>

      <div className="px-6 py-4 flex flex-wrap gap-2" style={{ maxWidth: 1400, margin: '0 auto' }}>
        <button
          className={`chip ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('')}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredMemes.length === 0 ? (
        <div className="empty-state">
          <SmileyIllustration />
          <h3 className="font-display text-2xl font-bold mb-2">还没有表情包哦~</h3>
          <p className="text-gray-500 mb-6">点击右上角的"上传表情包"按钮，开始收集你的第一张表情包吧！</p>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Upload size={18} /> 立即上传
          </button>
        </div>
      ) : (
        <div className="meme-grid" style={{ maxWidth: 1400, margin: '0 auto' }}>
          {filteredMemes.map((meme, idx) => (
            <div
              key={meme.id}
              className="meme-card animate-fadeIn"
              style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
              onClick={() => navigate(`/editor/${meme.id}`)}
            >
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  overflow: 'hidden',
                  background: '#f9f9f9',
                }}
              >
                <div
                  style={getAnimationStyle(
                    meme.animation.type,
                    meme.animation.speed,
                    meme.animation.loopCount
                  )}
                >
                  <img
                    src={meme.imageUrl}
                    alt={meme.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    draggable={false}
                  />
                </div>
                {meme.animation.type !== 'none' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(245, 230, 66, 0.95)',
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    ✨ 动效
                  </div>
                )}
              </div>

              <div style={{ padding: '12px 16px' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm truncate" style={{ flex: 1 }}>{meme.name}</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定删除这个表情包吗？')) {
                        deleteMeme(meme.id);
                      }
                    }}
                    style={{
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#999',
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF5252')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {meme.tags.length === 0 ? (
                    <span style={{ fontSize: 11, color: '#999' }}>暂无标签</span>
                  ) : (
                    meme.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))
                  )}
                </div>
                {meme.category && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
                    📁 {meme.category}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSubmit={handleUpload}
          categories={categories}
          addCategory={addCategory}
        />
      )}

      {showRandom && (
        <RandomMemeModal
          memes={memes}
          onClose={() => setShowRandom(false)}
          onSave={handleRandomSave}
        />
      )}
    </div>
  );
}
