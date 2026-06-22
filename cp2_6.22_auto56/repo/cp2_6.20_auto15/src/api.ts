import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface SurveyCreatePayload {
  title: string;
  description: string;
  questions: {
    id: string;
    type: string;
    title: string;
    required: boolean;
    options?: string[];
  }[];
}

export interface SurveyResponse {
  id: string;
  title: string;
  description: string;
  questions: any[];
  response_count: number;
  created_at: string;
}

export interface SurveyResults {
  survey: SurveyResponse;
  responses: any[];
  statistics: any;
}

const api = {
  createSurvey: async (payload: SurveyCreatePayload): Promise<SurveyResponse> => {
    const { data } = await client.post('/surveys', payload);
    return data;
  },

  getSurvey: async (id: string): Promise<SurveyResponse> => {
    const { data } = await client.get(`/surveys/${id}`);
    return data;
  },

  submitResponse: async (surveyId: string, response: { answers: Record<string, any> }): Promise<any> => {
    const { data } = await client.post(`/surveys/${surveyId}/responses`, response);
    return data;
  },

  getResults: async (surveyId: string, params?: { start_date?: string; end_date?: string }): Promise<SurveyResults> => {
    const { data } = await client.get(`/surveys/${surveyId}/results`, { params });
    return data;
  },

  exportCSV: async (surveyId: string, params?: { start_date?: string; end_date?: string }): Promise<Blob> => {
    const { data } = await client.get(`/surveys/${surveyId}/export`, {
      params,
      responseType: 'blob',
    });
    return data;
  },
};

export default api;
