import { cn } from '@/lib/utils';

interface GlassInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  error?: string;
}

export default function GlassInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  error,
}: GlassInputProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-navy-800 text-sm font-medium mb-1.5">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('glass-input', error && 'border-red-400 focus:ring-red-400/50 focus:border-red-400')}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
