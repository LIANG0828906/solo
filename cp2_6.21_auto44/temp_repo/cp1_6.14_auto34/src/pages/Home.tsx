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
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setLeftWidth(100);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
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
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingDivider]);

  const handleGenerateReport = useCallback(() => {
    routeState.updateConnectionHighlight();
    setShowReport(true);
  }, [routeState]);

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-[#FAF7F2] overflow-hidden">
        <Toolbar routeState={routeState} onGenerateReport={handleGenerateReport} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-1/2 relative overflow-hidden">
            <RouteCanvas routeState={routeState} />
          </div>
          <div className="h-3 bg-gradient-to-b from-[#E8DCC4] to-[#FAF7F2] flex-shrink-0" />
          <div className="flex-1 overflow-hidden">
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

  return (
    <div className="h-screen flex flex-col bg-[#FAF7F2] overflow-hidden">
      <Toolbar routeState={routeState} onGenerateReport={handleGenerateReport} />

      <div
        ref={containerRef}
        className="flex-1 flex relative overflow-hidden"
      >
        <div
          className="relative overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          <RouteCanvas routeState={routeState} />
        </div>

        <div
          className={`w-2 flex-shrink-0 cursor-col-resize z-10 relative group ${
            isDraggingDivider ? 'bg-[#6B7F5E]' : 'bg-[#E8DCC4]'
          } hover:bg-[#6B7F5E] transition-colors`}
          onMouseDown={handleDividerMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-1 rounded-full bg-white" />
            <div className="w-1 h-1 rounded-full bg-white" />
            <div className="w-1 h-1 rounded-full bg-white" />
          </div>
        </div>

        <div
          className="overflow-hidden"
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
