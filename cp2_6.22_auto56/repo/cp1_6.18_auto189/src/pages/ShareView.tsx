import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { loadScene } from '@/engines/placeEngine';
import { Canvas, useThree } from '@react-three/fiber';
import { FurnitureModel } from '@/components/FurnitureModel';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlacedFurniture {
  modelId: string;
  x: number;
  y: number;
  scale: number;
}

function SceneCamera({ w, h }: { w: number; h: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const cam = camera as any;
    cam.left = -w / 2;
    cam.right = w / 2;
    cam.top = h / 2;
    cam.bottom = -h / 2;
    cam.updateProjectionMatrix();
  }, [camera, w, h]);
  return null;
}

export default function ShareView() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [furniture, setFurniture] = useState<PlacedFurniture[]>([]);
  const [loading, setLoading] = useState(true);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const containerRef = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!uuid) return;
    loadScene(uuid)
      .then((data) => {
        setImageUrl(data.imageUrl);
        setFurniture(data.furniture);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [uuid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full" style={{ background: '#1A1A2E' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-[#D4A76A] rounded-full animate-spin" />
          <p className="text-white/60">加载场景中...</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full" style={{ background: '#1A1A2E' }}>
        <div className="flex flex-col items-center gap-4">
          <p className="text-white/60 text-lg">场景不存在或已过期</p>
          <button
            className="btn-press flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm"
            style={{ backgroundColor: '#6C5CE7' }}
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
            <span>返回首页</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative glow-border rounded-lg overflow-hidden animate-fade-in" style={{ maxWidth: '800px' }}>
          <img
            src={imageUrl}
            alt="房间照片"
            className="block max-w-[800px] max-h-[calc(100vh-60px)] object-contain"
          />
        </div>
      </div>

      <button
        className="btn-press absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white text-sm transition-colors"
        style={{ background: 'rgba(26,26,46,0.8)', zIndex: 20 }}
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={16} />
        <span>返回首页</span>
      </button>
    </div>
  );
}
