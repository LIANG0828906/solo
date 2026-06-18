import { useRef, useState, useCallback, useEffect } from 'react';

interface KnobProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const Knob: React.FC<KnobProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const minAngle = -135;
  const maxAngle = 135;
  const angleRange = maxAngle - minAngle;
  const valueRange = max - min;

  const angle =
    minAngle + ((value - min) / valueRange) * angleRange;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startYRef.current = e.clientY;
      startValueRef.current = value;
    },
    [value]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY;
      const sensitivity = 1.5;
      const deltaValue = (deltaY / 100) * valueRange * sensitivity;
      let newValue = startValueRef.current + deltaValue;
      newValue = Math.max(min, Math.min(max, Math.round(newValue)));
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, valueRange, onChange]);

  return (
    <div className="knob-container">
      <span className="knob-label">{label}</span>
      <div
        ref={knobRef}
        className="knob"
        onMouseDown={handleMouseDown}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <div
          className="knob-pointer"
          style={{
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>
      <span className="knob-value">{value}</span>
    </div>
  );
};

export default Knob;
