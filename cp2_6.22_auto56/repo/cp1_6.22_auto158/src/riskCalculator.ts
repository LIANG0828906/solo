export interface Risk {
  id: string;
  projectId: string;
  title: string;
  description: string;
  level: 'high' | 'medium' | 'low';
  probability: number;
  impact: number;
  response: string;
  owner: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: number;
}

export interface RiskProgress {
  high: {
    count: number;
    completed: number;
    ratio: number;
  };
  medium: {
    count: number;
    completed: number;
    ratio: number;
  };
  low: {
    count: number;
    completed: number;
    ratio: number;
  };
}

export function calculateRiskProgress(risks: Risk[]): RiskProgress {
  const initialProgress: RiskProgress = {
    high: { count: 0, completed: 0, ratio: 0 },
    medium: { count: 0, completed: 0, ratio: 0 },
    low: { count: 0, completed: 0, ratio: 0 },
  };

  return risks.reduce((progress, risk) => {
    const levelData = progress[risk.level];
    levelData.count += 1;
    if (risk.status === 'completed') {
      levelData.completed += 1;
    }
    levelData.ratio = levelData.count > 0 ? levelData.completed / levelData.count : 0;
    return progress;
  }, initialProgress);
}
