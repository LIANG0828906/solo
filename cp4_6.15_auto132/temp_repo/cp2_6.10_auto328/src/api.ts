import type {
  Fragment,
  Challenge,
  CombinationResult,
  WeeklyReport,
} from './types';

const baseURL = 'http://localhost:8000';

export const api = {
  async getFragments(): Promise<Fragment[]> {
    try {
      const response = await fetch(`${baseURL}/fragments`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch fragments:', error);
      throw error;
    }
  },

  async getTodayChallenges(): Promise<Challenge[]> {
    try {
      const response = await fetch(`${baseURL}/challenges/today`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch today challenges:', error);
      throw error;
    }
  },

  async combineFragments(
    fragments: string[],
    challengeId: string
  ): Promise<CombinationResult> {
    try {
      const response = await fetch(`${baseURL}/combine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fragments, challengeId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to combine fragments:', error);
      throw error;
    }
  },

  async getWeeklyReport(week?: string): Promise<WeeklyReport> {
    try {
      const url = week
        ? `${baseURL}/report/weekly?week=${encodeURIComponent(week)}`
        : `${baseURL}/report/weekly`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch weekly report:', error);
      throw error;
    }
  },

  async submitScore(
    points: number,
    challengeId: string
  ): Promise<{ newTotal: number }> {
    try {
      const response = await fetch(`${baseURL}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points, challengeId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to submit score:', error);
      throw error;
    }
  },
};
