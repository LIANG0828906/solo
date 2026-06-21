import axios from 'axios';
import type { ProblemSummary, Problem, RunCodeResponse, SubmitCodeResponse, SubmissionRecord } from '../types';

const request = axios.create({
  baseURL: '',
  timeout: 30000,
});

export function getProblems(): Promise<ProblemSummary[]> {
  return request.get('/api/problems').then((res) => res.data);
}

export function getProblem(id: string): Promise<Problem> {
  return request.get(`/api/problems/${id}`).then((res) => res.data);
}

export function runCode(code: string, stdin?: string): Promise<RunCodeResponse> {
  return request.post('/api/run', { code, stdin }).then((res) => res.data);
}

export function submitCode(problemId: string, code: string): Promise<SubmitCodeResponse> {
  return request.post('/api/submit', { problemId, code }).then((res) => res.data);
}

export function getSubmissions(problemId: string): Promise<SubmissionRecord[]> {
  return request.get(`/api/submissions/${problemId}`).then((res) => res.data);
}
