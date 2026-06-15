import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Upload, X, ChevronUp, ChevronDown, Book, Smartphone, Home, Dumbbell, Shirt, Package, Info, ArrowLeft, ArrowRight, Send,
} from 'lucide-react';

const CATEGORIES = [
  { key: '教材书籍', icon: Book, bg: 'bg-blue-500' },
  { key: '电子产品', icon: Smartphone, bg: 'bg-purple-500' },
  { key: '生活用品', icon: Home, bg: 'bg-green-500' },
  { key: '运动器材', icon: Dumbbell, bg: 'bg-orange-500' },
  { key: '服饰鞋包', icon: Shirt, bg: 'bg-pink-500' },
  { key: '其他', icon: Package, bg: 'bg-gray-500' },
];

interface ImgItem { url: string; progress: number }

export default function AddItemPage() {
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<ImgItem[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [points, setPoints] = useState(1);
  const [notify, setNotify] = useState(false);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImages((prev) => [...prev, { url, progress: 0 }]);
        let p = 0;
        const tick = () => {
          p += Math.random() * 30 + 10;
          if (p >= 100) {
            setImages((prev) => prev.map((img) => (img.url === url ? { ...img, progress: 100 } : img)));
          } else {
            setImages((prev) => prev.map((img) => (img.url === url ? { ...img, progress: Math.min(p, 99) } : img)));
            setTimeout(tick, 200 + Math.random() * 300);
          }
        };
        setTimeout(tick, 300);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.files.length && addFiles(e.dataTransfer.files); };
  const moveImg = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    setImages((prev) => { const a = [...prev]; [a[i], a[j]] = [a[j], a[i]]; return a; });
  };
  const removeImg = (url: string) => setImages((prev) => prev.filter((img) => img.url !== url));

  const handleSubmit = async () => {
    await axios.post('/api/items', { title, description: desc, category, points, images: images.map((i) => i.url) });
    setNotify(true);
  };

  const closeNotify = () => { setClosing(true); setTimeout(() => { setNotify(false); setClosing(false); }, 300); };

  const steps = [1, 2, 3];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {notify && (
        <div className={`fixed top-0 inset-x-0 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-white text-sm ${closing ? 'animate-slideUp' : 'animate-slideDown'}`}>
          <Info size={16} /><span className="flex-1">物品已提交审核，审核通过后将在首页展示</span>
          <button onClick={closeNotify}><X size={16} /></button>
        </div>
      )}

      <div className="flex items-center justify-center gap-0 mb-8">
        {steps.map((s, i) => (
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
            onDrop={handleDrop}
          >
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500 text-sm">点击或拖拽上传图片</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {images.map((img, i) => (
              <div key={img.url} className="relative rounded-lg overflow-hidden aspect-square group">
                <img src={img.url} className="w-full h-full object-cover" />
                {img.progress < 100 && <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-200"><div className="h-full bg-primary transition-all" style={{ width: `${img.progress}%` }} /></div>}
                <button className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white" onClick={() => removeImg(img.url)}><X size={12} /></button>
                {i === 0 && <span className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded">封面</span>}
                <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-5 h-5 bg-black/50 rounded flex items-center justify-center text-white" onClick={() => moveImg(i, -1)}><ChevronUp size={10} /></button>
                  <button className="w-5 h-5 bg-black/50 rounded flex items-center justify-center text-white" onClick={() => moveImg(i, 1)}><ChevronDown size={10} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">标题 <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="请输入物品标题" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 300))} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="描述一下你的物品…" />
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
                  key={c.key}
                  onClick={() => setCategory(c.key)}
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
            <input type="number" min={1} value={points} onChange={(e) => setPoints(Math.max(1, +e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm"><ArrowLeft size={16} />上一步</button>
        ) : <div />}
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm">下一步<ArrowRight size={16} /></button>
        ) : (
          <button onClick={handleSubmit} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm"><Send size={16} />提交发布</button>
        )}
      </div>
    </div>
  );
}
