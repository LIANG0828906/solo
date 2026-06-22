import axios from 'axios';
import type {
  StartStoryResponse,
  ChooseResponse,
  GameState,
  SaveData,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const storyApi = {
  startStory: async (theme?: string): Promise<StartStoryResponse> => {
    const { data } = await api.post('/start', { theme });
    return data;
  },

  chooseOption: async (
    nodeId: string,
    choiceId: string,
    state: GameState
  ): Promise<ChooseResponse> => {
    const { data } = await api.post('/choose', {
      current_node_id: nodeId,
      choice_id: choiceId,
      state,
    });
    return data;
  },

  saveGame: async (saveData: SaveData): Promise<{ success: boolean }> => {
    const { data } = await api.post('/save', saveData);
    return data;
  },

  loadGame: async (saveId: string): Promise<SaveData> => {
    const { data } = await api.get(`/load/${saveId}`);
    return data;
  },

  listSaves: async (): Promise<SaveData[]> => {
    const { data } = await api.get('/saves');
    return data;
  },
};
