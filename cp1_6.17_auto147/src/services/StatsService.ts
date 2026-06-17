import type { StatsData } from '../types';

const API_BASE = '/api';

export interface FormattedStats {
  moodChart: {
    labels: string[];
    data: (number | null)[];
  };
  taskChart: {
    labels: string[];
    completed: number[];
    total: number[];
    taskLists: { date: string; tasks: StatsData['completedTaskList'] }[];
  };
}

export const StatsService = {
  async getStats(startDate: string, endDate: string): Promise<FormattedStats> {
    const res = await fetch(`${API_BASE}/stats?start=${startDate}&end=${endDate}`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const data: StatsData[] = await res.json();

    return {
      moodChart: {
        labels: data.map(d => {
          const date = new Date(d.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        data: data.map(d => d.avgMood)
      },
      taskChart: {
        labels: data.map(d => {
          const date = new Date(d.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        completed: data.map(d => d.completedTasks),
        total: data.map(d => d.totalTasks),
        taskLists: data.map(d => ({
          date: d.date,
          tasks: d.completedTaskList
        }))
      }
    };
  },

  getLast7DaysRange(): { start: string; end: string } {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }
};
