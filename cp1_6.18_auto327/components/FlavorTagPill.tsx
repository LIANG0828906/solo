interface FlavorTagPillProps {
  name: string;
  color: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function FlavorTagPill({ name, color, size = 'md', className = '' }: FlavorTagPillProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span
      className={`flavor-pill ${sizeClasses} ${className}`}
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}
