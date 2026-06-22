import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import {
  ArrowLeft, MapPin, Camera, X, Send, Search,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { explorationApi, uploadApi } from '@/api/client';
import { useAppStore } from '@/store';
import { ExplorationTypeLabels, ExplorationTypeColors, type ExplorationType, type Exploration } from '@/types';
import { cn, compressImage, typeIcon } from '@/lib/utils';

const PIN_ICON = L.divIcon({
  html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#f97316,#ea580c);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(249,115,22,.45);border:2px solid #fff;"><span style="transform:rotate(45deg);color:#fff;font-size:14px;">📍</span></div>`,
  className: '',
  iconSize: [32, 40],
  iconAnchor: [16, 38],
});

function DragHandler({ onDragEnd }: { onDragEnd: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    map.on('moveend', () => {
      const c = map.getCenter();
      onDragEnd(c.lat, c.lng);
    });
  }, [map, onDragEnd]);
  return null;
}

export default function ExplorationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user, addExploration, updateExploration } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ExplorationType>('cafe');
  const [images, setImages] = useState<string[]>([]);
  const [lat, setLat] = useState(39.9087);
  const [lng, setLng] = useState(116.3975);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [searchQ, setSearchQ] = useState('');

  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    let alive = true;
    (async () => {
      try {
        const d = await explorationApi.getDetail(id, user.id);
        if (!alive) return;
        const e = d.exploration;
        setTitle(e.title);
        setDescription(e.description);
        setType(e.type);
        setImages(e.images);
        setLat(e.lat);
        setLng(e.lng);
        setAddress(e.address || '');
        mapRef.current?.setView([e.lat, e.lng], 14);
      } finally {
        if (alive) setLoadingData(false);
      }
    })();
    return () => { alive = false; };
  }, [id, isEdit, user.id]);

  const handleImagePick = async (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).slice(0, 3 - images.length);
    for (const f of list) {
      try {
        const blob = await compressImage(f);
        const url = await uploadApi.image(blob, f.name);
        setImages((arr) => [...arr, url]);
      } catch { /* skip */ }
    }
  };

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQ)}&limit=1`
      );
      const data = await res.json();
      if (data?.[0]) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setLat(newLat);
        setLng(newLng);
        setAddress(data[0].display_name || '');
        mapRef.current?.flyTo([newLat, newLng], 14, { duration: 1.2 });
      }
    } catch { /* ignore */ }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !type || submitting) return;
    setSubmitting(true);
    try {
      if (isEdit && id) {
        const updated = await explorationApi.update(id, {
          title, description, type, images, lat, lng, address,
        });
        updateExploration(updated);
        navigate(`/exploration/${id}`, { replace: true });
      } else {
        const created = await explorationApi.create({
          title, description, type, images, lat, lng, address, createdBy: user.id,
        });
        addExploration(created);
        navigate('/', { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions = Object.entries(ExplorationTypeLabels) as [ExplorationType, string][];

  if (loadingData) {
    return (
      <div className="min-h-screen bg-city-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-city-bg">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-city-dark hover:text-accent transition-colors rounded-xl px-3 py-2 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium hidden sm:inline">取消</span>
          </button>
          <h1 className="flex-1 text-center font-display font-bold text-lg text-city-dark">
            {isEdit ? '编辑探险点' : '发布新探险'}
          </h1>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send size={16} />
            {submitting ? '提交中...' : isEdit ? '保存' : '发布'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="card p-5 sm:p-6 space-y-5 animate-slide-up">
          <div>
            <label className="block text-sm font-medium text-city-dark mb-2">名称 *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给这个探险点取个名字"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-city-dark mb-2">类型 *</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {typeOptions.map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    'chip justify-center py-2.5 border transition-all',
                    type === t
                      ? 'text-white border-transparent'
                      : 'bg-white text-city-dark border-slate-200 hover:border-accent/50'
                  )}
                  style={type === t ? { background: ExplorationTypeColors[t] } : {}}
                >
                  <span>{typeIcon(t)}</span> {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-city-dark mb-2">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述一下这个探险点的特别之处..."
              rows={4}
              className="textarea-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-city-dark mb-2">
              照片 <span className="text-city-light font-normal">({images.length}/3)</span>
            </label>
            <div className="flex gap-3 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages((arr) => arr.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-accent/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:bg-accent/5">
                  <Camera size={20} className="text-city-light" />
                  <span className="text-xs text-city-light">上传</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImagePick(e.target.files)}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-city-light mt-2">图片将自动压缩至1MB以内</p>
          </div>
        </div>

        <div className="card p-5 sm:p-6 animate-slide-up">
          <label className="block text-sm font-medium text-city-dark mb-3">位置 *</label>

          <div className="flex gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent transition-all">
              <Search size={16} className="text-city-light shrink-0" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索地址来定位..."
                className="flex-1 bg-transparent outline-none text-sm text-city-dark placeholder:text-city-light/70"
              />
            </div>
            <button onClick={handleSearch} className="btn-primary text-sm px-4">
              搜索
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ height: 280 }}>
            <MapContainer
              ref={(m) => { mapRef.current = m || null; }}
              center={[lat, lng]}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              preferCanvas
              scrollWheelZoom
            >
              <TileLayer
                attribution=""
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <DragHandler onDragEnd={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
              <Marker position={[lat, lng]} icon={PIN_ICON} draggable />
            </MapContainer>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <MapPin size={14} className="text-accent shrink-0" />
            <span className="text-xs text-city-light font-mono">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
          </div>

          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="补充详细地址（可选）"
            className="input-field mt-3 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
