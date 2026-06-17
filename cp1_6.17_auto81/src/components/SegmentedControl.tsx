import './SegmentedControl.css';

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  const selectedIndex = options.findIndex((o) => o.value === value);

  return (
    <div className="segmented-control">
      <div
        className="segmented-indicator"
        style={{
          transform: `translateX(${selectedIndex * 100}%)`,
          width: `${100 / options.length}%`,
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          className={`segmented-button ${value === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
