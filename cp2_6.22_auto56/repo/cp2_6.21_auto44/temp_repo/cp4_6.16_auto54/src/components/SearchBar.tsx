import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import useVaultStore from '@/store/VaultStore';

function SearchBar() {
  const setSearchQuery = useVaultStore((s) => s.setSearchQuery);
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchQuery(v);
    }, 300);
  };

  const handleClear = () => {
    setValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    setSearchQuery('');
  };

  return (
    <div className="sticky top-0 z-30 px-[2%] py-3 bg-[#0f172a]/95 backdrop-blur-md">
      <div className="relative flex items-center">
        <Search className="absolute left-4 text-gray-500 w-5 h-5" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="搜索密码库..."
          className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl pl-11 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#38bdf8]/50 transition-all duration-200"
        />
        {value && (
          <button onClick={handleClear} className="absolute right-3 text-gray-500 hover:text-white transition-colors w-4 h-4">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
