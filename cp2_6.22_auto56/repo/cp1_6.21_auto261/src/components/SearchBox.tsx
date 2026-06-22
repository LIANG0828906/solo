import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBox({ value, onChange, placeholder }: SearchBoxProps) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Search size={16} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-[280px] h-9 pl-10 pr-4 rounded-lg text-sm text-gray-900 placeholder-gray-400 border transition-colors duration-200 ease focus:outline-none focus:ring-0'
        )}
        style={{
          backgroundColor: '#F9FAFB',
          borderColor: '#D1D5DB',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3B82F6';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#D1D5DB';
        }}
      />
    </div>
  );
}
