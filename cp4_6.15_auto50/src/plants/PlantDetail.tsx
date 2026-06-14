import { useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import { ArrowLeft, Leaf, MapPin, Calendar, Activity, Trash2, Edit3 } from 'lucide-react';
import { usePlantStore } from '@/store/usePlantStore';
import PhotoCarousel from '@/components/PhotoCarousel';
import DiagnosisTimeline from '@/components/DiagnosisTimeline';
import RippleButton from '@/components/RippleButton';

export default function PlantDetail() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const plants = usePlantStore((s) => s.plants);
  const getPlantDiagnoses = usePlantStore((s) => s.getPlantDiagnoses);
  const updatePlant = usePlantStore((s) => s.updatePlant);
  const deletePlant = usePlantStore((s) => s.deletePlant);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const plant = plants.find((p) => p.id === plantId);

  if (!plant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-cream-50">
        <p className="text-olive-400 text-lg mb-4">植物不存在</p>
        <Link to="/" className="text-olive-500 hover:text-olive-600 underline">
          返回首页
        </Link>
      </div>
    );
  }

  const diagnoses = getPlantDiagnoses(plant.id);
  const careDays = differenceInDays(new Date(), parseISO(plant.purchaseDate));

  const handleUpdatePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updatePlant(plant.id, { photos: [...plant.photos, dataUrl] });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDelete = () => {
    if (confirm('确定要删除这株植物吗？所有相关记录也将被删除。')) {
      deletePlant(plant.id);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-olive-50 transition"
            >
              <ArrowLeft size={20} className="text-olive-600" />
            </button>
            <h1 className="font-display font-bold text-xl">{plant.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-olive-50 transition"
            >
              <Edit3 size={16} className="text-olive-500" />
            </button>
            <button
              onClick={handleDelete}
              className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-red-50 transition"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        </div>

        <PhotoCarousel photos={plant.photos} onUpdatePhoto={handleUpdatePhoto} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-olive-100 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-olive-400" />
              <div>
                <p className="text-olive-600 text-xs">名称</p>
                <p className="font-body font-medium text-sm">{plant.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-olive-400" />
              <div>
                <p className="text-olive-600 text-xs">位置</p>
                <p className="font-body font-medium text-sm">{plant.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Activity size={18} className="text-olive-400" />
              <div>
                <p className="text-olive-600 text-xs">已养护天数</p>
                <p className="font-display font-bold text-3xl text-olive-500">
                  {careDays}
                  <span className="text-sm font-body font-normal ml-1">天</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-olive-400" />
              <div>
                <p className="text-olive-600 text-xs">购买日期</p>
                <p className="font-body font-medium text-sm">{plant.purchaseDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-olive-500" />
            <h2 className="font-display font-bold text-lg">健康档案</h2>
          </div>
          <DiagnosisTimeline
            diagnoses={diagnoses}
            hasMore={false}
            onLoadMore={() => {}}
          />
        </div>

        <div className="flex gap-3 mt-6 pb-8">
          <RippleButton
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => navigate(`/plant/${plant.id}/record`)}
          >
            记录新症状
          </RippleButton>
          <RippleButton
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={handleUpdatePhoto}
          >
            更新照片
          </RippleButton>
        </div>
      </div>
    </div>
  );
}
