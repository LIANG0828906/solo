import React, { useState, useEffect, useRef } from 'react';
import {
  Pet,
  Gender,
  VaccineStatus,
  ApplicationStatus,
  Stage,
  STAGE_NAMES,
  AdoptionApplication,
  AdoptionProgress,
} from '@/types';
import {
  addApplication,
  getApplicationsByPetId,
  getProgressByApplicationId,
  updateProgressStage,
} from '@/data';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft,
  Syringe,
  Scissors,
  CalendarDays,
  CheckCircle,
  Clock,
  Info,
} from 'lucide-react';

interface PetDetailProps {
  pet: Pet;
  onBack: () => void;
  refresh: number;
}

const genderLabel: Record<Gender, string> = {
  [Gender.MALE]: '公',
  [Gender.FEMALE]: '母',
  [Gender.UNKNOWN]: '未知',
};

const vaccineLabel: Record<VaccineStatus, string> = {
  [VaccineStatus.FULLY_VACCINATED]: '已完成全部接种',
  [VaccineStatus.PARTIALLY_VACCINATED]: '部分接种中',
  [VaccineStatus.NOT_VACCINATED]: '未接种',
};

const statusLabel: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]: '待审核',
  [ApplicationStatus.APPROVED]: '已通过',
  [ApplicationStatus.REJECTED]: '已拒绝',
};

const statusColor: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [ApplicationStatus.APPROVED]: 'bg-green-100 text-green-700 border-green-200',
  [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-700 border-red-200',
};

