import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { BottleData } from '../types';
import { useCartStore } from '../stores/cartStore';

const BOTTLES: BottleData[] = [
  { id: 'whiskey', name: '波本威士忌', color: '#d4a574', abv: 40, type: 'base', labelColor: '#f4d03f' },
  { id: 'vodka', name: '伏特加', color: '#e8e8e8', abv: 40, type: 'base', labelColor: '#3498db' },
  { id: 'gin', name: '金酒', color: '#d5f5e3', abv: 37.5, type: 'base', labelColor: '#27ae60' },
  { id: 'rum', name: '朗姆酒', color: '#f5cba7', abv: 38, type: 'base', labelColor: '#e67e22' },
  { id: 'tequila', name: '龙舌兰', color: '#f9e79f', abv: 38, type: 'base', labelColor: '#f1c40f' },
  { id: 'mint', name: '薄荷酒', color: '#82e0aa', abv: 25, type: 'mixer', labelColor: '#1abc9c' },
  { id: 'bitters', name: '安格斯特拉苦精', color: '#7b241c', abv: 44.7, type: 'mixer', labelColor: '#922b21' },
  { id: 'vermouth', name: '味美思', color: '#a93226', abv: 18, type: 'mixer', labelColor: '#c0392b' },
  { id: 'triple-sec', name: '橙味力娇酒', color: '#f9e79f', abv: 30, type: 'mixer', labelColor: '#f39c12' },
  { id: 'lime-juice', name: '青柠汁', color: '#abebc6', abv: 0, type: 'mixer', labelColor: '#2ecc71' },
  { id: 'simple-syrup', name: '糖浆', color: '#fef9e7', abv: 0, type: 'mixer', labelColor: '#f7dc6f' },
  { id: 'cola', name: '可乐', color: '#4a235a', abv: 0, type: 'mixer', labelColor: '#884ea0' },
];

const GARNISHES: BottleData[] = [
  { id: 'lemon', name: '柠檬片', color: '#f7dc6f', abv: 0, type: 'garnish' },
  { id: 'olive', name: '橄榄', color: '#1e8449', abv: 0, type: 'garnish' },
  { id: 'cherry', name: '樱桃', color: '#e74c3c', abv: 0, type: 'garnish' },
  { id: 'straw', name: '吸管', color: '#f1948a', abv: 0, type: 'garnish' },
  { id: 'mint-leaf', name: '薄荷叶', color: '#27ae60', abv: 0, type: 'garnish' },
];

interface BottleProps {
  bottle: BottleData;
  isGarnish?: boolean;
}

function Bottle({ bottle, isGarnish = false }: BottleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addIngredient } = useCartStore();
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: bottle.id,
    data: bottle,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 0.8 : 1})`,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'grab',
    transition: 'transform 0.1s ease-out',
  } : {
    cursor: 'grab',
  };

  const handleDragStart = () => {
    addIngredient(bottle);
  };

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onDragStart={handleDragStart}
        className="relative transition-all duration-100"
      >
        {isDragging && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-yellow-400 opacity-60"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animation: `pulse 0.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}
        
        {isGarnish ? (
          <GarnishSVG name={bottle.id} color={bottle.color} />
        ) : (
          <BottleSVG color={bottle.color} labelColor={bottle.labelColor || '#f4d03f'} />
        )}
      </div>
      
      {isHovered && !isDragging && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-50 shadow-xl border border-yellow-500/30">
          <div className="font-semibold text-yellow-400">{bottle.name}</div>
          {bottle.abv > 0 && <div className="text-gray-300">酒精度: {bottle.abv}%</div>}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-yellow-500/30" />
        </div>
      )}
      
      <span className="text-xs text-gray-400 mt-1 truncate w-16 text-center">
        {bottle.name.length > 4 ? bottle.name.slice(0, 4) + '...' : bottle.name}
      </span>
    </div>
  );
}

function BottleSVG({ color, labelColor }: { color: string; labelColor: string }) {
  return (
    <svg width="40" height="70" viewBox="0 0 40 70" className="drop-shadow-lg">
      <defs>
        <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="labelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={labelColor} stopOpacity="0.9" />
          <stop offset="50%" stopColor={labelColor} stopOpacity="1" />
          <stop offset="100%" stopColor={labelColor} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      <path d="M15 0 L25 0 L25 10 L27 15 L27 55 Q27 65 20 65 Q13 65 13 55 L13 15 L15 10 Z" 
            fill="url(#bottleGrad)" 
            stroke="#2c1810" 
            strokeWidth="1" />
      
      <rect x="13" y="10" width="14" height="5" fill="#3d2817" rx="1" />
      
      <rect x="14" y="40" width="12" height="18" fill="url(#labelGrad)" rx="1" />
      <rect x="15" y="41" width="10" height="16" fill="none" stroke="#8b6914" strokeWidth="0.5" rx="0.5" />
      
      <ellipse cx="20" cy="63" rx="5" ry="1.5" fill="#1a0f0a" opacity="0.5" />
      
      <path d="M16 20 L16 35" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
    </svg>
  );
}

