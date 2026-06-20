import axios from 'axios';

const API_BASE = '/api/debates';

export interface DebateMessagePayload {
  debateId: string;
  content: string;
  side: 'pro' | 'con';
  authorId: string;
}

export interface DebateListResponse {
  id: string;
  title: string;
  starter: string;
  participants: number;
  lastReply: string;
}

export async function getDebates(): Promise<DebateListResponse[]> {
  try {
    const res = await axios.get(`${API_BASE}`);
    return res.data;
  } catch {
    return [];
  }
}

export async function getDebateDetail(debateId: string): Promise<DebateListResponse | null> {
  try {
    const res = await axios.get(`${API_BASE}/${debateId}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function joinDebate(debateId: string, side: 'pro' | 'con', userId: string): Promise<void> {
  try {
    await axios.post(`${API_BASE}/${debateId}/join`, { side, userId });
  } catch {
    return;
  }
}

export async function sendMessage(payload: DebateMessagePayload): Promise<void> {
  try {
    await axios.post(`${API_BASE}/${payload.debateId}/messages`, {
      content: payload.content,
      side: payload.side,
      authorId: payload.authorId,
    });
  } catch {
    return;
  }
}

export async function createDebate(title: string, starterId: string): Promise<DebateListResponse> {
  try {
    const res = await axios.post(`${API_BASE}`, { title, starterId });
    return res.data;
  } catch {
    return {
      id: `d${Date.now()}`,
      title,
      starter: starterId,
      participants: 1,
      lastReply: '刚刚',
    };
  }
}
