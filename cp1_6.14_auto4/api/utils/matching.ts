/**
 * 智能匹配算法模块
 * 核心功能：根据赛事信息和所有用户，推荐最合适的球员
 * 被 api/routes/matches.ts 的推荐接口调用
 */

import type { Match, User, Position, Level } from '../../shared/types.js';

export interface RecommendResult {
  user: User;
  score: number;
  reasons: string[];
}

const POSITION_WEIGHT = 50;
const LEVEL_WEIGHT = 30;
const BALANCE_WEIGHT = 20;

const POSITIONS: Position[] = ['后卫', '前锋', '中锋'];
const LEVELS: Level[] = ['新人', '进阶', '高手'];

function getIdealCounts(mode: Match['mode']): Record<Position, number> {
  const totalPlayers = mode === '3v3' ? 3 : 5;
  const base = Math.floor(totalPlayers / 3);
  const remainder = totalPlayers % 3;

  const counts: Record<Position, number> = {
    后卫: base,
    前锋: base,
    中锋: base,
  };

  for (let i = 0; i < remainder; i++) {
    counts[POSITIONS[i]] += 1;
  }

  return counts;
}

function getPositionCounts(users: User[]): Record<Position, number> {
  const counts: Record<Position, number> = { 后卫: 0, 前锋: 0, 中锋: 0 };
  users.forEach((u) => {
    counts[u.position] += 1;
  });
  return counts;
}

function getPositionGaps(
  ideal: Record<Position, number>,
  current: Record<Position, number>
): Record<Position, number> {
  const gaps: Record<Position, number> = { 后卫: 0, 前锋: 0, 中锋: 0 };
  POSITIONS.forEach((pos) => {
    gaps[pos] = Math.max(0, ideal[pos] - current[pos]);
  });
  return gaps;
}

function getAverageLevel(users: User[]): number | null {
  if (users.length === 0) return null;
  const sum = users.reduce((acc, u) => acc + LEVELS.indexOf(u.level), 0);
  return sum / users.length;
}

function getLevelGap(userLevel: Level, avgLevel: number | null): number {
  if (avgLevel === null) return 30;
  const userLevelIdx = LEVELS.indexOf(userLevel);
  const diff = Math.abs(userLevelIdx - Math.round(avgLevel));
  if (diff === 0) return 30;
  if (diff === 1) return 15;
  return 0;
}

function calculateVariance(counts: Record<Position, number>): number {
  const values = POSITIONS.map((p) => counts[p]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

export function recommendPlayers(
  match: Match,
  allUsers: User[]
): RecommendResult[] {
  const playerUsers = allUsers.filter((u) => match.playerIds.includes(u.id));
  const creatorUser = allUsers.find((u) => u.id === match.creatorId);
  const registeredIds = new Set(match.playerIds);
  registeredIds.add(match.creatorId);

  const candidates = allUsers.filter((u) => !registeredIds.has(u.id));

  const idealCounts = getIdealCounts(match.mode);
  const currentCounts = getPositionCounts(playerUsers);
  const gaps = getPositionGaps(idealCounts, currentCounts);

  const sortedGapPositions = [...POSITIONS].sort(
    (a, b) => gaps[b] - gaps[a]
  );

  const avgLevel = getAverageLevel(playerUsers);

  const results: RecommendResult[] = candidates.map((candidate) => {
    let positionScore = 0;
    const reasons: string[] = [];

    const candidateGap = gaps[candidate.position];
    if (sortedGapPositions[0] === candidate.position && candidateGap > 0) {
      positionScore = POSITION_WEIGHT;
      reasons.push(
        `正好填补${candidate.position}位置缺口(缺${candidateGap}人)`
      );
    } else if (sortedGapPositions[1] === candidate.position && candidateGap > 0) {
      positionScore = 30;
      reasons.push(
        `${candidate.position}位置有缺口(缺${candidateGap}人)，适配性良好`
      );
    } else if (candidateGap > 0) {
      positionScore = 10;
      reasons.push(
        `${candidate.position}位置仍需补充(缺${candidateGap}人)`
      );
    } else {
      const currentCount = currentCounts[candidate.position];
      const idealCount = idealCounts[candidate.position];
      if (currentCount < idealCount + 1) {
        positionScore = 10;
        reasons.push(`${candidate.position}位置人员较少，可作为替补`);
      }
    }

    const levelGap = getLevelGap(candidate.level, avgLevel);
    let levelScore = levelGap;
    if (avgLevel === null) {
      reasons.push('暂无已报名球员，段位匹配度默认满分');
    } else if (levelGap === 30) {
      reasons.push(
        `段位为${candidate.level}，与现有队员平均水平契合`
      );
    } else if (levelGap === 15) {
      reasons.push(
        `段位为${candidate.level}，与现有队员平均水平接近`
      );
    } else {
      reasons.push(
        `段位为${candidate.level}，与现有队员水平有一定差距`
      );
    }

    const newCounts: Record<Position, number> = { ...currentCounts };
    newCounts[candidate.position] += 1;
    const newVariance = calculateVariance(newCounts);
    const currentVariance = calculateVariance(currentCounts);

    let balanceScore = 0;
    if (candidates.length > 0) {
      const varianceImprovement = currentVariance - newVariance;
      if (varianceImprovement > 0.1) {
        balanceScore = BALANCE_WEIGHT;
        reasons.push('加入后队伍位置配置更加均衡');
      } else if (varianceImprovement >= -0.1) {
        balanceScore = 10;
        reasons.push('加入后队伍位置均衡性保持稳定');
      } else {
        balanceScore = 0;
        reasons.push('加入后位置均衡性略有下降');
      }
    }

    const score = positionScore + levelScore + balanceScore;

    return {
      user: candidate,
      score,
      reasons,
    };
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 10);
}
