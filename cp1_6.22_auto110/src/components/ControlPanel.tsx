import React from 'react';
import SunControlCard from './SunControlCard';
import AnalysisCard from './AnalysisCard';
import ExportCard from './ExportCard';
import type { HeatmapResult, ViewMode } from '@/types';

interface ControlPanelProps {
  date: Date;
  onDateChange: (date: Date) => void;
  timeMinutes: number;
  onTimeChange: (minutes: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onGenerateHeatmap: () => void;
  isGenerating: boolean;
  heatmapResult: HeatmapResult | null;
  onExportScreenshot: () => void;
  onExportHeatmap: () => void;
  heatmapAvailable: boolean;
  isExportingScreenshot: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  return (
    <div className="control-panel">
      <SunControlCard
        date={props.date}
        onDateChange={props.onDateChange}
        timeMinutes={props.timeMinutes}
        onTimeChange={props.onTimeChange}
        viewMode={props.viewMode}
        onViewModeChange={props.onViewModeChange}
      />
      <AnalysisCard
        onGenerateHeatmap={props.onGenerateHeatmap}
        isGenerating={props.isGenerating}
        heatmapResult={props.heatmapResult}
      />
      <ExportCard
        onExportScreenshot={props.onExportScreenshot}
        onExportHeatmap={props.onExportHeatmap}
        heatmapAvailable={props.heatmapAvailable}
        isExportingScreenshot={props.isExportingScreenshot}
      />
    </div>
  );
};

export default ControlPanel;
