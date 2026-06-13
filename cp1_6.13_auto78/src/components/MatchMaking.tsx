import { useState, useEffect } from 'react';
import { X, Check, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { Skill, Task } from '@/types';
import './MatchMaking.css';

interface MatchMakingProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSkill: Skill, exchangeId: string) => void;
  task: Task | null;
}

interface MatchSkill extends Skill {
  matchPercent: number;
}

export default function MatchMaking({
  isOpen,
  onClose,
  onConfirm,
  task,
}: MatchMakingProps) {
  const { user } = useAuthStore();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [matchedSkills, setMatchedSkills] = useState<MatchSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!isOpen || !task || !user) return;

      setLoading(true);
      setError(null);
      setSelectedSkill(null);
      setMatchedSkills([]);

      try {
        const response = await axios.get(`/api/tasks/match/${task.id}/${user.id}`);
        const { matchedSkills: skills } = response.data;

        if (skills.length === 0) {
          setError('您目前没有匹配度超过50%的可用技能');
          setLoading(false);
          return;
        }

        const skillsWithMatch: MatchSkill[] = skills
          .filter((s: any) => s.matchScore > 50)
          .sort((a: any, b: any) => b.matchScore - a.matchScore)
          .map((skill: any) => ({
            id: skill.id,
            name: skill.name,
            level: skill.level,
            hoursPerWeek: skill.availableHours || 10,
            matchPercent: Math.round(skill.matchScore),
          }));

        if (skillsWithMatch.length === 0) {
          setError('您目前没有匹配度超过50%的可用技能');
        } else {
          setMatchedSkills(skillsWithMatch);
        }
      } catch (err) {
        setError('匹配计算失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [isOpen, task, user]);

  if (!isOpen || !task) return null;

  const handleConfirm = async () => {
    if (!selectedSkill || !user) return;

    setConfirmLoading(true);
    try {
      const response = await axios.post(`/api/tasks/${task.id}/apply`, {
        applicantId: user.id,
        applicantSkillId: selectedSkill,
      });

      const { exchange } = response.data;
      const skill = matchedSkills.find((s) => s.id === selectedSkill);
      if (skill) {
        onConfirm(skill, exchange.id);
      }
    } catch (err) {
      setError('申请失败，请稍后重试');
    } finally {
      setConfirmLoading(false);
    }
  };

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < level ? 'text-[#e8a838]' : 'text-gray-600'}`}>
        ★
      </span>
    ));
  };

  const getMatchColor = (percent: number) => {
    if (percent >= 80) return '#22c55e';
    if (percent >= 65) return '#e8a838';
    return '#f97316';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a2e] border border-[#2a2a4e] rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto matchmaking-modal">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#e8a838] to-[#b8860b] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">智能技能匹配</h2>
          <p className="text-gray-400 text-sm">为「{task.title}」匹配您的技能</p>
          <p className="text-gray-500 text-sm mt-2">
            任务需求：<span className="text-[#e8a838]">{task.requiredSkills?.[0]?.name || '技能'}</span>
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-[#e8a838] animate-spin mb-4" />
            <p className="text-gray-400">正在计算匹配度...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#2a2a4e] text-white rounded-lg hover:bg-[#3a3a5e] transition-colors"
            >
              关闭
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {matchedSkills.map((skill, index) => (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill.id)}
                  className={`match-skill-card relative p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedSkill === skill.id
                      ? 'border-[#e8a838] bg-[#e8a838]/10'
                      : 'border-[#2a2a4e] bg-[#16213e] hover:border-[#3a3a5e]'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#2a2a4e"
                          strokeWidth="4"
                          fill="none"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke={getMatchColor(skill.matchPercent)}
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="176"
                          strokeDashoffset="176"
                          strokeLinecap="round"
                          className="progress-ring"
                          style={{
                            animationDelay: `${index * 0.1 + 0.2}s`,
                            '--target-offset': `${176 - (skill.matchPercent / 100) * 176}`,
                          } as React.CSSProperties}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="font-bold text-sm"
                          style={{ color: getMatchColor(skill.matchPercent) }}
                        >
                          {skill.matchPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold mb-1">{skill.name}</h3>
                      <div className="flex items-center gap-1 mb-1">
                        {renderStars(skill.level)}
                      </div>
                      <p className="text-gray-500 text-xs">
                        每周可用 {skill.hoursPerWeek} 小时
                      </p>
                    </div>

                    {selectedSkill === skill.id && (
                      <div className="w-6 h-6 rounded-full bg-[#e8a838] flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#16213e]" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirm}
              disabled={!selectedSkill || confirmLoading}
              className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                selectedSkill && !confirmLoading
                  ? 'bg-[#e8a838] text-[#16213e] hover:scale-105 btn-shine'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {confirmLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  申请中...
                </>
              ) : (
                '确认申请交换'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
