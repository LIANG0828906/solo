import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = '搜索食谱、食材或菜系…',
}: SearchBarProps) {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <Search size={20} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary focus:shadow-search-focus transition-all duration-200"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          ×
        </button>
      )}
    </div>
  );
}
