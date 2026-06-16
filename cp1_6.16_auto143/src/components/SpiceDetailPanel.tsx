import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Spice, FlavorProfile } from '../types';
import { useStore, averageFlavorProfile } from '../store';

function SpiceCard({ spice, cultureName }: { spice: Spice; cultureName: string }) {
  const [flipped, setFlipped] = useState(false);
  const setDraggedSpice = useStore((s) => s.setDraggedSpice);
  const draggedSpice = useStore((s) => s.draggedSpice);
  const isDragging = draggedSpice?.id === spice.id;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedSpice(spice);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify({ ...spice, cultureName }));
    setTimeout(() => setDraggedSpice(spice), 0);
  };

  const handleDragEnd = () => {
    setDraggedSpice(null);
  };

  const handleClick = (_e: React.MouseEvent) => {
    if (!isDragging) {
      setFlipped(!flipped);
    }
  };

  return (
    <div
      className={`spice-card-wrapper ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <div className={`spice-card ${flipped ? 'flipped' : ''}`}>
        <div className="spice-card-face spice-card-front">
          <div className="spice-color-block" style={{ background: spice.color }} />
          <div className="spice-name">{spice.name}</div>
          <div className="spice-name-en">{spice.nameEn}</div>
        </div>
        <div className="spice-card-face spice-card-back">
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: spice.color }} />
          <div className="spice-description">{spice.description}</div>
          <div className="spice-ratio">典型用量: {spice.typicalRatio}</div>
        </div>
      </div>
    </div>
  );
}

function FlavorRadar({ profile }: { profile: FlavorProfile }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rotationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 260;
    const height = 220;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 30;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const dimensions: (keyof FlavorProfile)[] = ['spicy', 'aromatic', 'warm', 'pungent', 'sweet'];
    const labels: Record<keyof FlavorProfile, string> = {
      spicy: '辛辣',
      aromatic: '芳香',
      warm: '温暖',
      pungent: '刺激',
      sweet: '甜润'
    };

    const g = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY}) rotate(${rotationRef.current})`);

    const angleSlice = (Math.PI * 2) / dimensions.length;

    const rScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    for (let level = 20; level <= 100; level += 20) {
      const points = dimensions.map((_, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        return [
          rScale(level) * Math.cos(angle),
          rScale(level) * Math.sin(angle)
        ];
      });
      g.append('polygon')
        .attr('points', points.map(p => p.join(',')).join(' '))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.08)')
        .attr('stroke-width', 1);
    }

    dimensions.forEach((_, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', 'rgba(255, 255, 255, 0.08)')
        .attr('stroke-width', 1);
    });

    const dataPoints = dimensions.map((dim, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const value = profile[dim];
      return [
        rScale(value) * Math.cos(angle),
        rScale(value) * Math.sin(angle)
      ] as [number, number];
    });

    const line = d3.line<[number, number]>()
      .x(d => d[0])
      .y(d => d[1])
      .curve(d3.curveLinearClosed);

    g.append('path')
      .datum(dataPoints)
      .attr('d', line)
      .attr('fill', 'rgba(226, 167, 111, 0.3)')
      .attr('stroke', '#E2A76F')
      .attr('stroke-width', 2);

    dataPoints.forEach((point, i) => {
      g.append('circle')
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', 4)
        .attr('fill', '#E2A76F')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);

      const labelAngle = i * angleSlice - Math.PI / 2;
      const labelRadius = radius + 18;
      const lx = labelRadius * Math.cos(labelAngle);
      const ly = labelRadius * Math.sin(labelAngle);

      const inverseRotation = -rotationRef.current * Math.PI / 180;
      const cos = Math.cos(inverseRotation);
      const sin = Math.sin(inverseRotation);
      const finalLx = lx * cos - ly * sin;
      const finalLy = lx * sin + ly * cos;

      svg.append('text')
        .attr('x', centerX + finalLx)
        .attr('y', centerY + finalLy)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text(labels[dimensions[i]]);
    });

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastXRef.current = e.clientX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - lastXRef.current;
      rotationRef.current += deltaX * 0.5;
      lastXRef.current = e.clientX;
      
      svg.select('g').attr('transform', `translate(${centerX}, ${centerY}) rotate(${rotationRef.current})`);
      
      svg.selectAll('text').remove();
      dimensions.forEach((_dim, i) => {
        const labelAngle = i * angleSlice - Math.PI / 2;
        const labelRadius = radius + 18;
        const lx = labelRadius * Math.cos(labelAngle);
        const ly = labelRadius * Math.sin(labelAngle);

        const inverseRotation = -rotationRef.current * Math.PI / 180;
        const cos = Math.cos(inverseRotation);
        const sin = Math.sin(inverseRotation);
        const finalLx = lx * cos - ly * sin;
        const finalLy = lx * sin + ly * cos;

        svg.append('text')
          .attr('x', centerX + finalLx)
          .attr('y', centerY + finalLy)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', 'rgba(255, 255, 255, 0.7)')
          .attr('font-size', '11px')
          .attr('font-weight', '500')
          .text(labels[dimensions[i]]);
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const container = svgRef.current.parentElement;
    if (container) {
      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        container.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [profile]);

  return (
    <div className="radar-container">
      <svg ref={svgRef} width={260} height={220} />
    </div>
  );
}

export default function SpiceDetailPanel() {
  const selectedCulture = useStore((s) => s.selectedCulture);
  const setSelectedCulture = useStore((s) => s.setSelectedCulture);
  const [heartAnimating, setHeartAnimating] = useState(false);

  if (!selectedCulture) return null;

  const avgProfile = averageFlavorProfile(selectedCulture.spices);

  const handleFavoriteClick = () => {
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 400);
  };

  return (
    <div className="detail-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <div>
            <div className="panel-culture-name">{selectedCulture.name}</div>
            <div className="panel-culture-name-en">{selectedCulture.nameEn}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className={`favorite-btn ${heartAnimating ? 'animating' : ''}`}
              onClick={handleFavoriteClick}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button className="close-btn" onClick={() => setSelectedCulture(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="spice-list">
        {selectedCulture.spices.map((spice) => (
          <SpiceCard key={spice.id} spice={spice} cultureName={selectedCulture.name} />
        ))}
      </div>

      <div className="flavor-radar-section">
        <div className="section-title">风味轮廓 · Flavor Profile</div>
        <FlavorRadar profile={avgProfile} />
      </div>
    </div>
  );
}
