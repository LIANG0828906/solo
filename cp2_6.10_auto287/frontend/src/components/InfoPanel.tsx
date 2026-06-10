import { useState, useEffect, useRef } from 'react';
import { Scroll, Star, Clock, Zap, Award, History, Sparkles } from 'lucide-react';
import { useWorkshopStore } from '@/store/workshopStore';
import { ARTIFACT_TYPES } from '@/utils/constants';
import { useAudio } from '@/hooks/useAudio';

function AttributeBar({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#2b1e0e]" style={{ fontFamily: 'var(--font-ancient)' }}>{label}</span>
        <span className="font-mono text-[#c0392b]">{value}</span>
      </div>
      <div className="attribute-bar">
        <div
          className={`attribute-bar-fill ${highlight ? 'highlight' : ''}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function RatingDisplay() {
  const { ratingResult, artifactResult } = useWorkshopStore();
  
  if (!ratingResult || !artifactResult) return null;

  return (
    <div className="bounce-in bamboo-panel p-4 mb-4 text-center">
      <div className="text-5xl mb-2">🎉</div>
      <h3 className="ancient-title text-lg mb-2">《天工开物》记载</h3>
      <div className="text-xl font-bold text-[#c0392b] mb-3" style={{ fontFamily: 'var(--font-ancient)' }}>
        「{artifactResult.artifactName}」
      </div>
      
      <div className={`rank-badge rank-${ratingResult.rank} mb-4`}>
        {ratingResult.rank}
      </div>
      
      <div className="text-4xl font-bold text-[#2b1e0e] mb-4" style={{ fontFamily: 'var(--font-number)' }}>
        {ratingResult.totalScore}
        <span className="text-lg">分</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-left">
        <div className="flex items-center gap-1">
          <Zap size={14} className="text-[#c0392b]" />
          <span>属性: {ratingResult.breakdown.attributeScore}</span>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles size={14} className="text-[#f39c12]" />
          <span>和谐: {ratingResult.breakdown.harmonyScore}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star size={14} className="text-[#8e44ad]" />
          <span>创意: {ratingResult.breakdown.creativityScore}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={14} className="text-[#27ae60]" />
          <span>效率: {ratingResult.breakdown.efficiencyScore}</span>
        </div>
      </div>
    </div>
  );
}

function BuildLog() {
  const { buildLogs } = useWorkshopStore();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [buildLogs]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-[#27ae60]';
      case 'relation': return 'text-[#c0392b]';
      case 'warning': return 'text-[#f39c12]';
      default: return 'text-[#2b1e0e]';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return '✨';
      case 'relation': return '⚡';
      case 'warning': return '⚠️';
      default: return '📜';
    }
  };

  return (
    <div className="bamboo-panel p-3">
      <h4 className="ancient-title text-sm mb-2 flex items-center gap-2">
        <Scroll size={16} />
        建造日志
      </h4>
      <div
        ref={logRef}
        className="scroll-container h-32 overflow-y-auto p-2 text-xs space-y-1"
      >
        {buildLogs.map((log) => (
          <div key={log.id} className={`flex gap-2 ${getLogColor(log.type)} fade-in`}>
            <span>{getLogIcon(log.type)}</span>
            <span className="flex-1">{log.message}</span>
          </div>
        ))}
        {buildLogs.length === 0 && (
          <div className="text-center text-[#7f8c8d] py-4">
            尚无记录...
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRecords() {
  const { historyRecords } = useWorkshopStore();
  const [showHistory, setShowHistory] = useState(false);
  const { playClickSound } = useAudio();

  if (historyRecords.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        className="bamboo-btn w-full text-sm flex items-center justify-center gap-2"
        onClick={() => {
          setShowHistory(!showHistory);
          playClickSound();
        }}
      >
        <History size={14} />
        <span>历史记录 ({historyRecords.length})</span>
      </button>

      {showHistory && (
        <div className="mt-2 scale-in bamboo-panel p-2 max-h-48 overflow-y-auto">
          {[...historyRecords].reverse().map((record, index) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-2 border-b border-[#2b1e0e]/10 last:border-0 text-xs"
            >
              <div>
                <div className="font-bold text-[#2b1e0e]">{record.artifactName}</div>
                <div className="text-[#4a3a24]">{record.artifactType}</div>
              </div>
              <div className={`rank-badge rank-${record.rank} text-lg px-2 py-1`}>
                {record.rank}
              </div>
              <div className="font-mono text-[#c0392b]">{record.totalScore}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function InfoPanel() {
  const { artifactResult, placedCalculi, finishBuild, ratingResult } = useWorkshopStore();
  const { playSuccessSound, playClickSound } = useAudio();
  const [buildTime, setBuildTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!ratingResult) {
        setBuildTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [ratingResult]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const artifactType = artifactResult?.artifactType || 'unknown';
  const artifactInfo = ARTIFACT_TYPES[artifactType] || ARTIFACT_TYPES.unknown;

  return (
    <div className="h-full flex flex-col bamboo-panel m-2 overflow-hidden">
      <div className="p-4 border-b-2 border-[#2b1e0e]">
        <h2 className="ancient-title text-xl text-center">器物信息</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <RatingDisplay />

        <div className="bamboo-panel p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{artifactInfo.icon}</div>
            <div>
              <div className="text-xs text-[#4a3a24]">{artifactInfo.name}</div>
              <div className="ancient-title text-lg text-[#c0392b]">
                {artifactResult?.artifactName || '未成之物'}
              </div>
            </div>
          </div>

          <div className="flex justify-between text-sm mb-4 text-[#4a3a24]">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{formatTime(buildTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award size={14} />
              <span>算筹 {placedCalculi.length} 枚</span>
            </div>
          </div>

          {artifactResult ? (
            <>
              <AttributeBar label="坚固度" value={artifactResult.attributes.solidity} />
              <AttributeBar label="锋利度" value={artifactResult.attributes.sharpness} />
              <AttributeBar label="音律" value={artifactResult.attributes.temperament} highlight />
              <AttributeBar label="耐久度" value={artifactResult.attributes.durability} />
              <AttributeBar label="平衡性" value={artifactResult.attributes.balance} />

              {artifactResult.bonusEffects.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#2b1e0e]/20">
                  <div className="text-xs text-[#4a3a24] mb-2">特殊效果</div>
                  <div className="flex flex-wrap gap-1">
                    {artifactResult.bonusEffects.map((effect, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded bg-[#c0392b]/10 text-[#c0392b] border border-[#c0392b]/30"
                        style={{ fontFamily: 'var(--font-ancient)' }}
                      >
                        {effect}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {artifactResult.relations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#2b1e0e]/20">
                  <div className="text-xs text-[#4a3a24] mb-2">五行关系</div>
                  <div className="space-y-1 text-xs">
                    {artifactResult.relations.map((rel, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 ${rel.type === 'generates' ? 'text-[#f39c12]' : 'text-[#c0392b]'}`}
                      >
                        <span className="text-lg">{rel.type === 'generates' ? '生' : '克'}</span>
                        <span>{rel.from} → {rel.to}</span>
                        <span className="text-[#4a3a24]">+{rel.effect}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-[#7f8c8d] py-8">
              <div className="text-4xl mb-2">🎋</div>
              <div>放置算筹开始构建</div>
              <div className="text-xs mt-2">系统将根据五行组合自动计算属性</div>
            </div>
          )}
        </div>

        {artifactResult && !ratingResult && (
          <button
            className="bamboo-btn bamboo-btn-primary w-full text-lg py-3"
            onClick={() => {
              finishBuild();
              playSuccessSound();
            }}
          >
            ✨ 完成建造 ✨
          </button>
        )}

        <BuildLog />
        <HistoryRecords />
      </div>
    </div>
  );
}
