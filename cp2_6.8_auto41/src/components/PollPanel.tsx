import React, { useState, useEffect, useRef } from 'react';
import { Role, ROLE_LABELS, ROLE_WEIGHTS, VoteResult } from '../utils/voteEngine';

interface PollPanelProps {
  ws: WebSocket;
  voteData: VoteResult;
}

function PollPanel({ ws, voteData }: PollPanelProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [flashTopIds, setFlashTopIds] = useState<string[]>([]);
  const prevRankRef = useRef<string[]>([]);

  useEffect(() => {
    const currentTopIds = voteData.rankings.slice(0, 3).map((r) => r.optionId);
    const prevTopIds = prevRankRef.current;
    const hasChanged = currentTopIds.some((id, i) => id !== prevTopIds[i]);
    if (hasChanged && prevTopIds.length > 0) {
      setFlashTopIds(currentTopIds);
      setTimeout(() => setFlashTopIds([]), 500);
    }
    prevRankRef.current = currentTopIds;
  }, [voteData.rankings]);

  useEffect(() => {
    const initial: Record<string, number> = {};
    voteData.options.forEach((opt) => {
      initial[opt.id] = 5;
    });
    setScores(initial);
  }, [voteData.options]);

  const handleScoreChange = (optionId: string, value: number) => {
    setScores((prev) => ({ ...prev, [optionId]: value));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('请输入姓名');
      return;
    }
    if (voteData.isLocked) {
      alert('投票已结束');
      return;
    }
    if (voteData.participantCount >= 20) {
      alert('参与者已达上限');
      return;
    }
    ws.send(
      JSON.stringify({
        type: 'submit-vote',
        payload: {
          name: name.trim(),
          role,
          scores,
        },
      })
    );
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <>
      <div className="bg-card-dark rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold mb-4">参与者列表</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {voteData.votes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无参与者</p>
          ) : (
            voteData.votes.map((vote) => (
              <div
                key={vote.id}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{vote.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">
                    {ROLE_LABELS[vote.role]} x{ROLE_WEIGHTS[vote.role]}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-card-dark rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">投票面板</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent"
              disabled={voteData.isLocked}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">角色</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent"
              disabled={voteData.isLocked}
            >
              <option value="manager">经理 (权重 1.5)</option>
              <option value="leader">组长 (权重 1.2)</option>
              <option value="member">成员 (权重 1.0)</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="block text-sm text-gray-400">评分 (1-10)</label>
            {voteData.options.map((opt) => (
              <div key={opt.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{opt.name}</span>
                  <span className="font-semibold text-accent">{scores[opt.id] || 0}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scores[opt.id] || 1}
                  onChange={(e) => handleScoreChange(opt.id, parseInt(e.target.value))}
                  className="w-full"
                  disabled={voteData.isLocked}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={voteData.isLocked}
            className="w-full py-3 bg-accent hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-semibold"
          >
            提交投票
          </button>
        </div>
      </div>

      <div className="bg-card-dark rounded-xl p-6 lg:col-span-1">
        <h2 className="text-xl font-bold mb-4">实时排名</h2>
        <div className="space-y-2">
          {voteData.rankings.map((ranked, index) => (
            <div
              key={ranked.optionId}
              className={`flex items-center justify-between p-3 bg-gray-800/50 rounded-lg transition-all duration-300 ${
                flashTopIds.includes(ranked.optionId) ? 'animate-flash-gold' : ''
              }`}
              style={{
                animation: flashTopIds.includes(ranked.optionId) ? 'flash-gold 0.5s ease-in-out' : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{getRankBadge(index)}</span>
                <span className="font-medium">{ranked.optionName}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-accent">{ranked.weightedScore}</div>
                <div className="text-xs text-gray-400">{ranked.voteCount} 票</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default PollPanel;
