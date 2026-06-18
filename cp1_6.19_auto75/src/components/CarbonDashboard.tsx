import { useState } from 'react';
import { CarbonStats, FabricType } from '../types';
import { CarbonPieChart } from './CarbonPieChart';
import { FaTimes, FaTree, FaTshirt, FaChartLine } from 'react-icons/fa';
import { fabricData } from '../data/clothing';

interface CarbonDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CarbonStats;
}

export function CarbonDashboard({ isOpen, onClose, stats }: CarbonDashboardProps) {
  const [selectedFabric, setSelectedFabric] = useState<FabricType | null>(null);

  if (!isOpen) return null;

  const baselineCarbon = 8.5;
  const treesEquivalent = Math.round(stats.totalCarbonSaved * 0.1);
  const waterSaved = Math.round(stats.totalCarbonSaved * 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-2xl mx-4 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden"
        style={{
          animation: 'scale-in 0.2s ease-out forwards'
        }}
      >
        <style>
          {`
            @keyframes scale-in {
              0% { transform: scale(0.8); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}
        </style>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                碳足迹仪表盘
              </h2>
              <p className="text-emerald-100 text-sm">您的环保贡献一目了然</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-100 flex items-center justify-center">
                <FaChartLine className="text-emerald-600" size={20} />
              </div>
              <div className="text-3xl font-bold text-emerald-700">
                {stats.totalCarbonSaved.toFixed(1)}
              </div>
              <div className="text-xs text-emerald-600 mt-1">kg CO₂ 已节省</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-teal-100 flex items-center justify-center">
                <FaTree className="text-teal-600" size={20} />
              </div>
              <div className="text-3xl font-bold text-teal-700">
                {treesEquivalent}
              </div>
              <div className="text-xs text-teal-600 mt-1">相当于种植树木</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-cyan-100 flex items-center justify-center">
                <FaTshirt className="text-cyan-600" size={20} />
              </div>
              <div className="text-3xl font-bold text-cyan-700">
                {stats.ecoClothingCount}
              </div>
              <div className="text-xs text-cyan-600 mt-1">件环保服装</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">与普通面料相比节省</span>
              <span className="font-bold text-emerald-600">
                {stats.ecoClothingCount > 0
                  ? ((stats.totalCarbonSaved / (stats.ecoClothingCount * baselineCarbon)) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.ecoClothingCount > 0
                    ? Math.min(100, (stats.totalCarbonSaved / (stats.ecoClothingCount * baselineCarbon)) * 100)
                    : 0}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              相当于节约 {waterSaved.toLocaleString()} 升水资源
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">面料使用分布</h3>
            <CarbonPieChart
              stats={stats}
              onSelectFabric={setSelectedFabric}
              selectedFabric={selectedFabric}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
