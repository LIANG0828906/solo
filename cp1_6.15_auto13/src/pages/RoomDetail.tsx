import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Calendar, ListChecks } from 'lucide-react';
import useStore from '@/store/useStore';
import BudgetPanel from '@/components/BudgetPanel';
import GanttChart from '@/components/GanttChart';
import MaterialTable from '@/components/MaterialTable';
import Skeleton from '@/components/Skeleton';

export default function RoomDetail() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { rooms, loading, activeTab, selectRoom, clearSelection, setActiveTab } = useStore();

  useEffect(() => {
    if (roomId) {
      selectRoom(roomId);
    }
    return () => {
      clearSelection();
    };
  }, [roomId, selectRoom, clearSelection]);

  const room = rooms.find((r) => r.id === roomId);

  const tabs = [
    { key: 'budget' as const, label: '预算看板', icon: Wallet },
    { key: 'gantt' as const, label: '进度甘特图', icon: Calendar },
    { key: 'materials' as const, label: '物料清单', icon: ListChecks },
  ];

  return (
    <div className="min-h-screen bg-cream" style={{ padding: '32px' }}>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-wood-500 hover:text-wood-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>返回看板</span>
      </button>

      <h1 className="font-serif text-3xl mb-6" style={{ color: '#5A4524' }}>
        {room?.name || '加载中...'}
      </h1>

      <div className="flex gap-8 border-b border-wood-200 mb-8">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`tabs-indicator pb-3 flex items-center gap-2 transition-colors ${
              activeTab === key ? 'active font-semibold' : ''
            }`}
            style={{
              color: activeTab === key ? '#8B6914' : '#9C8B70',
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="animate-fadeIn">
        {loading ? (
          <div className="space-y-4">
            <Skeleton width="100%" height={60} />
            <Skeleton width="100%" height={300} />
            <Skeleton width="80%" height={40} />
          </div>
        ) : activeTab === 'budget' ? (
          <BudgetPanel />
        ) : activeTab === 'gantt' ? (
          <GanttChart />
        ) : (
          <MaterialTable />
        )}
      </div>
    </div>
  );
}
