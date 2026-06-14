import { useEffect } from 'react';
import { Plus, Download, CalendarHeart } from 'lucide-react';
import { BirthdayList } from '@/components/BirthdayList';
import { GiftFinder } from '@/components/GiftFinder';
import { AddBirthdayForm } from '@/components/AddBirthdayForm';
import { EditBirthdayModal } from '@/components/EditBirthdayModal';
import { UpcomingBanner } from '@/components/UpcomingBanner';
import { useBirthdayStore } from '@/store/useBirthdayStore';

export default function App() {
  const {
    people,
    selectedPerson,
    isGiftModalOpen,
    isAddModalOpen,
    isEditModalOpen,
    openAddModal,
    exportToJSON,
    loadFromStorage,
  } = useBirthdayStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CalendarHeart className="text-[#D4AF37]" size={48} />
            <h1 className="text-4xl md:text-5xl font-bold font-display">
              生日提醒助手
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            记录每一个重要的日子，送上最贴心的祝福与礼物灵感
          </p>
          <div className="h-0.5 w-24 bg-[#D4AF37] mx-auto mt-6 rounded-full" />
        </header>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button onClick={openAddModal} className="btn-gold flex items-center gap-2">
            <Plus size={20} />
            添加生日
          </button>
          <button
            onClick={exportToJSON}
            className="btn-secondary flex items-center gap-2"
            disabled={people.length === 0}
          >
            <Download size={20} />
            导出数据
          </button>
        </div>

        {/* Upcoming Birthdays Banner */}
        <UpcomingBanner people={people} />

        {/* Birthday List Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">📋</span>
            <h2 className="text-xl font-bold font-display">
              所有生日记录
              <span className="ml-2 text-sm font-normal text-gray-300">
                共 {people.length} 位
              </span>
            </h2>
          </div>
          <BirthdayList people={people} />
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>💝 用心记录每一个特别的日子</p>
          <p className="mt-2">数据保存在本地浏览器中，请定期导出备份</p>
        </footer>
      </div>

      {/* Modals */}
      {isAddModalOpen && <AddBirthdayForm />}
      {isEditModalOpen && selectedPerson && (
        <EditBirthdayModal person={selectedPerson} />
      )}
      {isGiftModalOpen && selectedPerson && (
        <GiftFinder person={selectedPerson} />
      )}
    </div>
  );
}
