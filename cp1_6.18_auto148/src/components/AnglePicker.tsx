import React, { useRef, useState, useCallback, useEffect } from 'react';

interface AnglePickerProps {
  angle: number;
  onChange: (angle: number) => void;
}

const AnglePicker: React.FC<AnglePickerProps> = ({ angle, onChange }) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    if (!pickerRef.current) return angle;
    
    const rect = pickerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    let newAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    if (newAngle < 0) newAngle += 360;
    
    return Math.round(newAngle);
  }, [angle]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const newAngle = calculateAngle(e.clientX, e.clientY);
    onChange(newAngle);
  }, [calculateAngle, onChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newAngle = calculateAngle(e.clientX, e.clientY);
    onChange(newAngle);
  }, [isDragging, calculateAngle, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const pointerLength = 28;
  const centerSize = 8;

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <div
          ref={pickerRef}
          className="relative rounded-full bg-white/5 border border-white/10 cursor-pointer select-none transition-all duration-200 hover:bg-white/10"
          style={{ width: '80px', height: '80px' }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-0 rounded-full" style={{
            background: `conic-gradient(from ${angle - 90}deg, rgba(78, 205, 196, 0.3), rgba(255, 107, 107, 0.3)`
          }} />
          
          <div
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className="relative"
              style={{ width: '2px', height: `${pointerLength}px`, marginTop: `-${pointerLength - centerSize / 2}px` }}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan-400 to-teal-400"
                style={{ width: '6px', height: '6px' }}
              />
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white/80"
                style={{
                  width: '2px',
                  height: `${pointerLength - 6}px`,
                  clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                }}
              />
            </div>
          </div>
          
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-gray-800 shadow-lg"
            style={{ width: `${centerSize}px`, height: `${centerSize}px` }}
          />
          
          {[0, 90, 180, 270].map((deg) => (
            <div
              key={deg}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                top: deg === 0 ? '4px' : deg === 180 ? 'auto' : '50%',
                bottom: deg === 180 ? '4px' : 'auto',
                left: deg === 270 ? '4px' : deg === 90 ? 'auto' : '50%',
                right: deg === 90 ? '4px' : 'auto',
                transform: deg === 0 || deg === 180 ? 'translateX(-50%)' : 'translateY(-50%)',
              }}
            />
          ))}
        </div>
        <div className="text-sm text-gray-400 font-mono">{angle}°</div>
      </div>
      
      <div className="flex flex-col gap-2">
        <input
          type="range"
          min="0"
          max="360"
          value={angle}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-32 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex gap-2">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <button
              key={deg}
              onClick={() => onChange(deg)}
              className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                angle === deg
                  ? 'bg-cyan-500/30 text-cyan-400'
                  : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(AnglePicker);
