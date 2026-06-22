import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SVG } from '@svgdotjs/svg.js';
import type { Spice } from '../types';
import { useSpiceStore } from '../store/spiceStore';

interface SpiceJarProps {
  spice: Spice;
  onDragStart: (spiceId: string) => void;
  onDragEnd: () => void;
  onDropOnScale: (spiceId: string) => void;
}

function SpiceJar({ spice, onDragStart, onDragEnd, onDropOnScale }: SpiceJarProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const addParticle = useSpiceStore(state => state.addParticle);
  const addSpice = useSpiceStore(state => state.addSpice);

  useEffect(() => {
    if (!svgRef.current) return;

    const container = svgRef.current;
    container.innerHTML = '';

    const svg = SVG()
      .addTo(container)
      .size('100%', '100%')
      .viewbox(0, 0, 100, 120);

    const jarBody = svg.group();

    jarBody.path('M25 40 Q25 30 35 30 L65 30 Q75 30 75 40 L75 85 Q75 105 50 105 Q25 105 25 85 Z')
      .fill('#CD853F')
      .stroke('#8B4513', 2)
      .opacity(0.95);

    jarBody.path('M28 45 Q28 38 38 38 L62 38 Q72 38 72 45 L72 80 Q72 98 50 98 Q28 98 28 80 Z')
      .fill('#DEB887')
      .opacity(0.8);

    jarBody.path('M30 50 Q30 45 38 45 L62 45 Q70 45 70 50 L70 78 Q70 92 50 92 Q30 92 30 78 Z')
      .fill('#D2B48C')
      .opacity(0.6);

    jarBody.path('M28 45 Q50 52 72 45 L72 50 Q50 57 28 50 Z')
      .fill('#F5DEB3')
      .opacity(0.4);

    const lid = svg.group();
    lid.path('M30 30 L30 22 Q30 15 50 15 Q70 15 70 22 L70 30 Z')
      .fill('#8B0000')
      .stroke('#5C0000', 2);

    lid.path('M32 22 Q50 18 68 22 L68 26 Q50 22 32 26 Z')
      .fill('#A52A2A')
      .opacity(0.6);

    lid.rect(35, 4)
      .move(32.5, 18)
      .fill('#DAA520')
      .stroke('#B8860B', 1)
      .radius(1);

    const powder = svg.group();
    powder.path('M32 55 Q50 52 68 55 L68 75 Q50 85 32 75 Z')
      .fill(spice.color)
      .opacity(0.9);

    powder.path('M32 55 Q50 52 68 55 L68 58 Q50 55 32 58 Z')
      .fill('#FFFFFF')
      .opacity(0.15);

    svg.circle(8)
      .move(46, 48)
      .fill(spice.color)
      .opacity(0.8)
      .addTo(powder);

    svg.circle(5)
      .move(58, 52)
      .fill(spice.color)
      .opacity(0.7)
      .addTo(powder);

    svg.circle(4)
      .move(40, 58)
      .fill(spice.color)
      .opacity(0.6)
      .addTo(powder);

    const highlight = svg.group();
    highlight.path('M30 45 Q30 80 35 95')
      .stroke('#FFFFFF')
      .stroke({ width: 2, opacity: 0.3 })
      .fill('none');

    highlight.path('M35 35 Q38 70 42 88')
      .stroke('#FFFFFF')
      .stroke({ width: 1, opacity: 0.2 })
      .fill('none');

  }, [spice.color]);

  const handleClick = (e: React.MouseEvent) => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    addParticle(x, y, spice.color);
    addSpice(spice.id, 15);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  return (
    <motion.div
      className="relative cursor-pointer select-none"
      style={{ width: '80px', height: '100px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${spice.nameCN}香料罐`}
      drag
      dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
      dragElastic={0.1}
      onDragStart={() => onDragStart(spice.id)}
      onDragEnd={(event, info) => {
        onDragEnd();
        const scaleElement = document.querySelector('[data-scale="true"]');
        if (scaleElement) {
          const scaleRect = scaleElement.getBoundingClientRect();
          const dropX = event.clientX || info.point.x;
          const dropY = event.clientY || info.point.y;

          if (
            dropX >= scaleRect.left &&
            dropX <= scaleRect.right &&
            dropY >= scaleRect.top &&
            dropY <= scaleRect.bottom
          ) {
            onDropOnScale(spice.id);
          }
        }
      }}
      whileHover={{ scale: 1.08, y: -5 }}
      whileTap={{ scale: 0.95 }}
      animate={isClicked ? { scale: [1, 0.9, 1.05, 1], transition: { duration: 0.2 } } : {}}
      variants={{
        draggable: {
          cursor: 'grab',
          zIndex: 100
        },
        dragging: {
          cursor: 'grabbing',
          zIndex: 1000,
          opacity: 0.8,
          scale: 1.1
        }
      }}
    >
      <div
        ref={svgRef}
        className="w-full h-full"
        style={{
          filter: isHovered
            ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))'
            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          transition: 'filter 0.3s ease'
        }}
      />

      <motion.div
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center"
        initial={{ opacity: 0, y: -5 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : -5
        }}
        transition={{ duration: 0.2 }}
      >
        <span
          className="text-sm font-bold px-2 py-1 rounded"
          style={{
            color: '#DAA520',
            backgroundColor: 'rgba(42, 11, 11, 0.9)',
            fontFamily: "'Noto Serif SC', serif"
          }}
        >
          {spice.nameCN}
        </span>
      </motion.div>

      {isClicked && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ scale: 0.5, opacity: 0.8, border: '3px solid rgba(218, 165, 32, 0.8)' }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </motion.div>
  );
}

export default SpiceJar;
