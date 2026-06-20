import React, { useState } from 'react';
import { Maximize2, RotateCw, RotateCcw } from 'lucide-react';

interface ToolbarProps {
  autoRotate: boolean;
  onCenter: () => void;
  onToggleAutoRotate: () => void;
  onReset: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  autoRotate,
  onCenter,
  onToggleAutoRotate,
  onReset,
}) => {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const handleButtonClick = (action: string, handler: () => void) => {
    setPressedButton(action);
    handler();
    setTimeout(() => setPressedButton(null), 100);
  };

  const buttons = [
    {
      id: 'center',
      icon: Maximize2,
      label: '居中对齐',
      handler: onCenter,
    },
    {
      id: 'rotate',
      icon: RotateCw,
      label: '自动旋转',
      active: autoRotate,
      handler: onToggleAutoRotate,
    },
    {
      id: 'reset',
      icon: RotateCcw,
      label: '重置视角',
      handler: onReset,
    },
  ];

  return (
    <div
      className="fixed left-4 top-1/2 -translate-y-1/2 w-10 rounded-[8px] flex flex-col items-center gap-2 py-3 z-50"
      style={{ background: '#2A2A3A' }}
    >
      {buttons.map(({ id, icon: Icon, label, active, handler }) => (
        <button
          key={id}
          onClick={() => handleButtonClick(id, handler)}
          title={label}
          className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition-all duration-150 relative group ${
            active ? 'bg-[#4A7FFF]' : 'hover:bg-[#3A3A4A]'
          }`}
          style={{
            transform: pressedButton === id ? 'scale(0.92)' : 'scale(1)',
          }}
        >
          <Icon size={16} className="text-white" />
          <span className="absolute left-full ml-2 px-2 py-1 rounded-md text-[11px] text-white bg-[#3A3A4A] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};
