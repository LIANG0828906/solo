import { AiDecideRequest, AiDecideResponse } from '../types/game';

const API_BASE = '/api';

export async function requestAiDecision(
  request: AiDecideRequest
): Promise<AiDecideResponse> {
  const response = await fetch(`${API_BASE}/ai/decide`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`AI决策请求失败: ${response.status}`);
  }

  return response.json();
}
