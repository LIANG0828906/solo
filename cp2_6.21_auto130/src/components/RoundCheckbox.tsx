import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoundCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

const ICON_SIZES = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
} as const;

export default function RoundCheckbox({
  checked,
  onChange,
  id,
  label,
  disabled = false,
  className,
  size = 'md',
}: RoundCheckboxProps) {
  const boxClass = SIZE_CLASSES[size];
  const iconClass = ICON_SIZES[size];

  const handleClick = () => {
    if (!disabled) onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  const checkbox = (
    <div
      id={id}
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
        boxClass,
        checked
          ? 'border-primary bg-primary shadow-inner shadow-primary/30'
          : 'border-gray-300 bg-white hover:border-primary/60',
        disabled && 'cursor-not-allowed opacity-50 hover:border-gray-300',
        !disabled && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2'
      )}
    >
      {checked && (
        <Check
          className={cn(iconClass, 'text-white animate-pop')}
          strokeWidth={3.5}
        />
      )}
    </div>
  );

  if (!label) return checkbox;

  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-2.5',
        disabled && 'cursor-not-allowed',
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        handleClick();
      }}
    >
      {checkbox}
      <span className={cn('text-sm text-gray-700', disabled && 'text-gray-400')}>{label}</span>
    </label>
  );
}
