import { v4 as uuidv4 } from 'uuid';
import type { Activity, ActivityCreate, HourlyData, ClickPoint, ActivityStatus } from './types';

const activities = new Map<string, Activity>();
const hourlyDataMap = new Map<string, HourlyData[]>();
const heatmapDataMap = new Map<string, ClickPoint[]>();

const typeNames: Record<string, string> = {
  full_reduction: '满减',
  discount: '折扣',
  flash_sale: '秒杀'
};

function getActivityStatus(startTime: number, endTime: number): ActivityStatus {
  const now = Date.now();
  if (now < startTime) return 'upcoming';
  if (now > endTime) return 'ended';
  return 'ongoing';
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateActivity(data: ActivityCreate): Activity {
  const now = Date.now();
  const activity: Activity = {
    id: uuidv4(),
    name: data.name,
    type: data.type,
    budgetLimit: data.budgetLimit,
    budgetUsed: randomInRange(Math.floor(data.budgetLimit * 0.1), Math.floor(data.budgetLimit * 0.5)),
    startTime: data.startTime,
    endTime: data.endTime,
    status: getActivityStatus(data.startTime, data.endTime),
    impressions: randomInRange(1000, 50000),
    clicks: randomInRange(100, 5000),
    conversions: randomInRange(10, 500),
    revenue: randomInRange(1000, 100000)
  };

  activities.set(activity.id, activity);
  generateHourlyData(activity.id, 48);
  generateHeatmapData(activity.id);

  return activity;
}

export function generateHourlyData(activityId: string, hours: number): HourlyData[] {
  const data: HourlyData[] = [];
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;

  for (let i = hours - 1; i >= 0; i--) {
    const timestamp = now - i * hourMs;
    data.push({
      timestamp,
      impressions: randomInRange(100, 2000),
      clicks: randomInRange(10, 200),
      conversions: randomInRange(1, 20)
    });
  }

  hourlyDataMap.set(activityId, data);
  return data;
}

export function generateHeatmapData(activityId: string): ClickPoint[] {
  const data: ClickPoint[] = [];
  const gridSize = 20;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (Math.random() > 0.3) {
        data.push({
          x: (j / gridSize) * 100 + randomInRange(-2, 2),
          y: (i / gridSize) * 100 + randomInRange(-2, 2),
          count: randomInRange(1, 50)
        });
      }
    }
  }

  heatmapDataMap.set(activityId, data);
  return data;
}

export function updateData(): void {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;

  activities.forEach((activity) => {
    activity.status = getActivityStatus(activity.startTime, activity.endTime);

    if (activity.status === 'ongoing') {
      const impDelta = randomInRange(5, 50);
      const clickDelta = randomInRange(1, 10);
      const convDelta = randomInRange(0, 2);
      const revDelta = randomInRange(10, 500);
      const budgetDelta = randomInRange(5, 50);

      activity.impressions += impDelta;
      activity.clicks += clickDelta;
      activity.conversions += convDelta;
      activity.revenue += revDelta;
      activity.budgetUsed = Math.min(activity.budgetUsed + budgetDelta, activity.budgetLimit);

      const hourlyData = hourlyDataMap.get(activity.id);
      if (hourlyData && hourlyData.length > 0) {
        const lastHour = hourlyData[hourlyData.length - 1];
        const currentHourStart = Math.floor(now / hourMs) * hourMs;

        if (lastHour.timestamp < currentHourStart) {
          hourlyData.push({
            timestamp: currentHourStart,
            impressions: impDelta,
            clicks: clickDelta,
            conversions: convDelta
          });

          if (hourlyData.length > 48) {
            hourlyData.shift();
          }
        } else {
          lastHour.impressions += impDelta;
          lastHour.clicks += clickDelta;
          lastHour.conversions += convDelta;
        }
      }

      const heatmapData = heatmapDataMap.get(activity.id);
      if (heatmapData && heatmapData.length > 0) {
        const randomPoint = heatmapData[Math.floor(Math.random() * heatmapData.length)];
        randomPoint.count += randomInRange(1, 3);
      }
    }
  });
}

export function getActivities(): Activity[] {
  return Array.from(activities.values());
}

export function getActivityById(id: string): Activity | undefined {
  return activities.get(id);
}

export function getHourlyData(activityId: string): HourlyData[] {
  return hourlyDataMap.get(activityId) || [];
}

export function getHeatmapData(activityId: string): ClickPoint[] {
  return heatmapDataMap.get(activityId) || [];
}

export function getTypeName(type: string): string {
  return typeNames[type] || type;
}

export function initializeSampleData(): void {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const sampleActivities: ActivityCreate[] = [
    {
      name: '618年中大促',
      type: 'full_reduction',
      budgetLimit: 100000,
      startTime: now - dayMs,
      endTime: now + dayMs * 6
    },
    {
      name: '新用户专享折扣',
      type: 'discount',
      budgetLimit: 50000,
      startTime: now - dayMs * 3,
      endTime: now + dayMs * 4
    },
    {
      name: '限时秒杀专场',
      type: 'flash_sale',
      budgetLimit: 30000,
      startTime: now - dayMs * 2,
      endTime: now + dayMs * 2
    },
    {
      name: '会员双倍积分',
      type: 'full_reduction',
      budgetLimit: 80000,
      startTime: now + dayMs,
      endTime: now + dayMs * 7
    },
    {
      name: '清仓特卖会',
      type: 'discount',
      budgetLimit: 45000,
      startTime: now - dayMs * 5,
      endTime: now - dayMs * 1
    },
    {
      name: '周末狂欢购',
      type: 'flash_sale',
      budgetLimit: 25000,
      startTime: now + dayMs * 3,
      endTime: now + dayMs * 5
    }
  ];

  sampleActivities.forEach(activity => generateActivity(activity));
}

setInterval(updateData, 1000);
