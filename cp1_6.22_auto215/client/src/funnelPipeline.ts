export interface FunnelStepResult {
  stepName: string;
  order: number;
  userCount: number;
  conversionRate: number;
  lossRate: number;
  avgDwellTime: number;
  users: Set<string>;
}

export interface FunnelResult {
  activityId: string;
  activityName: string;
  steps: FunnelStepResult[];
  overallConversionRate: number;
  avgDwellTime: number;
  totalEvents: number;
  userTypeBreakdown: Record<string, Record<string, { avgDwellTime: number; userCount: number }>>;
}

interface RawEvent {
  id: string;
  activityId: string;
  stepName: string;
  userId: string;
  userType: string;
  timestamp: number;
}

interface ActivityStep {
  name: string;
  order: number;
}

interface FunnelRawData {
  activityId: string;
  activityName: string;
  steps: ActivityStep[];
  events: RawEvent[];
  totalEvents: number;
}

export function computeFunnel(data: FunnelRawData): FunnelResult {
  const { activityId, activityName, steps, events, totalEvents } = data;

  const stepMap = new Map<string, { users: Set<string>; timestamps: number[]; userTypeTimestamps: Map<string, number[]> }>();

  for (const step of steps) {
    stepMap.set(step.name, {
      users: new Set(),
      timestamps: [],
      userTypeTimestamps: new Map(),
    });
  }

  for (const event of events) {
    const entry = stepMap.get(event.stepName);
    if (!entry) continue;
    entry.users.add(event.userId);
    entry.timestamps.push(event.timestamp);
    const ut = event.userType || 'new';
    if (!entry.userTypeTimestamps.has(ut)) {
      entry.userTypeTimestamps.set(ut, []);
    }
    entry.userTypeTimestamps.get(ut)!.push(event.timestamp);
  }

  const stepResults: FunnelStepResult[] = steps.map((step, index) => {
    const entry = stepMap.get(step.name)!;
    const userCount = entry.users.size;

    let conversionRate = 100;
    if (index > 0) {
      const prevCount = stepResults[index - 1].userCount;
      conversionRate = prevCount > 0 ? (userCount / prevCount) * 100 : 0;
    }

    const lossRate = 100 - conversionRate;

    let avgDwellTime = 0;
    if (index > 0 && entry.timestamps.length > 0) {
      const prevEntry = stepMap.get(steps[index - 1].name)!;
      const prevTimestamps = prevEntry.timestamps.sort((a, b) => a - b);
      const currTimestamps = entry.timestamps.sort((a, b) => a - b);
      if (prevTimestamps.length > 0 && currTimestamps.length > 0) {
        const avgPrev = prevTimestamps.reduce((s, t) => s + t, 0) / prevTimestamps.length;
        const avgCurr = currTimestamps.reduce((s, t) => s + t, 0) / currTimestamps.length;
        avgDwellTime = Math.max(0, (avgCurr - avgPrev) / 1000);
      }
    }

    return {
      stepName: step.name,
      order: index,
      userCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      lossRate: Math.round(lossRate * 100) / 100,
      avgDwellTime: Math.round(avgDwellTime * 10) / 10,
      users: entry.users,
    };
  });

  const firstCount = stepResults[0]?.userCount || 0;
  const lastCount = stepResults[stepResults.length - 1]?.userCount || 0;
  const overallConversionRate = firstCount > 0 ? Math.round((lastCount / firstCount) * 10000) / 100 : 0;

  const avgDwellTime = stepResults.length > 0
    ? Math.round((stepResults.reduce((s, r) => s + r.avgDwellTime, 0) / stepResults.length) * 10) / 10
    : 0;

  const userTypeBreakdown: Record<string, Record<string, { avgDwellTime: number; userCount: number }>> = {};
  const userTypeLabels: Record<string, string> = { new: '新用户', returning: '回流用户', 'high-value': '高价值用户' };

  for (const utKey of ['new', 'returning', 'high-value']) {
    const label = userTypeLabels[utKey];
    userTypeBreakdown[label] = {};
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const entry = stepMap.get(step.name)!;
      const typeTimestamps = entry.userTypeTimestamps.get(utKey) || [];
      const userSet = new Set<string>();
      const filteredEvents = events.filter((e) => e.stepName === step.name && e.userType === utKey);
      for (const e of filteredEvents) {
        userSet.add(e.userId);
      }

      let stepDwellTime = 0;
      if (i > 0 && typeTimestamps.length > 0) {
        const prevStep = steps[i - 1];
        const prevEntry = stepMap.get(prevStep.name)!;
        const prevTypeTimestamps = prevEntry.userTypeTimestamps.get(utKey) || [];
        if (prevTypeTimestamps.length > 0) {
          const avgPrev = prevTypeTimestamps.reduce((s, t) => s + t, 0) / prevTypeTimestamps.length;
          const avgCurr = typeTimestamps.reduce((s, t) => s + t, 0) / typeTimestamps.length;
          stepDwellTime = Math.max(0, (avgCurr - avgPrev) / 1000);
        }
      }

      userTypeBreakdown[label][step.name] = {
        avgDwellTime: Math.round(stepDwellTime * 10) / 10,
        userCount: userSet.size,
      };
    }
  }

  return {
    activityId,
    activityName,
    steps: stepResults,
    overallConversionRate,
    avgDwellTime,
    totalEvents,
    userTypeBreakdown,
  };
}
