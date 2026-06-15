import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useStore, generateGradientColor } from '../store';
import { getPlantStatusDisplay, formatRelativeTime, formatDate } from '../utils';
import type { GrowthRecord, Plant } from '../types';



const lightLabels: Record<string, { label: string; icon: string }> = {
  low: { label: '低光照', icon: 'fa-cloud-sun' },
  medium: { label: '中等光照', icon: 'fa-sun' },
  high: { label: '高光照', icon: 'fa-sun' },
};

const waterLabels: Record<string, { label: string; icon: string }> = {
  daily: { label: '每日浇水', icon: 'fa-tint' },
  everyOtherDay: { label: '隔日浇水', icon: 'fa-tint' },
  weekly: { label: '每周浇水', icon: 'fa-droplet' },
};

function GrowthTimeline({ records }: { records: GrowthRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-book-open text-4xl text-gray-300 mb-3 block"></i>
        <p className="text-gray-400">暂无成长记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-olive-200"></div>
      <div className="space-y-6">
        {records.map((record, index) => (
          <div
            key={record.id}
            className={`timeline-item relative pl-14 pr-4 py-4 bg-white rounded-card card-shadow ${
              index === 0 ? 'border-l-4 border-gold-500' : ''
            }`}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-olive-100 flex items-center justify-center border-4 border-beige-100">
              <i className="fas fa-leaf text-olive-600 text-sm"></i>
            </div>
            <div className="text-xs text-olive-600 font-semibold mb-1">
              {formatRelativeTime(record.date)}
            </div>
            <div className="text-xs text-gray-400 mb-2">{formatDate(record.date)}</div>
            <p className="text-gray-700 text-sm leading-relaxed">{record.description}</p>
            {record.photo && (
              <img
                src={record.photo}
                alt="成长记录"
                className="mt-3 w-full max-w-xs rounded-lg object-cover"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const flashIntervalRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);

  const {
    plants,
    allGrowthRecords,
    adoptionRequests,
    currentUser,
    addAdoptionRequest,
  } = useStore(
    useShallow((s) => ({
      plants: s.plants as Plant[],
      allGrowthRecords: s.growthRecords as GrowthRecord[],
      adoptionRequests: s.adoptionRequests,
      currentUser: s.currentUser,
      addAdoptionRequest: s.addAdoptionRequest,
    }))
  );

  const plant = useMemo(() => plants.find((p) => p.id === id), [plants, id]);
  const growthRecords = useMemo(
    () =>
      allGrowthRecords
        .filter((r) => r.plantId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [allGrowthRecords, id]
  );
  const alreadyRequested = useMemo(
    () =>
      adoptionRequests.some(
        (r) => r.plantId === id && r.applicantId === currentUser.id
      ),
    [adoptionRequests, id, currentUser.id]
  );

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [buttonState, setButtonState] = useState<'idle' | 'flashing' | 'applied'>('idle');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    const timer = setTimeout(() => {
      if (isMounted.current) {
        setIsDataLoaded(true);
      }
    }, 50);
    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
      }
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  const plantStatus = plant ? getPlantStatusDisplay(plant.status) : null;

  if (!plant) {
    return (
      <div className="route-enter min-h-screen bg-beige-100">
        <Navbar showSearch={false} />
        <div className="pt-24 text-center">
          <p className="text-gray-500">植物不存在</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-olive-600 hover:underline"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const gradient = generateGradientColor(plant.name);
  const isOwner = plant.ownerId === currentUser.id;
  const pageAnimClass = isDataLoaded ? 'route-enter' : 'opacity-0';

  const handleApplyClick = () => {
    if (alreadyRequested || isOwner || plant.status === 'adopted') return;
    setShowConfirmModal(true);
  };

  const handleConfirmAdoption = () => {
    setShowConfirmModal(false);
    setButtonState('flashing');
    addAdoptionRequest(plant.id);

    const startTime = Date.now();
    flashIntervalRef.current = window.setInterval(() => {
      if (!isMounted.current) {
        if (flashIntervalRef.current) {
          clearInterval(flashIntervalRef.current);
          flashIntervalRef.current = null;
        }
        return;
      }
      const elapsed = Date.now() - startTime;
      if (elapsed >= 3000) {
        if (flashIntervalRef.current) {
          clearInterval(flashIntervalRef.current);
          flashIntervalRef.current = null;
        }
        if (isMounted.current) {
          setButtonState('applied');
          setToastMessage('领养申请已提交');
          setToastVisible(true);
        }
      }
    }, 100);

    flashTimeoutRef.current = window.setTimeout(() => {
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
        flashIntervalRef.current = null;
      }
    }, 3100);
  };

  const lightInfo = lightLabels[plant.lightRequirement];
  const waterInfo = waterLabels[plant.waterFrequency];

  return (
    <div className={`${pageAnimClass} min-h-screen bg-beige-100 pb-28 md:pb-12`}>
      <Navbar showSearch={false} />

      <div className="pt-16">
        <div className="relative h-72 md:h-96" style={{ background: gradient }}>
          {plant.photos.length > 0 ? (
            <img
              src={plant.photos[0]}
              alt={plant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <i className="fas fa-tree text-8xl text-white/40"></i>
            </div>
          )}

          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all"
          >
            <i className="fas fa-arrow-left"></i>
          </button>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white font-merriweather mb-1">
              {plant.name}
            </h1>
            <p className="text-white/70 text-sm italic mb-4">{plant.latinName}</p>

            <div className="flex flex-wrap gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <i className={`fas fa-star text-gold-400`}></i>
                <span>
                  养护难度: {'★'.repeat(plant.difficulty)}
                  <span className="text-white/40">{'★'.repeat(5 - plant.difficulty)}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className={`fas ${lightInfo.icon} text-yellow-300`}></i>
                <span>{lightInfo.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className={`fas ${waterInfo.icon} text-blue-300`}></i>
                <span>{waterInfo.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-4">
          <div className="bg-white rounded-card p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">
                发布者：{plant.ownerNickname}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${plantStatus?.className.replace('bg-olive-600', 'bg-olive-100 text-olive-700').replace('bg-gray-400', 'bg-gray-100 text-gray-500')}`}
              >
                {plantStatus?.label === '待领养' ? '可领养' : plantStatus?.label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2 font-merriweather">
              植物介绍
            </h2>
            <p className="text-gray-600 leading-relaxed">{plant.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 font-merriweather flex items-center gap-2">
              <i className="fas fa-book text-olive-600"></i>
              成长日记
            </h2>
            <GrowthTimeline records={growthRecords} />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-auto p-4 md:p-0 z-30">
          <button
            onClick={handleApplyClick}
            disabled={buttonState !== 'idle' || alreadyRequested || isOwner || plant.status === 'adopted'}
            className={`w-full md:w-72 py-4 rounded-card text-white font-bold text-base shadow-lg transition-all ${
              buttonState === 'flashing'
                ? 'btn-flash'
                : buttonState === 'applied'
                ? 'bg-gray-400 cursor-not-allowed'
                : alreadyRequested || isOwner || plant.status === 'adopted'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'btn-gradient'
            }`}
          >
            {buttonState === 'flashing' ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-spinner fa-spin"></i>
                提交中...
              </span>
            ) : buttonState === 'applied' ? (
              '已申请'
            ) : alreadyRequested ? (
              '已申请过'
            ) : isOwner ? (
              '这是您发布的植物'
            ) : plant.status === 'adopted' ? (
              '已被领养'
            ) : (
              '申请领养'
            )}
          </button>
        </div>
      </div>

      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 font-merriweather text-center">
            确认申请领养
          </h3>
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-24 h-24 rounded-card mb-3 flex items-center justify-center overflow-hidden"
              style={{ background: gradient }}
            >
              {plant.photos.length > 0 ? (
                <img src={plant.photos[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-leaf text-3xl text-white/70"></i>
              )}
            </div>
            <p className="font-bold text-gray-800">{plant.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              确认要申请领养这株植物吗？
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 py-3 rounded-card border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleConfirmAdoption}
              className="flex-1 py-3 rounded-card btn-gradient text-white font-medium"
            >
              确认申请
            </button>
          </div>
        </div>
      </Modal>

      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
