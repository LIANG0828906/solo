import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PlantCard from '../components/PlantCard';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useStore, generateGradientColor } from '../store';
import type {
  Difficulty,
  LightRequirement,
  WaterFrequency,
  RequestStatus,
  AdoptionRequest,
} from '../types';

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-orange-100 text-orange-600' },
  approved: { label: '已同意', className: 'bg-olive-100 text-olive-700' },
  rejected: { label: '已拒绝', className: 'bg-gray-100 text-gray-500' },
};

function UploadProgress({ progress }: { progress: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg className="progress-ring w-14 h-14" viewBox="0 0 60 60">
      <circle
        cx="30"
        cy="30"
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="4"
      />
      <circle
        cx="30"
        cy="30"
        r={radius}
        fill="none"
        stroke="#6B8E23"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x="30"
        y="34"
        textAnchor="middle"
        className="fill-olive-600 text-xs font-bold"
      >
        {progress}%
      </text>
    </svg>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const userPlants = useStore((s) => s.getUserPlants(s.currentUser.id));
  const adoptionRequests = useStore((s) => s.getRequestsForUserPlants(s.currentUser.id));
  const addPlant = useStore((s) => s.addPlant);
  const removePlant = useStore((s) => s.removePlant);
  const updateRequestStatus = useStore((s) => s.updateRequestStatus);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [removingPlantId, setRemovingPlantId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    latinName: '',
    difficulty: 2 as Difficulty,
    lightRequirement: 'medium' as LightRequirement,
    waterFrequency: 'weekly' as WaterFrequency,
    description: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleRemovePlant = (plantId: string) => {
    setRemovingPlantId(plantId);
    setTimeout(() => {
      removePlant(plantId);
      setRemovingPlantId(null);
      showToast('已下架');
    }, 300);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 3 - photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file, index) => {
      if (!['image/png', 'image/jpeg'].includes(file.type)) {
        showToast('只支持 PNG/JPG 格式');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        showToast('每张图片不能超过 3MB');
        return;
      }

      setUploadProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setPhotos((prev) => [...prev, result]);
            if (index === filesToProcess.length - 1) {
              setTimeout(() => setUploadProgress(null), 300);
            }
          };
          reader.readAsDataURL(file);
        }
      }, 100);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      showToast('请填写植物名称');
      return;
    }
    if (!formData.description.trim()) {
      showToast('请填写植物描述');
      return;
    }

    addPlant({
      name: formData.name.trim(),
      latinName: formData.latinName.trim(),
      difficulty: formData.difficulty,
      lightRequirement: formData.lightRequirement,
      waterFrequency: formData.waterFrequency,
      description: formData.description.trim(),
      photos,
    });

    setShowPublishModal(false);
    setFormData({
      name: '',
      latinName: '',
      difficulty: 2,
      lightRequirement: 'medium',
      waterFrequency: 'weekly',
      description: '',
    });
    setPhotos([]);
    showToast('发布成功');
    setTimeout(() => navigate('/'), 800);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="route-enter min-h-screen bg-beige-100 pb-28 md:pb-12">
      <Navbar showSearch={false} />

      <main className="max-w-6xl mx-auto px-4 pt-24">
        <div className="bg-white rounded-card p-6 card-shadow mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-olive-400 to-olive-600 flex items-center justify-center text-white text-xl shadow-md">
              <i className="fas fa-user"></i>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800 font-merriweather">
                {currentUser.nickname}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                已发布 {userPlants.length} 株植物
              </p>
            </div>
            <button
              onClick={() => setShowPublishModal(true)}
              className="btn-gradient text-white px-5 py-2.5 rounded-card font-medium text-sm flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              <span className="desktop-only">发布新植物</span>
            </button>
          </div>
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 font-merriweather flex items-center gap-2">
              <i className="fas fa-seedling text-olive-600"></i>
              我发布的植物
            </h2>
            {userPlants.length > 2 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleScroll('left')}
                  className="w-9 h-9 rounded-full bg-white card-shadow flex items-center justify-center text-gray-500 hover:text-olive-600 hover:shadow-md transition-all"
                >
                  <i className="fas fa-chevron-left text-sm"></i>
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  className="w-9 h-9 rounded-full bg-white card-shadow flex items-center justify-center text-gray-500 hover:text-olive-600 hover:shadow-md transition-all"
                >
                  <i className="fas fa-chevron-right text-sm"></i>
                </button>
              </div>
            )}
          </div>

          {userPlants.length === 0 ? (
            <div className="bg-white rounded-card p-10 text-center">
              <i className="fas fa-leaf text-4xl text-gray-200 mb-3 block"></i>
              <p className="text-gray-400">还没有发布任何植物</p>
              <button
                onClick={() => setShowPublishModal(true)}
                className="mt-4 text-olive-600 hover:underline text-sm"
              >
                立即发布一株
              </button>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {userPlants.map((plant) => (
                <div
                  key={plant.id}
                  className="flex-shrink-0 w-56"
                  style={{
                    opacity: removingPlantId === plant.id ? 0 : 1,
                    transform: removingPlantId === plant.id ? 'scale(0.6)' : 'scale(1)',
                    transition: 'all 0.3s ease-in',
                  }}
                >
                  <PlantCard
                    plant={plant}
                    onClick={() => handleRemovePlant(plant.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 font-merriweather flex items-center gap-2 mb-4">
            <i className="fas fa-envelope text-olive-600"></i>
            领养请求
          </h2>

          {adoptionRequests.length === 0 ? (
            <div className="bg-white rounded-card p-10 text-center">
              <i className="fas fa-inbox text-4xl text-gray-200 mb-3 block"></i>
              <p className="text-gray-400">暂无领养请求</p>
            </div>
          ) : (
            <div className="bg-white rounded-card divide-y divide-gray-50 overflow-hidden">
              {adoptionRequests.map((req: AdoptionRequest) => (
                <div
                  key={req.id}
                  className="p-4 flex items-center gap-4 hover:bg-beige-50 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0"
                    style={{ background: generateGradientColor(req.plantName) }}
                  >
                    <i className="fas fa-leaf text-white"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button className="font-medium text-gray-800 hover:text-olive-600 transition-colors truncate">
                        {req.applicantNickname}
                      </button>
                      <span className="text-gray-300">申请领养</span>
                      <span className="text-olive-700 font-medium truncate">
                        {req.plantName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatRelativeTime(req.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <select
                      value={req.status}
                      onChange={(e) =>
                        updateRequestStatus(req.id, e.target.value as RequestStatus)
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-none outline-none cursor-pointer ${statusConfig[req.status].className}`}
                    >
                      <option value="pending">待处理</option>
                      <option value="approved">已同意</option>
                      <option value="rejected">已拒绝</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Modal isOpen={showPublishModal} onClose={() => setShowPublishModal(false)}>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-6 font-merriweather text-center">
            发布新植物
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                植物名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：绿萝"
                className="w-full px-4 py-2.5 rounded-card bg-beige-50 border border-olive-100 focus:outline-none focus:ring-2 focus:ring-olive-400 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                拉丁学名
              </label>
              <input
                type="text"
                value={formData.latinName}
                onChange={(e) => setFormData({ ...formData, latinName: e.target.value })}
                placeholder="如：Epipremnum aureum"
                className="w-full px-4 py-2.5 rounded-card bg-beige-50 border border-olive-100 focus:outline-none focus:ring-2 focus:ring-olive-400 focus:border-transparent text-sm italic"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                养护难度
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty: d as Difficulty })}
                    className={`w-10 h-10 rounded-card text-lg transition-all ${
                      formData.difficulty >= d
                        ? 'text-gold-500'
                        : 'text-gray-300'
                    }`}
                  >
                    <i className="fas fa-star"></i>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  光照需求
                </label>
                <select
                  value={formData.lightRequirement}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lightRequirement: e.target.value as LightRequirement,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-card bg-beige-50 border border-olive-100 focus:outline-none focus:ring-2 focus:ring-olive-400 focus:border-transparent text-sm"
                >
                  <option value="low">低光照</option>
                  <option value="medium">中等光照</option>
                  <option value="high">高光照</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  水肥频次
                </label>
                <select
                  value={formData.waterFrequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      waterFrequency: e.target.value as WaterFrequency,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-card bg-beige-50 border border-olive-100 focus:outline-none focus:ring-2 focus:ring-olive-400 focus:border-transparent text-sm"
                >
                  <option value="daily">每日</option>
                  <option value="everyOtherDay">隔日</option>
                  <option value="weekly">每周</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                植物描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="介绍一下这株植物的特点、养护要点等..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-card bg-beige-50 border border-olive-100 focus:outline-none focus:ring-2 focus:ring-olive-400 focus:border-transparent text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                植物照片（最多3张，PNG/JPG，每张不超过3MB）
              </label>
              <div className="flex flex-wrap gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img
                      src={photo}
                      alt=""
                      className="w-full h-full object-cover rounded-card"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
                {uploadProgress !== null && (
                  <div className="w-20 h-20 flex items-center justify-center bg-beige-50 rounded-card">
                    <UploadProgress progress={uploadProgress} />
                  </div>
                )}
                {photos.length < 3 && uploadProgress === null && (
                  <label className="w-20 h-20 rounded-card border-2 border-dashed border-olive-200 flex items-center justify-center text-olive-400 hover:border-olive-400 hover:text-olive-600 cursor-pointer transition-all">
                    <i className="fas fa-plus text-xl"></i>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setShowPublishModal(false)}
              className="flex-1 py-3 rounded-card border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-card btn-gradient text-white font-medium"
            >
              发布
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
