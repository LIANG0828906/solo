import type {
  StarEventsResponse,
  SubmitRequest,
  SubmitResponse,
  RandomEventSubmitRequest,
  RandomEventSubmitResponse,
  RecordsResponse,
} from '../types';

const API_BASE = '/api';

export async function getStarEvents(): Promise<StarEventsResponse> {
  try {
    const response = await fetch(`${API_BASE}/star-events`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch star events:', error);
    throw error;
  }
}

export async function submitAnswer(data: SubmitRequest): Promise<SubmitResponse> {
  try {
    const response = await fetch(`${API_BASE}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to submit answer:', error);
    throw error;
  }
}

export async function submitRandomEvent(data: RandomEventSubmitRequest): Promise<RandomEventSubmitResponse> {
  try {
    const response = await fetch(`${API_BASE}/random-event/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to submit random event:', error);
    throw error;
  }
}

export async function getRecords(): Promise<RecordsResponse> {
  try {
    const response = await fetch(`${API_BASE}/records`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch records:', error);
    throw error;
  }
}

export const api = {
  getStarEvents,
  submitAnswer,
  submitRandomEvent,
  getRecords,
};
