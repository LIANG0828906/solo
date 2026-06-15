import React, { useState, useMemo, useEffect } from 'react';
import { initializeData, getPets, filterPets, getApplications, updateApplicationStatus } from '@/data';
import { Pet, FilterOptions, ApplicationStatus } from '@/types';
import PetCard from '@/components/PetCard';
import PetDetail from '@/components/PetDetail';
import FilterPanel from '@/components/FilterPanel';
import Stats from '@/pages/Stats';
import { PawPrint, SlidersHorizontal, BarChart3, ClipboardList, Check, X as XIcon } from 'lucide-react';

type View = 'list' | 'detail' | 'stats' | 'admin';

const App: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    breeds: [],
    ageRange: null,
    personalityTags: [],
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initializeData();
    refreshData();
  }, []);

  const refreshData = () => {
    setPets(getPets());
    setRefreshKey((k) => k + 1);
  };

  const filteredPets = useMemo(() => {
    return filterPets(pets, filters);
  }, [pets, filters]);

  const handleCardClick = (pet: Pet) => {
    setSelectedPet(pet);
    setView('detail');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setView('list');
    setSelectedPet(null);
    refreshData();
  };

  if (view === 'stats') {
    return <Stats onBack={handleBack} />;
  }

  if (view === 'detail' && selectedPet) {
    return (
      <PetDetail
        pet={selectedPet}
        onBack={handleBack}
        refresh={refreshKey}
      />
    );
  }

  if (view === 'admin') {
    return <AdminPanel onBack={handleBack} refresh={refreshData} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F3] via-white to-[#F0F9F2]">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-green-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-md">
              <PawPrint size={22} />
            </div>
            <div>
              <h1
                className="text-xl font-bold text-gray-800 leading-tight"
                style={{ fontFamily: "'Merriweather', serif" }}
              >
                萌宠领养
              </h1>
              <p className="text-xs text-gray-500">Pet Adoption Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('stats')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl
                text-sm font-medium text-gray-600 hover:bg-green-50 hover:text-green-700
                transition-colors"
            >
              <BarChart3 size={18} />
              <span>数据看板</span>
            </button>
            <button
              onClick={() => setView('admin')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl
                text-sm font-medium text-gray-600 hover:bg-green-50 hover:text-green-700
                transition-colors"
            >
              <ClipboardList size={18} />
              <span>申请管理</span>
            </button>
            <button
              onClick={() => setFilterOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
        />

        <main className="flex-1 p-4 lg:p-6 min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                className="text-lg font-bold text-gray-800"
                style={{ fontFamily: "'Merriweather', serif" }}
              >
                待领养宠物
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                共 {filteredPets.length} 只可爱的小家伙在等待新家
                {(filters.breeds.length > 0 || filters.personalityTags.length > 0 || filters.ageRange) &&
                  ' (已筛选)'}
              </p>
            </div>

            <div className="sm:hidden flex items-center gap-2">
              <button
                onClick={() => setView('stats')}
                className="p-2.5 rounded-xl bg-green-50 text-green-700"
              >
                <BarChart3 size={18} />
              </button>
              <button
                onClick={() => setView('admin')}
                className="p-2.5 rounded-xl bg-green-50 text-green-700"
              >
                <ClipboardList size={18} />
              </button>
            </div>
          </div>

          {filteredPets.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center text-green-300">
                <PawPrint size={40} />
              </div>
              <p className="text-gray-500 font-medium">没有找到匹配的宠物</p>
              <p className="text-sm text-gray-400 mt-1">试试调整筛选条件吧</p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5"
              style={{ willChange: 'transform' }}
            >
              {filteredPets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onClick={() => handleCardClick(pet)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const AdminPanel: React.FC<{ onBack: () => void; refresh: () => void }> = ({
  onBack,
  refresh,
}) => {
  const [applications, setApplications] = useState<ReturnType<typeof getApplications>>([]);
  const [pets, setPets] = useState<ReturnType<typeof getPets>>([]);

  useEffect(() => {
    setApplications(getApplications());
    setPets(getPets());
  }, []);

  const getPetName = (petId: string) => {
    return pets.find((p) => p.id === petId)?.name ?? '未知';
  };

  const statusLabels: Record<ApplicationStatus, string> = {
    [ApplicationStatus.PENDING]: '待审核',
    [ApplicationStatus.APPROVED]: '已通过',
    [ApplicationStatus.REJECTED]: '已拒绝',
  };

  const statusColors: Record<ApplicationStatus, string> = {
    [ApplicationStatus.PENDING]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    [ApplicationStatus.APPROVED]: 'bg-green-100 text-green-700 border-green-200',
    [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-700 border-red-200',
  };

  const handleApprove = (id: string) => {
    const feedback = prompt('请输入审核通过的反馈：', '恭喜您，申请已通过！我们将尽快联系您安排家访。');
    if (feedback === null) return;
    updateApplicationStatus(id, ApplicationStatus.APPROVED, feedback || '');
    setApplications(getApplications());
    refresh();
  };

  const handleReject = (id: string) => {
    const feedback = prompt('请输入拒绝原因：', '很抱歉，您的申请暂未通过审核，感谢您的关注！');
    if (feedback === null) return;
    updateApplicationStatus(id, ApplicationStatus.REJECTED, feedback || '');
    setApplications(getApplications());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F3] via-white to-[#F0F9F2]">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-green-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors"
          >
            ← 返回
          </button>
          <h1
            className="text-xl font-bold text-gray-800"
            style={{ fontFamily: "'Merriweather', serif" }}
          >
            领养申请管理
          </h1>
          <span className="ml-auto px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            共 {applications.length} 条申请
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {applications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center text-green-300">
              <ClipboardList size={40} />
            </div>
            <p className="text-gray-500 font-medium">暂无领养申请</p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-green-50"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{app.applicantName}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        statusColors[app.status]
                      }`}
                    >
                      {statusLabels[app.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    申请领养: <span className="text-green-700 font-medium">{getPetName(app.petId)}</span>
                    <span className="mx-2">·</span>
                    {new Date(app.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                {app.status === ApplicationStatus.PENDING && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(app.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 text-white
                        text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      <Check size={14} />
                      通过
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600
                        text-sm font-medium hover:bg-red-100 transition-colors border border-red-100"
                    >
                      <XIcon size={14} />
                      拒绝
                    </button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <InfoItem label="联系方式" value={app.contact} />
                <InfoItem label="居住类型" value={app.housingType} />
                <InfoItem label="其他宠物" value={app.hasOtherPets ? '有' : '无'} />
              </div>

              <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">领养理由</p>
                <p className="text-sm text-gray-700">{app.reason}</p>
              </div>

              {app.feedback && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs text-green-600 mb-1 font-medium">审核反馈</p>
                  <p className="text-sm text-gray-700">{app.feedback}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <span className="text-gray-400">{label}:</span>
    <span className="text-gray-700 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {value}
    </span>
  </div>
);

export default App;
