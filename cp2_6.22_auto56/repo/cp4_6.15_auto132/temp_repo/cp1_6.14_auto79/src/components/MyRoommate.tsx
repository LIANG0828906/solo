import { useEffect, useState } from 'react';
import { MapPin, Wallet, Calendar, ShoppingCart, UserRound } from 'lucide-react';
import { transactionsApi, type HouseInfo } from '../services/api';
import RentSplitter from './RentSplitter';
import CleaningSchedule from './CleaningSchedule';
import ShoppingList from './ShoppingList';

type TabKey = 'rent' | 'duty' | 'grocery';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'rent', label: '房租分摊', icon: Wallet },
  { key: 'duty', label: '值日表', icon: Calendar },
  { key: 'grocery', label: '采买清单', icon: ShoppingCart },
];

export default function MyRoommate({ initialTab = 'rent' }: { initialTab?: TabKey }) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [house, setHouse] = useState<HouseInfo | null>(null);

  useEffect(() => {
    transactionsApi.getHouse().then(setHouse);
  }, []);

  if (!house) {
    return (
      <div className="glass-card p-16 text-center">
        <UserRound size={48} className="mx-auto mb-4 opacity-40 text-[#4a90a4]" />
        <p className="text-[#6b7c8a]">正在加载合租信息...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="glass-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4a90a4]/10 text-[#356d7e] text-xs font-semibold mb-3">
              <MapPin size={13} />
              当前合租房
            </div>
            <h2 className="font-serif-sc text-2xl sm:text-3xl font-bold text-[#2c3e50] mb-2">
              {house.address}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#6b7c8a]">
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={15} />
                月租总{' '}
                <span className="font-bold text-[#cfad7b] text-base">
                  ¥{house.totalRent.toLocaleString()}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserRound size={15} />
                共{' '}
                <span className="font-bold text-[#356d7e] text-base">
                  {house.members.length}
                </span>{' '}
                位室友
              </span>
            </div>
          </div>
          <div className="avatar-stack flex items-center shrink-0">
            {house.members.map((m, i) => (
              <div
                key={m.id}
                className="relative fade-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <img
                  src={m.avatar}
                  alt={m.nickname}
                  className="w-14 h-14 rounded-2xl border-4 border-white bg-white/80 shadow-md"
                  title={m.nickname}
                />
                {i === 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#4a90a4] to-[#6eb4c7] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    我
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tab-item inline-flex items-center gap-2 ${tab === t.key ? 'active' : ''}`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div key={tab} className="fade-in">
        {tab === 'rent' && <RentSplitter house={house} />}
        {tab === 'duty' && <CleaningSchedule house={house} />}
        {tab === 'grocery' && <ShoppingList />}
      </div>
    </div>
  );
}