function GarnishSVG({ name, color }: { name: string; color: string }) {
  if (name === 'lemon') {
    return (
      <svg width="45" height="45" viewBox="0 0 45 45" className="drop-shadow-md">
        <circle cx="22.5" cy="22.5" r="18" fill={color} fillOpacity="0.6" stroke="#d4ac0d" strokeWidth="1" />
        <circle cx="22.5" cy="22.5" r="10" fill="none" stroke="#d4ac0d" strokeWidth="1" strokeOpacity="0.5" />
        {[...Array(8)].map((_, i) => (
          <line key={i} x1="22.5" y1="12" x2="22.5" y2="6" 
                stroke="#d4ac0d" strokeWidth="1" strokeOpacity="0.5"
                transform={`rotate(${i * 45} 22.5 22.5)`} />
        ))}
      </svg>
    );
  }
  
  if (name === 'olive') {
    return (
      <svg width="35" height="45" viewBox="0 0 35 45" className="drop-shadow-md">
        <path d="M17.5 5 Q12 5 10 12 Q8 20 12 28 Q15 35 17.5 38 Q20 35 23 28 Q27 20 25 12 Q23 5 17.5 5" 
              fill={color} stroke="#145a32" strokeWidth="1" />
        <ellipse cx="14" cy="18" rx="2" ry="3" fill="#145a32" opacity="0.5" />
        <rect x="16" y="0" width="3" height="8" fill="#8b4513" rx="1" />
      </svg>
    );
  }
  
  if (name === 'cherry') {
    return (
      <svg width="40" height="50" viewBox="0 0 40 50" className="drop-shadow-md">
        <circle cx="15" cy="35" r="10" fill={color} stroke="#922b21" strokeWidth="1" />
        <circle cx="28" cy="38" r="9" fill={color} stroke="#922b21" strokeWidth="1" />
        <ellipse cx="12" cy="32" rx="2" ry="3" fill="white" opacity="0.4" />
        <ellipse cx="25" cy="35" rx="2" ry="2.5" fill="white" opacity="0.4" />
        <path d="M15 25 Q18 15 20 10 Q22 8 25 10 Q27 15 28 25" 
              fill="none" stroke="#27ae60" strokeWidth="2" />
      </svg>
    );
  }
  
  if (name === 'straw') {
    return (
      <svg width="20" height="60" viewBox="0 0 20 60" className="drop-shadow-md">
        <path d="M8 0 L12 0 L10 50 L8 50 Z" fill={color} stroke="#e74c3c" strokeWidth="0.5" />
        <ellipse cx="10" cy="0" rx="4" ry="1.5" fill={color} />
        <ellipse cx="9" cy="50" rx="3" ry="1.5" fill="#c0392b" />
        <line x1="8" y1="15" x2="12" y2="15" stroke="#c0392b" strokeWidth="0.5" />
        <line x1="8" y1="30" x2="12" y2="30" stroke="#c0392b" strokeWidth="0.5" />
        <line x1="8" y1="45" x2="12" y2="45" stroke="#c0392b" strokeWidth="0.5" />
      </svg>
    );
  }
  
  if (name === 'mint-leaf') {
    return (
      <svg width="40" height="45" viewBox="0 0 40 45" className="drop-shadow-md">
        <path d="M20 0 Q5 15 10 30 Q15 40 20 43 Q25 40 30 30 Q35 15 20 0" 
              fill={color} stroke="#1e8449" strokeWidth="1" />
        <path d="M20 5 L20 38" stroke="#1e8449" strokeWidth="1" />
        {[...Array(4)].map((_, i) => (
          <React.Fragment key={i}>
            <line x1="20" y1={10 + i * 7} x2={12} y2={14 + i * 7} stroke="#1e8449" strokeWidth="0.5" />
            <line x1="20" y1={10 + i * 7} x2={28} y2={14 + i * 7} stroke="#1e8449" strokeWidth="0.5" />
          </React.Fragment>
        ))}
      </svg>
    );
  }
  
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="15" fill={color} />
    </svg>
  );
}

export function BarShelf() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 bg-gradient-to-b from-amber-900/50 to-transparent">
        <h3 className="text-yellow-400 font-semibold text-sm tracking-wider" style={{ fontFamily: "'Playfair Display', serif" }}>
          酒 瓶 架
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'thin' }}>
        <div className="mb-2 text-xs text-gray-500 uppercase tracking-wider">基酒</div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {BOTTLES.filter(b => b.type === 'base').map((bottle) => (
            <Bottle key={bottle.id} bottle={bottle} />
          ))}
        </div>
        
        <div className="mb-2 text-xs text-gray-500 uppercase tracking-wider">辅料</div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {BOTTLES.filter(b => b.type === 'mixer').map((bottle) => (
            <Bottle key={bottle.id} bottle={bottle} />
          ))}
        </div>
        
        <div className="mb-2 text-xs text-gray-500 uppercase tracking-wider">装饰物</div>
        <div className="grid grid-cols-3 gap-3">
          {GARNISHES.map((garnish) => (
            <Bottle key={garnish.id} bottle={garnish} isGarnish />
          ))}
        </div>
      </div>
    </div>
  );
}
