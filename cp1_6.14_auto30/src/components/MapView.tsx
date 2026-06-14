import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import { Plus, User, Filter, Search, MapPin, Eye, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { explorationApi } from '@/api/client';
import { ExplorationType, ExplorationTypeColors, ExplorationTypeLabels, type Exploration } from '@/types';
import { cn, typeIcon } from '@/lib/utils';
import LazyImage from './LazyImage';
import StarRating from './StarRating';

const CENTER: LatLngExpression = [34.5, 110];
const ZOOM = 4.5;

function FlyHandler({ target }: { target: Exploration | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 14, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [target, map]);
  return null;
}

function buildMarkerIcon(exp: Exploration) {
  const color = ExplorationTypeColors[exp.type];
  const icon = typeIcon(exp.type);
  const html = `
    <div style="position:relative;width:44px;height:54px;margin-left:-22px;margin-top:-50px;transform-origin:bottom center;transition:transform .25s cubic-bezier(.34,1.56,.64,1);will-change:transform;">
      <div style="width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 5px 15px -3px rgba(15,23,42,.35);border:2.5px solid #fff;background:linear-gradient(135deg,${color},${color}dd);">
        <span style="transform:rotate(45deg);color:#fff;font-size:16px;font-weight:700;line-height:1;">${icon}</span>
      </div>
    </div>`;
  return L.divIcon({
    html,
    className: 'custom-marker-wrapper',
    iconSize: [44, 54],
    iconAnchor: [22, 50],
    popupAnchor: [0, -46],
  });
}

export default function MapView() {
  const navigate = useNavigate();
  const {
    explorations,
    setExplorations,
    typeFilter,
    setTypeFilter,
    selectedExploration,
    setSelectedExploration,
  } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await explorationApi.getAll();
        setExplorations(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [setExplorations]);

  const filteredList = useMemo(() => {
    let list = explorations;
    if (typeFilter) list = list.filter((e) => e.type === typeFilter);
    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.address || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [explorations, typeFilter, searchInput]);

  const openDetail = (id: string) => {
    navigate(`/exploration/${id}`);
  };

  const handleMarkerClick = (exp: Exploration) => {
    setSelectedExploration(exp);
  };

  const typeOptions = Object.entries(ExplorationTypeLabels) as [ExplorationType, string][];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 sm:p-5 pointer-events-none">
        <div className="max-w-5xl mx-auto flex items-center gap-3 pointer-events-auto">
          <div className="flex-1 flex items-center gap-2 bg-white/90 backdrop-blur-xl shadow-float rounded-2xl px-4 py-3 border border-white/50">
            <Search size={18} className="text-city-light shrink-0" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索名称、地址或描述..."
              className="flex-1 bg-transparent outline-none text-sm text-city-dark placeholder:text-city-light/70"
            />
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-12 h-12 shrink-0 bg-white/90 backdrop-blur-xl shadow-float rounded-2xl flex items-center justify-center text-city-dark hover:bg-accent hover:text-white transition-all border border-white/50"
            aria-label="个人中心"
          >
            <User size={20} />
          </button>
        </div>
      </div>

      <MapContainer
        ref={(m) => { mapRef.current = m || null; }}
        center={CENTER}
        zoom={ZOOM}
        minZoom={3}
        maxZoom={18}
        zoomControl
        style={{ width: '100%', height: '100%' }}
        worldCopyJump
        preferCanvas
        keyboard={false}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FlyHandler target={selectedExploration} />
        {filteredList.map((exp) => (
          <Marker
            key={exp.id}
            position={[exp.lat, exp.lng]}
            icon={buildMarkerIcon(exp)}
            eventHandlers={{
              click: () => handleMarkerClick(exp),
            }}
          >
            <Popup
              closeButton
              maxWidth={280}
              minWidth={260}
              offset={[0, -38]}
            >
              <div className="popup-card">
                {exp.images?.[0] ? (
                  <LazyImage
                    src={exp.images[0]}
                    aspectRatio="16/10"
                    alt={exp.title}
                  />
                ) : (
                  <div
                    className="w-full flex items-center justify-center relative overflow-hidden"
                    style={{ aspectRatio: '16/10', background: `linear-gradient(135deg, ${ExplorationTypeColors[exp.type]}33, ${ExplorationTypeColors[exp.type]}11)` }}
                  >
                    <MapPin size={36} className="text-white/80" strokeWidth={1.5} />
                    <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40">
                      {typeIcon(exp.type)}
                    </div>
                  </div>
                )}
                <div className="p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="chip text-white"
                      style={{ background: ExplorationTypeColors[exp.type] }}
                    >
                      <span>{typeIcon(exp.type)}</span>
                      {ExplorationTypeLabels[exp.type]}
                    </span>
                    {exp.avgRating > 0 && (
                      <StarRating value={exp.avgRating} readonly size="sm" showValue />
                    )}
                  </div>
                  <h3 className="font-display font-bold text-city-dark text-lg leading-tight mb-1 line-clamp-1">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-city-light line-clamp-2 leading-relaxed mb-3">
                    {exp.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-city-light">
                      <Eye size={12} /> {exp.visitCount}
                    </span>
                    <button
                      onClick={() => openDetail(exp.id)}
                      className="text-xs font-medium text-accent hover:text-accent-dark transition-colors flex items-center gap-1"
                    >
                      查看详情 →
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute bottom-0 left-0 right-0 z-[1000] px-3 sm:px-6 pb-4 sm:pb-6 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div
            className={cn(
              'mb-3 bg-white/88 backdrop-blur-xl shadow-float rounded-2xl border border-white/60 overflow-hidden transition-all duration-300',
              showFilter ? 'max-h-[320px] opacity-100 p-4' : 'max-h-0 opacity-0 border-0 p-0'
            )}
          >
            {showFilter && (
              <div className="animate-fade-in">
                <p className="text-xs font-medium text-city-light mb-3">按类型筛选</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    onClick={() => { setTypeFilter(null); setShowFilter(false); }}
                    className={cn(
                      'chip justify-center py-2 border',
                      !typeFilter
                        ? 'bg-accent text-white border-accent'
                        : 'bg-white text-city-dark border-slate-200 hover:border-accent/50'
                    )}
                  >
                    全部
                  </button>
                  {typeOptions.map(([t, label]) => (
                    <button
                      key={t}
                      onClick={() => { setTypeFilter(t); setShowFilter(false); }}
                      className={cn(
                        'chip justify-center py-2 border',
                        typeFilter === t
                          ? 'text-white border-transparent'
                          : 'bg-white text-city-dark border-slate-200 hover:border-accent/50'
                      )}
                      style={typeFilter === t ? { background: ExplorationTypeColors[t] } : {}}
                    >
                      <span>{typeIcon(t)}</span> {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-city-dark/85 backdrop-blur-xl shadow-float rounded-[22px] px-3 sm:px-5 py-3 border border-white/10 flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShowFilter((s) => !s)}
              className={cn(
                'flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl px-3 sm:px-4 py-2.5 text-white/90 hover:bg-white/10 transition-all text-sm',
                typeFilter && 'bg-white/15 text-white'
              )}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">筛选</span>
              {typeFilter && <ChevronDown size={14} className={cn(showFilter && 'rotate-180 transition-transform')} />}
            </button>

            <div className="h-6 w-px bg-white/15 hidden sm:block" />

            <div className="flex-1 min-w-0 flex items-center gap-2 text-white/80 text-sm overflow-hidden">
              <MapPin size={15} className="text-accent shrink-0" />
              <span className="truncate">
                {loading
                  ? '加载地图中...'
                  : `共 ${filteredList.length} 个探索点${typeFilter ? ` · ${ExplorationTypeLabels[typeFilter]}` : ''}`}
              </span>
            </div>

            <button
              onClick={() => navigate('/publish')}
              className="shrink-0 bg-accent hover:bg-accent-dark text-white rounded-xl px-3 sm:px-5 py-2.5 flex items-center gap-1.5 shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all hover:-translate-y-0.5 font-medium text-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">新增探险</span>
            </button>
          </div>
        </div>
      </div>

      {!loading && filteredList.length === 0 && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-float p-8 text-center max-w-sm mx-6 animate-pop">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-display font-bold text-xl text-city-dark mb-2">暂无探索点</h3>
            <p className="text-city-light text-sm leading-relaxed mb-5">
              {searchInput || typeFilter ? '没有匹配的结果，试试其他关键词' : '开启你的城市发现之旅，发布第一个探险点吧！'}
            </p>
            {!searchInput && !typeFilter && (
              <button
                onClick={() => navigate('/publish')}
                className="btn-primary pointer-events-auto"
              >
                发布探险点
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
