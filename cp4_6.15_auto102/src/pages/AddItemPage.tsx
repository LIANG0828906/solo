import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Upload, X, Book, Smartphone, Home, Dumbbell, Shirt, Package, Info, ArrowLeft, ArrowRight, Send,
} from 'lucide-react';

const CATEGORIES = [
  { key: '教材书籍', icon: Book, bg: 'bg-blue-500' },
  { key: '电子产品', icon: Smartphone, bg: 'bg-purple-500' },
  { key: '生活用品', icon: Home, bg: 'bg-green-500' },
  { key: '运动器材', icon: Dumbbell, bg: 'bg-orange-500' },
  { key: '服饰鞋包', icon: Shirt, bg: 'bg-pink-500' },
  { key: '其他', icon: Package, bg: 'bg-gray-500' },
];

interface ImgItem { id: string; url: string; file: File; progress: number }

export default function AddItemPage() {
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<ImgItem[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [points, setPoints] = useState(1);
  const [titleError, setTitleError] = useState(false);
  const [notify, setNotify] = useState(false);
  const [closing, setClosing] = useState(false);
  const dragIndex = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback((file: File, id: string) => {
    const formData = new FormData();
    formData.append('file', file);
    axios.post('/api/upload', formData, {
      onUploadProgress: (e) => {
        const p = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
        setImages((prev) => prev.map((img) => (img.id === id ? { ...img, progress: p } : img)));
      },
    }).then((res) => {
      if (res.data.success) {
        setImages((prev) =>
          prev.map((img) => img.id === id ? { ...img, url: res.data.data.url, progress: 100 } : img)
        );
      }
    }).catch(() => {
      setImages((prev) => prev.filter((img) => img.id !== id));
    });
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newImgs: ImgItem[] = arr.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      url: URL.createObjectURL(file),
      file,
      progress: 0,
    }));
    setImages((prev) => [...prev, ...newImgs]);
    newImgs.forEach((img) => uploadFile(img.file, img.id));
  }, [uploadFile]);

  const handleDragStart = (i: number) => { dragIndex.current = i; };
  const handleDropReorder = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === i || from === -1) return;
    setImages((prev) => { const a = [...prev]; [a[from], a[i]] = [a[i], a[from]]; return a; });
    dragIndex.current = -1;
  };

  const canProceed = (s: number): boolean => {
    if (s === 1) return images.length > 0;
    if (s === 2) { const ok = title.trim() !== ''; setTitleError(!ok); return ok; }
    if (s === 3) return category !== '' && points >= 1;
    return true;
  };

  const handleSubmit = async () => {
    if (!canProceed(3)) return;
    await axios.post('/api/items', {
      title, description: desc, category, points, images: images.map((i) => i.url),
    });
    setNotify(true);
  };

  const closeNotify = () => { setClosing(true); setTimeout(() => { setNotify(false); setClosing(false); }, 300); };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {notify && (
        <div className={`fixed top-0 inset-x-0 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-white text-sm ${closing ? 'animate-slideUp' : 'animate-slideDown'}`}>
          <Info size={16} /><span className="flex-1">物品已提交审核，审核通过后将在首页展示</span>
          <button onClick={closeNotify}><X size={16} /></button>
        </div>
      )}

      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${s <= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
            {i < 2 && <div className={`w-12 h-0.5 ${s < step ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div
            className="border-2 border-dashed border-gray-300 rounded-card p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); e.dataTransfer.files.length && addFiles(e.dataTransfer.files); }}
          >
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500 text-sm">点击或拖拽上传图片</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {images.map((img, i) => (
              <div
                key={img.id} draggable onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropReorder(e, i)}
                className="relative rounded-lg overflow-hidden aspect-square cursor-move"
              >
                <img src={img.url} className="w-full h-full object-cover" />
                {img.progress < 100 && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-200">
                    <div className="h-full bg-primary transition-all" style={{ width: `${img.progress}%` }} />
                  </div>
                )}
                <button className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white" onClick={() => setImages((prev) => prev.filter((x) => x.id !== img.id))}>
                  <X size={12} />
                </button>
                {i === 0 && <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded">封面</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">标题 <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); titleError && setTitleError(false); }}
              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 ${titleError ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="请输入物品标题"
            />
            {titleError && <p className="text-red-500 text-xs mt-1">请输入标题</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 300))} rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="描述一下你的物品…"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{desc.length}/300</div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">分类</label>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key} onClick={() => setCategory(c.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${category === c.key ? 'animate-bounceSpring ring-2 ring-primary scale-105' : 'hover:scale-105'}`}
                >
                  <div className={`w-11 h-11 rounded-full ${c.bg} flex items-center justify-center text-white`}><c.icon size={20} /></div>
                  <span className="text-xs">{c.key}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">积分</label>
            <input
              type="number" min={1} value={points}
              onChange={(e) => setPoints(Math.max(1, +e.target.value || 1))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm">
            <ArrowLeft size={16} />上一步
          </button>
        ) : <div />}
        {step < 3 ? (
          <button onClick={() => canProceed(step) && setStep(step + 1)} disabled={!canProceed(step)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            下一步<ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={!canProceed(3)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Send size={16} />提交发布
          </button>
        )}
      </div>
    </div>
  );
}
