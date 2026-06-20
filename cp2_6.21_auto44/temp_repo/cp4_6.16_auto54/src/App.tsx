import { useEffect, useMemo } from 'react';
import { Plus, Shield, LogOut, KeyRound } from 'lucide-react';
import useVaultStore from '@/store/VaultStore';
import MasterPasswordModal from '@/components/MasterPasswordModal';
import SearchBar from '@/components/SearchBar';
import CategoryTabs from '@/components/CategoryTabs';
import VaultEntryCard from '@/components/VaultEntry';
import AddEntryPanel from '@/components/AddEntryPanel';
import Notification from '@/components/Notification';
import WindowedList from '@/components/WindowedList';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <KeyRound className="w-16 h-16 text-gray-600 mb-4" />
      <h3 className="text-gray-400 text-lg font-medium mb-2">密码库为空</h3>
      <p className="text-gray-500 text-sm max-w-xs">
        点击右下角的加号按钮，添加您的第一个密码条目
      </p>
    </div>
  );
}

function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Shield className="w-16 h-16 text-gray-600 mb-4" />
      <h3 className="text-gray-400 text-lg font-medium mb-2">未找到匹配项</h3>
      <p className="text-gray-500 text-sm">尝试使用其他关键词搜索</p>
    </div>
  );
}

function EntryGrid({ entries }: { entries: ReturnType<typeof useVaultStore.getState>['entries'] }) {
  const useVirtualList = entries.length > 50;

  if (useVirtualList) {
    return (
      <WindowedList
        items={entries}
        itemHeight={120}
        gap={12}
        className="px-[2%]"
        renderItem={(entry) => (
          <div className="px-[1%]">
            <VaultEntryCard entry={entry} />
          </div>
        )}
      />
    );
  }

  return (
    <div className="px-[2%] grid grid-cols-1 sm:grid-cols-2 gap-3">
      {entries.map((entry) => (
        <VaultEntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

export default function App() {
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const isCheckingMaster = useVaultStore((s) => s.isCheckingMaster);
  const checkMasterKey = useVaultStore((s) => s.checkMasterKey);
  const openAddPanel = useVaultStore((s) => s.openAddPanel);
  const lock = useVaultStore((s) => s.lock);
  const filteredEntriesFn = useVaultStore((s) => s.filteredEntries);
  const allEntries = useVaultStore((s) => s.entries);
  const category = useVaultStore((s) => s.category);
  const searchQuery = useVaultStore((s) => s.searchQuery);

  const entries = useMemo(() => filteredEntriesFn(), [allEntries, category, searchQuery, filteredEntriesFn]);

  useEffect(() => {
    checkMasterKey();
  }, []);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0f172a]">
        <MasterPasswordModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <header className="sticky top-0 z-30 bg-[#0f172a]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
        <div className="px-[2%] py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#38bdf8]" />
            <span className="text-white font-bold text-sm bg-gradient-to-r from-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent">
              VaultPass
            </span>
          </div>
          <button
            onClick={lock}
            className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
          >
            <LogOut className="w-4 h-4" />
            锁定
          </button>
        </div>
      </header>

      <SearchBar />
      <CategoryTabs />

      <main className="flex-1 overflow-y-auto pb-24 pt-2">
        {entries.length === 0 ? (
          searchQuery ? (
            <NoResults />
          ) : (
            <EmptyState />
          )
        ) : (
          <EntryGrid entries={entries} />
        )}
      </main>

      <button
        onClick={openAddPanel}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#818cf8] text-white shadow-lg shadow-[#38bdf8]/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddEntryPanel />
      <Notification />
    </div>
  );
}
