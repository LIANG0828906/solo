import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TechDebtItem, SeverityLevel } from '@/types';
import { calculateHealthScore } from '@/utils/healthScore';
import { calculateFileStats, getScoreColor } from '@/utils/fileStats';

const severityColors: Record<SeverityLevel, string> = {
  critical: '#E53935',
  high: '#FB8C00',
  medium: '#FDD835',
  low: '#C0CA33',
};

interface DashboardProps {
  items: TechDebtItem[];
  selectedFile: string | null;
  onFileSelect: (filePath: string | null) => void;
}

export default function Dashboard({ items, selectedFile, onFileSelect }: DashboardProps) {
  const healthScore = useMemo(() => calculateHealthScore(items), [items]);
  const fileStats = useMemo(() => calculateFileStats(items), [items]);
  const maxHours = useMemo(() => Math.max(...fileStats.map((f) => f.totalHours), 1), [fileStats]);

  const gaugeRotation = (healthScore.score / 100) * 180 - 90;
  const scoreColor = getScoreColor(healthScore.score);

  const truncateFileName = (name: string, maxLength: number) => {
    const parts = name.split('/');
    const shortName = parts.length > 2 ? parts.slice(-2).join('/') : name;
    return shortName.length > maxLength ? shortName.slice(0, maxLength) + '...' : shortName;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#2D2D2D] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#E0E0E0] mb-6">健康度仪表盘</h3>
        <div className="relative flex flex-col items-center">
          <svg width="220" height="130" viewBox="0 0 220 130">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E53935" />
                <stop offset="33%" stopColor="#FB8C00" />
                <stop offset="66%" stopColor="#FDD835" />
                <stop offset="100%" stopColor="#4CAF50" />
              </linearGradient>
            </defs>

            <path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke="#3D3D3D"
              strokeWidth="16"
              strokeLinecap="round"
            />

            <motion.path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="16"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: healthScore.score / 100 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            <motion.g
              style={{ transformOrigin: '110px 110px' }}
              initial={{ rotate: -90 }}
              animate={{ rotate: gaugeRotation }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <line
                x1="110"
                y1="110"
                x2="110"
                y2="35"
                stroke="#E0E0E0"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="110" cy="110" r="8" fill="#E0E0E0" />
              <circle cx="110" cy="110" r="4" fill="#1E1E1E" />
            </motion.g>
          </svg>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-2"
          >
            <div className="text-4xl font-bold" style={{ color: scoreColor }}>
              {healthScore.score}
            </div>
            <div className="text-sm text-[#9E9E9E] mt-1 max-w-[200px]">
              {healthScore.comment}
            </div>
          </motion.div>

          <div className="flex gap-4 mt-4">
            {(Object.keys(healthScore.breakdown) as SeverityLevel[]).map((level) => (
              <div key={level} className="text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: severityColors[level] }}
                />
                <div className="text-xs text-[#E0E0E0] font-medium">
                  {healthScore.breakdown[level]}
                </div>
                <div className="text-xs text-[#9E9E9E]">
                  {level === 'critical' ? '严重' : level === 'high' ? '高' : level === 'medium' ? '中' : '低'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#2D2D2D] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#E0E0E0]">文件债务分布</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFileSelect(null)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              selectedFile === null
                ? 'bg-[#1976D2] text-white'
                : 'bg-[#1E1E1E] text-[#9E9E9E] hover:text-[#E0E0E0]'
            }`}
          >
            全部
          </motion.button>
        </div>

        {fileStats.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-[#9E9E9E]">
            暂无文件关联数据
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {fileStats.map((file) => (
                <motion.div
                  key={file.filePath}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onFileSelect(file.filePath)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedFile === file.filePath
                        ? 'ring-2 ring-[#1976D2] bg-[#1E1E1E]'
                        : 'bg-[#1E1E1E] hover:bg-[#3D3D3D]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#E0E0E0] font-mono truncate max-w-[180px]">
                        {truncateFileName(file.filePath, 25)}
                      </span>
                      <span
                        className="text-sm font-semibold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: severityColors[file.maxSeverity] + '20',
                          color: severityColors[file.maxSeverity],
                        }}
                      >
                        {file.totalHours}h
                      </span>
                    </div>
                    <div className="relative h-2 bg-[#3D3D3D] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(file.totalHours / maxHours) * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute top-0 left-0 h-full rounded-full"
                        style={{ backgroundColor: severityColors[file.maxSeverity] }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-[#9E9E9E]">
                      <span>{file.totalItems} 个条目</span>
                      <span>最高严重等级: {file.maxSeverity === 'critical' ? '严重' : file.maxSeverity === 'high' ? '高' : file.maxSeverity === 'medium' ? '中' : '低'}</span>
                    </div>
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
