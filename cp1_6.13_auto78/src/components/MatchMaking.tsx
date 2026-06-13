import { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import type { Skill } from '@/types';
import './MatchMaking.css';

interface MatchMakingProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSkill: Skill) => void;
  availableSkills: Skill[];
  taskTitle?: string;
}

interface MatchSkill extends Skill {
  matchPercent: number;
}

export default function MatchMaking({
  isOpen,
  onClose,
  onConfirm,
  availableSkills,
  taskTitle,
}: MatchMakingProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [animatedSkills, setAnimatedSkills] = useState<MatchSkill[]>([]);

  useEffect(() => {
    if (isOpen && availableSkills.length > 0) {
      const skillsWithMatch: MatchSkill[] = availableSkills.map((skill, index) => ({
        ...skill,
        matchPercent: Math.min(95, 60 + index * 12 + Math.floor(Math.random() * 10)),
      }));
      setAnimatedSkills(skillsWithMatch);
      setSelectedSkill(null);
    }
  }, [isOpen, availableSkills]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const skill = availableSkills.find((s) => s.id === selectedSkill);
    if (skill) {
      onConfirm(skill);
    }
  };

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < level ? 'text-[#e8a838]' : 'text-gray-600'}`}>
        ★
      </span>
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a2e] border border-[#2a2a4e] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
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
          <h2 className="text-2xl font-bold text-white mb-2">技能匹配</h2>
          {taskTitle && (
            <p className="text-gray-400 text-sm">为「{taskTitle}」选择交换技能</p>
          )}
          <p className="text-gray-500 text-sm mt-2">以下是您可用于交换的技能</p>
        </div>

        <div className="space-y-3 mb-6">
          {animatedSkills.map((skill, index) => (
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
                      stroke="#e8a838"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${(skill.matchPercent / 100) * 176} 176`}
                      strokeLinecap="round"
                      className="progress-ring"
                      style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[#e8a838] font-bold text-sm">{skill.matchPercent}%</span>
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
          disabled={!selectedSkill}
          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
            selectedSkill
              ? 'bg-[#e8a838] text-[#16213e] hover:scale-105 btn-shine'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          确认交换
        </button>
      </div>
    </div>
  );
}
