import React from 'react';
import { Plus, FileText, RotateCcw, Map } from 'lucide-react';
import { UseRouteStateReturn } from '@/hooks/useRouteState';

interface ToolbarProps {
  routeState: UseRouteStateReturn;
  onGenerateReport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ routeState, onGenerateReport }) => {
  const { nodes, resetCanvas } = routeState;

  return (
    <div className="h-14 bg-gradient-to-r from-[#4A3728] to-[#5D4A3A] px-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B7F5E] to-[#5a6b4e] flex items-center justify-center shadow-lg">
          <Map className="text-white" size={22} />
        </div>
        <div>
          <h1
            className="text-white text-lg font-bold"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            旅行路线规划师
          </h1>
          <p className="text-white/60 text-xs">
            {nodes.length} 个地点 · 双击画布添加新地点
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onGenerateReport}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6B7F5E] to-[#5a6b4e] text-white rounded-lg font-medium hover:from-[#5a6b4e] hover:to-[#4a5a3e] transition-all shadow-md hover:shadow-lg"
        >
          <FileText size={18} />
          <span>生成旅行报告</span>
        </button>
        <button
          onClick={resetCanvas}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 hover:text-white transition-all"
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">重置</span>
        </button>
      </div>
    </div>
  );
};
