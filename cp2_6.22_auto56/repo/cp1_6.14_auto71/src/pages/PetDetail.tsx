import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPet } from '../api';
import type { Pet, TabType } from '../types';
import RecordsTimeline from './PetDetail/RecordsTimeline';
import MedicalCalendar from './PetDetail/MedicalCalendar';
import GrowthChart from './PetDetail/GrowthChart';
import Album from './PetDetail/Album';

const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'records', label: '日常记录', icon: '📝' },
  { key: 'medical', label: '医疗日历', icon: '💊' },
  { key: 'growth', label: '成长图表', icon: '📈' },
  { key: 'album', label: '相册', icon: '🖼️' },
];

const PetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('records');
  const [tabDirection, setTabDirection] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPet(id);
    }
  }, [id]);

  const loadPet = async (petId: string) => {
    try {
      const response = await getPet(petId);
      if (response.data) {
        setPet(response.data);
      }
    } catch (error) {
      console.error('Failed to load pet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    const currentIndex = tabs.findIndex((t) => t.key === activeTab);
    const newIndex = tabs.findIndex((t) => t.key === tab);
    setTabDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="glass-card p-8 animate-shimmer h-96" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container">
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">宠物不存在</h2>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const genderText = pet.gender === 'male' ? '公' : '母';
  const speciesText = pet.species === 'dog' ? '🐕 狗狗' : pet.species === 'cat' ? '🐱 猫咪' : '🐾 其他';

  const renderTabContent = () => {
    const content = (
      <div style={{ padding: '24px 0' }}>
        {activeTab === 'records' && <RecordsTimeline petId={pet.id} />}
        {activeTab === 'medical' && <MedicalCalendar petId={pet.id} />}
        {activeTab === 'growth' && <GrowthChart petId={pet.id} />}
        {activeTab === 'album' && <Album petId={pet.id} />}
      </div>
    );

    return (
      <div
        key={activeTab}
        style={{
          animation: `slide${tabDirection > 0 ? 'Left' : 'Right'} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`,
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="btn btn-secondary mb-6">
        ← 返回
      </button>

      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative w-32 h-32 flex-shrink-0">
            <div
              className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #fbcfe8, #bbf7d0)',
              }}
            >
              <img
                src={pet.avatar || '/uploads/default-avatar.png'}
                alt={pet.name}
                className="w-full h-full object-cover"
                style={{ clipPath: 'circle(50% at 50% 50%)' }}
              />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold gradient-text">{pet.name}</h1>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  background: pet.gender === 'male' ? '#dbeafe' : '#fce7f3',
                  color: pet.gender === 'male' ? '#3b82f6' : '#ec4899',
                }}
              >
                {genderText}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-600 mb-4">
              <span>{speciesText}</span>
              <span>·</span>
              <span>{pet.breed}</span>
              {pet.weight && (
                <>
                  <span>·</span>
                  <span>⚖️ {pet.weight}kg</span>
                </>
              )}
            </div>

            {pet.birthday && (
              <div className="text-gray-500 text-sm">
                🎂 出生于 {new Date(pet.birthday).toLocaleDateString('zh-CN')}
              </div>
            )}

            {pet.description && (
              <div className="mt-4 p-4 bg-white bg-opacity-50 rounded-xl text-gray-600">
                {pet.description}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="relative flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 py-4 px-2 text-sm font-medium transition-all duration-200 relative ${
                activeTab === tab.key ? 'text-pink-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
          <div
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-pink-400 to-green-400 transition-all duration-300 ease-out"
            style={{
              width: `${100 / tabs.length}%`,
              left: `${tabs.findIndex((t) => t.key === activeTab) * (100 / tabs.length)}%`,
            }}
          />
        </div>

        {renderTabContent()}
      </div>

      <style>{`
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default PetDetail;
