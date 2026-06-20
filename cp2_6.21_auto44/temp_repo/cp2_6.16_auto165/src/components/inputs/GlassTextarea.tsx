import { cn } from '@/lib/utils';

interface GlassTextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  error?: string;
}

export default function GlassTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
  error,
}: GlassTextareaProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-navy-800 text-sm font-medium mb-1.5">
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          'glass-input resize-y min-h-[80px]',
          error && 'border-red-400 focus:ring-red-400/50 focus:border-red-400',
        )}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
