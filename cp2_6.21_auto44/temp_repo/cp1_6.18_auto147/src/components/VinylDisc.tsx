import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VinylDiscProps {
  color: string;
  isPlaying: boolean;
  onClick: () => void;
  title: string;
  artist: string;
  year: number;
}

export default function VinylDisc({
  color,
  isPlaying,
  onClick,
  title,
  artist,
  year,
}: VinylDiscProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      const maxTilt = 10;
      const minTilt = -5;

      const rotY = (mouseX / (rect.width / 2)) * maxTilt;
      const rotX = -(mouseY / (rect.height / 2)) * maxTilt;

      setRotateY(Math.max(minTilt, Math.min(maxTilt, rotY)));
      setRotateX(Math.max(minTilt, Math.min(maxTilt, rotX)));
    };

    const handleMouseLeave = () => {
      setRotateX(0);
      setRotateY(0);
      setIsHovered(false);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer group"
      style={{
        perspective: '1000px',
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative w-64 h-64 rounded-full shadow-2xl',
          isPlaying && 'animate-spin-slow',
          isHovered && 'animate-spin-paused'
        )}
        style={{
          background: `
            radial-gradient(circle at center, #000 0%, #000 8%, transparent 8%),
            repeating-radial-gradient(circle at center, #111 0%, #1a1a1a 2px, #0a0a0a 4px, #111 6px),
            #000
          `,
        }}
      >
        <div
          className="absolute inset-8 rounded-full"
          style={{ backgroundColor: color }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          <div className="absolute inset-12 rounded-full bg-black flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-gray-800 border border-gray-700" />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
          'backdrop-blur-8 rounded-[8px]',
          isHovered && 'opacity-100'
        )}
        style={{ backgroundColor: '#FFFFFF10' }}
      >
        <div className="text-center p-4 animate-fade-in">
          <h3 className="text-xl font-bold text-white font-display mb-2">{title}</h3>
          <p className="text-gray-300 mb-1">{artist}</p>
          <p className="text-gray-400 text-sm">{year}</p>
        </div>
      </div>
    </div>
  );
}
