export type Role = 'manager' | 'leader' | 'member';

export interface Option {
  id: string;
  name: string;
}

export interface Vote {
  id: string;
  name: string;
  role: Role;
  scores: Record<string, number>;
  timestamp: number;
}

export interface WeightedScore {
  optionId: string;
  optionName: string;
  totalScore: number;
  weightedScore: number;
  voteCount: number;
}

export interface VoteResult {
  options: Option[];
  votes: Vote[];
  weightedScores: WeightedScore[];
  rankings: WeightedScore[];
  participantCount: number;
  isLocked: boolean;
  remainingTime: number;
}

export const ROLE_WEIGHTS: Record<Role, number> = {
  manager: 1.5,
  leader: 1.2,
  member: 1.0,
};

export const ROLE_LABELS: Record<Role, string> = {
  manager: '经理',
  leader: '组长',
  member: '成员',
};

export const PIE_COLORS = ['#3f51b5', '#e91e63', '#00bcd4', '#ff5722', '#8bc34a'];

export function calculateWeightedScores(votes: Vote[], options: Option[]): WeightedScore[] {
  const scores: Record<string, { total: number; weighted: number; count: number }> = {};

  options.forEach((opt) => {
    scores[opt.id] = { total: 0, weighted: 0, count: 0 };
  });

  votes.forEach((vote) => {
    const weight = ROLE_WEIGHTS[vote.role];
    Object.entries(vote.scores).forEach(([optionId, score]) => {
      if (scores[optionId]) {
        scores[optionId].total += score;
        scores[optionId].weighted += score * weight;
        scores[optionId].count += 1;
      }
    });
  });

  return options.map((opt) => ({
    optionId: opt.id,
    optionName: opt.name,
    totalScore: scores[opt.id].total,
    weightedScore: parseFloat(scores[opt.id].weighted.toFixed(2)),
    voteCount: scores[opt.id].count,
  }));
}

export function sortByRank(scores: WeightedScore[]): WeightedScore[] {
  return [...scores].sort((a, b) => b.weightedScore - a.weightedScore);
}

export function formatVoteResult(result: VoteResult) {
  return {
    ...result,
    weightedScores: result.weightedScores.map((s) => ({
      ...s,
      weightedScore: parseFloat(s.weightedScore.toFixed(2)),
    })),
    rankings: result.rankings.map((s) => ({
      ...s,
      weightedScore: parseFloat(s.weightedScore.toFixed(2)),
    })),
  };
}

export function generateBarColor(score: number, maxScore: number): string {
  if (maxScore === 0) return '#4caf50';
  const ratio = score / maxScore;
  const r = Math.round(76 + (255 - 76) * ratio);
  const g = Math.round(175 + (152 - 175) * ratio);
  const b = Math.round(80 + (0 - 80) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function exportReport(result: VoteResult): string {
  let report = '团队决策加权投票报告\n';
  report += '==========================================\n\n';
  report += `参与者人数: ${result.participantCount}\n\n`;
  report += `投票状态: ${result.isLocked ? '已结束' : '进行中'}\n\n`;
  report += '排名结果:\n';
  report += '------------------------------------------\n';
  result.rankings.forEach((r, i) => {
    report += `${i + 1}. ${r.optionName}: 加权分 ${r.weightedScore} (原始分 ${r.totalScore}, 票数 ${r.voteCount})\n`;
  });
  report += '\n详细投票:\n';
  report += '------------------------------------------\n';
  result.votes.forEach((v) => {
    const roleLabel = ROLE_LABELS[v.role];
    const weight = ROLE_WEIGHTS[v.role];
    report += `${v.name} (${roleLabel}, 权重${weight}):\n`;
    Object.entries(v.scores).forEach(([optId, score]) => {
      const opt = result.options.find((o) => o.id === optId);
      if (opt) {
        report += `  ${opt.name}: ${score}分\n`;
      }
    });
    report += '\n';
  });
  return report;
}
