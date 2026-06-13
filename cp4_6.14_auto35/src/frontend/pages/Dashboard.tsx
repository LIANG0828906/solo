import React, { useState, useMemo } from 'react';
import { AlertTriangle, TrendingUp, Target, CheckCircle, Clock } from 'lucide-react';
import ObjectiveCard from '../components/ObjectiveCard';
import type { Objective, CheckInRecord } from '../../types';
import { calculateObjectiveProgress, getTeamProgress, getRiskCount, getQuarterWeeks, getWeekNumber, formatDate, getStatusInfo } from '../utils/helpers';

interface DashboardProps {
  objectives: Objective[];
  loading: boolean;
  onConfidenceChange: (objectiveId: string, krId: string, value: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ objectives, loading, onConfidenceChange }) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [fadeKey, setFadeKey] = useState(0);

  const teamProgress = getTeamProgress(objectives);
  const riskCount = getRiskCount(objectives);
  const completedCount = objectives.filter(o => o.status === 'completed').length;
  const inProgressCount = objectives.filter(o => o.status === 'in_progress').length;

  const currentQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q2';
  const currentYear = 2026;
  const weeks = getQuarterWeeks(currentQuarter, currentYear);

  const highPriorityObjectives = useMemo(() => {
    return objectives
      .filter(o => o.status !== 'completed')
      .sort((a, b) => {
        const aProgress = calculateObjectiveProgress(a);
        const bProgress = calculateObjectiveProgress(b);
        if (a.status === 'at_risk' && b.status !== 'at_risk') return -1;
        if (b.status === 'at_risk' && a.status !== 'at_risk') return 1;
        return aProgress - bProgress;
      })
      .slice(0, 4);
  }, [objectives]);

  const weekCheckIns = useMemo(() => {
    const allCheckIns: (CheckInRecord & { objectiveTitle: string; krTitle: string })[] = [];
    objectives.forEach(obj => {
      obj.checkIns.forEach(checkin => {
        const weekNum = getWeekNumber(checkin.date, currentQuarter, currentYear);
        if (weekNum === selectedWeek) {
          const kr = obj.keyResults.find(k => k.id === checkin.keyResultId);
          allCheckIns.push({
            ...checkin,
            objectiveTitle: obj.title,
            krTitle: kr?.title || ''
          });
        }
      });
    });
    return allCheckIns.sort((a: CheckInRecord, b: CheckInRecord) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [objectives, selectedWeek]);

  const handleWeekChange = (week: number) => {
    setFadeKey(prev => prev + 1);
    setTimeout(() => {
      setSelectedWeek(week);
    }, 200);
  };

  const progressGradient = `linear-gradient(90deg, #1a237e 0%, #2e7d32 100%)`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a237e] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1a237e] to-[#3949ab] rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">团队整体完成度 {teamProgress}%</h2>
            <p className="text-white/80">Q2 2026 季度目标追踪</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{objectives.length}</div>
              <div className="text-sm text-white/70">总目标数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{completedCount}</div>
              <div className="text-sm text-white/70">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{riskCount}</div>
              <div className="text-sm text-white/70">有风险</div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-animate"
              style={{ width: `${teamProgress}%`, background: progressGradient }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-md card-hover">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="text-blue-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{objectives.length}</div>
              <div className="text-sm text-gray-500">总目标数</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-md card-hover">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{completedCount}</div>
              <div className="text-sm text-gray-500">已达标</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-md card-hover">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{inProgressCount}</div>
              <div className="text-sm text-gray-500">进行中</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-md card-hover">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{riskCount}</div>
              <div className="text-sm text-gray-500">有风险</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Clock size={20} className="text-[#1a237e]" />
            周期检视
          </h3>
        </div>
        <div className="flex">
          <div className="w-48 border-r border-gray-100 bg-gray-50">
            {weeks.map((weekLabel, index) => (
              <button
                key={index}
                onClick={() => handleWeekChange(index + 1)}
                className={`w-full px-4 py-3 text-left text-sm transition-all ${
                  selectedWeek === index + 1
                    ? 'bg-[#1a237e] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {weekLabel}
              </button>
            ))}
          </div>
          <div key={fadeKey} className="flex-1 p-5 min-h-[300px] fade-enter">
            {weekCheckIns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Clock size={48} className="mb-2" />
                <p>本周暂无检视记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {weekCheckIns.map((checkin) => (
                  <div key={checkin.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-gray-800">{checkin.objectiveTitle}</div>
                        <div className="text-sm text-gray-500">{checkin.krTitle}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#1a237e]">{checkin.percentComplete}%</div>
                        <div className="text-xs text-gray-400">{formatDate(checkin.date)}</div>
                      </div>
                    </div>
                    {checkin.note && (
                      <p className="text-sm text-gray-600 bg-white p-2 rounded">{checkin.note}</p>
                    )}
                    <div className="mt-2 text-xs text-gray-400">更新者: {checkin.updatedBy}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-orange-500" />
          高优先级目标
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highPriorityObjectives.map((objective, index) => (
            <div key={objective.id} style={{ animationDelay: `${index * 0.1}s` }}>
              <ObjectiveCard
                objective={objective}
                onConfidenceChange={onConfidenceChange}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">所有目标</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objectives.map((objective, index) => (
            <div key={objective.id} style={{ animationDelay: `${index * 0.1}s` }}>
              <ObjectiveCard
                objective={objective}
                onConfidenceChange={onConfidenceChange}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
