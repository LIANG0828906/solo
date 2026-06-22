import { useAppStore } from '@/store/appStore';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const searchQuery = useAppStore(s => s.searchQuery);
  const setSearchQuery = useAppStore(s => s.setSearchQuery);

  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A6A] pointer-events-none"
      />
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="搜索灵感..."
        className="w-[200px] pl-8 pr-3 py-1.5 rounded-full border border-[#2A2A44] text-white placeholder-[#4A4A6A] text-xs focus:outline-none focus:border-[#6BCB77] transition-colors"
        style={{ backgroundColor: '#2D2D44' }}
      />
    </div>
  );
}