const PetDetail: React.FC<PetDetailProps> = ({ pet, onBack, refresh }) => {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [progress, setProgress] = useState<AdoptionProgress | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: '',
    contact: '',
    housingType: '自有住房',
    hasOtherPets: false,
    reason: '',
  });
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const apps = getApplicationsByPetId(pet.id);
    setApplications(apps);
    if (apps.length > 0 && apps[0].status === ApplicationStatus.APPROVED) {
      const prog = getProgressByApplicationId(apps[0].id);
      setProgress(prog ?? null);
    }
    setCurrentPhoto(0);
  }, [pet.id, refresh]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const ageText =
    pet.ageYears > 0
      ? `${pet.ageYears}岁${pet.ageMonths > 0 ? pet.ageMonths + '个月' : ''}`
      : `${pet.ageMonths}个月`;

  const prevPhoto = () => {
    setCurrentPhoto((prev) =>
      prev === 0 ? pet.photos.length - 1 : prev - 1
    );
  };

  const nextPhoto = () => {
    setCurrentPhoto((prev) =>
      prev === pet.photos.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextPhoto();
      else prevPhoto();
    }
    touchStartX.current = null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicantName || !formData.contact || !formData.reason) {
      alert('请填写必填项');
      return;
    }
    addApplication({
      petId: pet.id,
      ...formData,
    });
    setShowForm(false);
    setFormData({
      applicantName: '',
      contact: '',
      housingType: '自有住房',
      hasOtherPets: false,
      reason: '',
    });
    const apps = getApplicationsByPetId(pet.id);
    setApplications(apps);
  };

  const handleAdvanceStage = () => {
    if (!progress) return;
    if (progress.currentStage >= Stage.COMPLETION) return;
    const nextStage = (progress.currentStage + 1) as Stage;
    updateProgressStage(progress.id, nextStage, STAGE_NAMES[nextStage] + '完成');
    const prog = getProgressByApplicationId(progress.applicationId);
    setProgress(prog ?? null);
    setApplications(getApplicationsByPetId(pet.id));
  };

  const myApplication = applications[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F3] via-white to-[#F0F9F2]">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-green-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1
            className="text-xl font-bold text-gray-800"
            style={{ fontFamily: "'Merriweather', serif" }}
          >
            {pet.name}的详情
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div
              className="relative bg-white rounded-2xl overflow-hidden shadow-lg aspect-[4/3] group"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {pet.photos.length > 0 ? (
                <>
                  <div className="absolute inset-0 transition-opacity duration-300">
                    <img
                      src={pet.photos[currentPhoto]}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {pet.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full
                          bg-white/80 text-gray-700 shadow-md opacity-0 group-hover:opacity-100
                          transition-opacity hover:bg-white"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full
                          bg-white/80 text-gray-700 shadow-md opacity-0 group-hover:opacity-100
                          transition-opacity hover:bg-white"
                      >
                        <ChevronRight size={20} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {pet.photos.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPhoto(i)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              i === currentPhoto
                                ? 'bg-white w-6'
                                : 'bg-white/50 hover:bg-white/70'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-green-50">
                  <span className="text-green-300 text-6xl">🐾</span>
                </div>
              )}
            </div>

            {pet.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pet.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      i === currentPhoto
                        ? 'border-green-500 ring-2 ring-green-200'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
              <h3 className="text-lg font-bold text-gray-800 mb-4">关于{pet.name}</h3>
              <p className="text-gray-600 leading-relaxed">{pet.description}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2
                    className="text-2xl font-bold text-gray-800 mb-1"
                    style={{ fontFamily: "'Merriweather', serif" }}
                  >
                    {pet.name}
                  </h2>
                  <p className="text-green-700 font-medium">{pet.breed}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    pet.gender === Gender.MALE
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : 'bg-pink-50 text-pink-600 border border-pink-100'
                  }`}
                >
                  {genderLabel[pet.gender]}
                </span>
              </div>

              <div
                className="grid grid-cols-2 gap-3 text-sm"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <InfoRow label="年龄" value={ageText} />
                <InfoRow label="体重" value={`${pet.weight} kg`} />
                <InfoRow
                  label="绝育"
                  value={pet.neutered ? '已绝育' : '未绝育'}
                />
                <InfoRow label="疫苗" value={vaccineLabel[pet.vaccineStatus]} />
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">性格标签</p>
                <div className="flex flex-wrap gap-2">
                  {pet.personalityTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm rounded-full bg-green-50 text-green-700 border border-green-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {myApplication && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">我的申请状态</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      statusColor[myApplication.status]
                    }`}
                  >
                    {statusLabel[myApplication.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  提交时间：{formatDate(myApplication.createdAt)}
                </p>
                {myApplication.feedback && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">审核反馈</p>
                    <p className="text-sm text-gray-700">{myApplication.feedback}</p>
                  </div>
                )}

                {myApplication.status === ApplicationStatus.APPROVED &&
                  progress && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <CalendarDays size={16} />
                        领养进度
                      </h4>
                      <Timeline
                        progress={progress}
                        hoveredStage={hoveredStage}
                        onHover={setHoveredStage}
                        formatDate={formatDate}
                      />
                      {progress.currentStage < Stage.COMPLETION && (
                        <button
                          onClick={handleAdvanceStage}
                          className="mt-5 w-full py-2.5 bg-gradient-to-r from-green-500 to-green-600
                            text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700
                            transition-all shadow-md hover:shadow-lg"
                        >
                          推进到下一阶段
                        </button>
                      )}
                    </div>
                  )}
              </div>
            )}

            {!myApplication && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500
                  text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl
                  hover:from-green-600 hover:to-emerald-600 transition-all"
              >
                申请领养 {pet.name}
              </button>
            )}

            {showForm && (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-6 shadow-sm border border-green-50"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-800">领养申请表</h3>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      您的姓名 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.applicantName}
                      onChange={(e) =>
                        setFormData({ ...formData, applicantName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200
                        focus:border-green-400 focus:ring-2 focus:ring-green-100
                        outline-none transition-all"
                      placeholder="请输入您的姓名"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      联系方式 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(e) =>
                        setFormData({ ...formData, contact: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200
                        focus:border-green-400 focus:ring-2 focus:ring-green-100
                        outline-none transition-all"
                      placeholder="手机号或微信号"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      居住类型
                    </label>
                    <select
                      value={formData.housingType}
                      onChange={(e) =>
                        setFormData({ ...formData, housingType: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200
                        focus:border-green-400 focus:ring-2 focus:ring-green-100
                        outline-none transition-all bg-white"
                    >
                      <option>自有住房</option>
                      <option>租房</option>
                      <option>与家人同住</option>
                      <option>宿舍</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasOtherPets}
                      onChange={(e) =>
                        setFormData({ ...formData, hasOtherPets: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-green-600
                        focus:ring-green-400"
                    />
                    <span className="text-sm text-gray-700">家中已有其他宠物</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      领养理由 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200
                        focus:border-green-400 focus:ring-2 focus:ring-green-100
                        outline-none transition-all resize-none"
                      placeholder="请简单说明您想领养这只宠物的原因以及对宠物生活的安排"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500
                      text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600
                      transition-all shadow-md hover:shadow-lg"
                  >
                    提交申请
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <span className="text-gray-400">{label}:</span>
    <span className="text-gray-700">{value}</span>
  </div>
);

const Timeline: React.FC<{
  progress: AdoptionProgress;
  hoveredStage: number | null;
  onHover: (stage: number | null) => void;
  formatDate: (s: string | null) => string;
}> = ({ progress, hoveredStage, onHover, formatDate }) => {
  const stages = progress.stages;

  return (
    <div className="relative">
      <div className="relative flex justify-between">
        {stages.map((stageInfo, index) => {
          const isCompleted = index < progress.currentStage || stageInfo.actualDate !== null;
          const isCurrent = index === progress.currentStage && !stageInfo.actualDate;
          const isHovered = hoveredStage === index;

          return (
            <React.Fragment key={index}>
              <div
                className="relative flex flex-col items-center z-10"
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center
                    text-sm font-bold transition-all duration-300 border-2 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                      ? 'bg-white border-green-500 text-green-600 animate-pulse shadow-md shadow-green-200'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle size={16} /> : index + 1}
                </div>
                <p className="mt-2 text-xs text-center font-medium text-gray-600 w-16">
                  {STAGE_NAMES[index as Stage]}
                </p>

                {isHovered && (
                  <div
                    className="absolute -top-16 left-1/2 -translate-x-1/2 w-44
                      bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-20"
                  >
                    <p className="font-semibold mb-1">{STAGE_NAMES[index as Stage]}</p>
                    <p className="text-gray-300">预计: {formatDate(stageInfo.expectedDate)}</p>
                    <p className="text-gray-300">实际: {formatDate(stageInfo.actualDate)}</p>
                    {stageInfo.notes && (
                      <p className="text-gray-400 mt-1 border-t border-gray-700 pt-1">
                        {stageInfo.notes}
                      </p>
                    )}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45" />
                  </div>
                )}
              </div>

              {index < stages.length - 1 && (
                <div
                  className="absolute top-4.5 left-0 right-0 h-0.5 mx-9"
                  style={{ left: `calc(${((index * 2 + 1) / (stages.length * 2)) * 100}%)`, width: `${(100 / stages.length) - 9}%` }}
                >
                  <div className="h-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-green-500 transition-all duration-500 ease-out ${
                        index < progress.currentStage ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex justify-between mt-3 px-0.5">
        {stages.map((s, i) => (
          <div key={i} className="w-16 text-center">
            {s.actualDate ? (
              <div className="flex items-center justify-center gap-1 text-green-600 text-[10px]">
                <CheckCircle size={10} />
                <span>{formatDate(s.actualDate)}</span>
              </div>
            ) : s.expectedDate ? (
              <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px]">
                <Clock size={10} />
                <span>{formatDate(s.expectedDate)}</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PetDetail;
