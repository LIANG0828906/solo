import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouteState } from '@/hooks/useRouteState';
import { RouteCanvas } from '@/components/RouteCanvas';
import { TimelinePanel } from '@/components/TimelinePanel';
import { TravelReport } from '@/components/TravelReport';
import { Toolbar } from '@/components/Toolbar';

export default function Home() {
  const routeState = useRouteState();
  const [showReport, setShowReport] = useState(false);
  const [leftWidth, setLeftWidth] = useState(70);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = useCallback(() => {
    setIsDraggingDivider(true);
  }, []);

  useEffect(() => {
    if (!isDraggingDivider) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.max(30, Math.min(80, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDraggingDivider(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDivider]);

  const handleGenerateReport = useCallback(() => {
    routeState.updateConnectionHighlight();
    setShowReport(true);
  }, [routeState]);

  return (
    <div className="h-screen flex flex-col bg-[#FAF7F2] overflow-hidden">
      <Toolbar routeState={routeState} onGenerateReport={handleGenerateReport} />

      <div
        ref={containerRef}
        className="flex-1 flex flex-col md:flex-row relative overflow-hidden"
      >
        <div
          className="h-1/2 md:h-full relative overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          <RouteCanvas routeState={routeState} />
        </div>

        <div
          className={`hidden md:block w-1 bg-[#E8DCC4] cursor-col-resize hover:bg-[#6B7F5E] transition-colors z-10 ${
            isDraggingDivider ? 'bg-[#6B7F5E]' : ''
          }`}
          onMouseDown={handleDividerMouseDown}
        />

        <div
          className="h-1/2 md:h-full overflow-hidden"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <TimelinePanel routeState={routeState} />
        </div>
      </div>

      {showReport && (
        <TravelReport
          reportData={routeState.generateReportData()}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
