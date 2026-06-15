import axios from 'axios';
import type { Scene, Action, ActionResult, GameEvent, Report } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateYaji = async (): Promise<Scene> => {
  const response = await api.get<Scene>('/yaji/generate');
  return response.data;
};

export const submitAction = async (
  sceneId: string,
  musicId: string,
  chessId: string,
  paintingId: string
): Promise<ActionResult> => {
  const response = await api.post<ActionResult>('/yaji/action', {
    sceneId,
    musicId,
    chessId,
    paintingId,
  });
  return response.data;
};

export const getAvailableActions = async (sceneId: string): Promise<Action> => {
  const response = await api.get<Action>(`/yaji/actions?sceneId=${sceneId}`);
  return response.data;
};

export const handleEvent = async (
  eventId: string,
  optionId: string,
  sceneId: string
): Promise<ActionResult> => {
  const response = await api.post<ActionResult>('/yaji/event', {
    eventId,
    optionId,
    sceneId,
  });
  return response.data;
};

export const generateReport = async (): Promise<Report> => {
  const response = await api.get<Report>('/yaji/report');
  return response.data;
};

export const triggerRandomEvent = async (sceneId: string): Promise<GameEvent> => {
  const response = await api.get<GameEvent>(`/yaji/event/random?sceneId=${sceneId}`);
  return response.data;
};

export default api;
