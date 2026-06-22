import axios from 'axios';
import type {
  Survey,
  Question,
  SurveyResponse,
  ResponseAnswer,
} from './types';

const api = axios.create({
  baseURL: '/api',
});

export const fetchSurveys = (): Promise<Survey[]> => {
  return api.get('/surveys').then((res) => res.data);
};

export const fetchSurvey = (id: string): Promise<Survey> => {
  return api.get(`/surveys/${id}`).then((res) => res.data);
};

export const createSurvey = (data: {
  title: string;
  description: string;
  questions: Question[];
}): Promise<Survey> => {
  return api.post('/surveys', data).then((res) => res.data);
};

export const updateSurvey = (
  id: string,
  data: Partial<Survey>
): Promise<Survey> => {
  return api.put(`/surveys/${id}`, data).then((res) => res.data);
};

export const publishSurvey = (id: string): Promise<Survey> => {
  return api.post(`/surveys/${id}/publish`).then((res) => res.data);
};

export const fetchResponses = (surveyId: string): Promise<SurveyResponse[]> => {
  return api.get(`/surveys/${surveyId}/responses`).then((res) => res.data);
};

export const submitResponse = (
  surveyId: string,
  data: { answers: ResponseAnswer[]; completionTime: number }
): Promise<SurveyResponse> => {
  return api
    .post(`/surveys/${surveyId}/responses`, data)
    .then((res) => res.data);
};
