import { useState } from 'react';
import { FaLeaf } from 'react-icons/fa';

interface FloatingLeafProps {
  onClick: () => void;
}

export function FloatingLeaf({ onClick }: FloatingLeafProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/40 focus:outline-none focus:ring-4 focus:ring-emerald-300"
      style={{
        animation: 'float 3s ease-in-out infinite'
      }}
      title="查看碳足迹统计"
    >
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-5px) rotate(5deg); }
            50% { transform: translateY(0) rotate(10deg); }
            75% { transform: translateY(-5px) rotate(5deg); }
          }
        `}
      </style>

      <div
        className="absolute inset-0 rounded-full bg-emerald-400 opacity-30"
        style={{
          animation: 'pulse-ring 2s ease-out infinite'
        }}
      >
        <style>
          {`
            @keyframes pulse-ring {
              0% { transform: scale(1); opacity: 0.4; }
              100% { transform: scale(1.5); opacity: 0; }
            }
          `}
        </style>
      </div>

      <FaLeaf
        className="text-white relative z-10"
        size={24}
        style={{
          animation: 'spin-leaf 1.5s linear infinite',
          animationPlayState: isHovered ? 'running' : 'running'
        }}
      />

      <style>
        {`
          @keyframes spin-leaf {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {isHovered && (
        <span className="absolute right-full mr-3 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 animate-fade-in">
          碳足迹统计
        </span>
      )}
    </button>
  );
}
