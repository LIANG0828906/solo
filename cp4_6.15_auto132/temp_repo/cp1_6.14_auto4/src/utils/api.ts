/**
 * 【文件职责】封装后端 REST API 调用，统一管理 axios 实例、请求/响应拦截器及错误处理
 * 【被调用方】store/sessionStore、各页面组件（HomePage、MatchDetail 等）、各业务组件
 * 【数据流向】前端组件调用本模块方法 → axios 实例发送 HTTP 请求 → 后端返回 JSON → 拦截器统一解析/抛错 → 返回给调用方
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Position,
  Level,
  MatchMode,
  MatchStatus,
  MatchResult,
  MatchRole,
  User,
  Match,
  MatchHistory,
} from '../../../shared/types';

export type { Position, Level, MatchMode, MatchStatus, MatchResult, MatchRole };

export type SafeUser = Omit<User, 'password'>;

export interface MatchWithPlayers extends Omit<Match, 'playerIds'> {
  players: SafeUser[];
  creator: SafeUser;
  maxPlayers: number;
}

export interface RecommendPlayer {
  user: SafeUser;
  score: number;
  reasons: string[];
}

export interface HistoryItem extends MatchHistory {
  match: MatchWithPlayers | null;
}

export interface ApiError {
  message: string;
  code?: string | number;
}

export interface SearchMatchesParams {
  keyword?: string;
  status?: MatchStatus;
  mode?: MatchMode;
}

export interface RegisterPayload {
  nickname: string;
  position: Position;
  level: Level;
  password: string;
}

export interface LoginPayload {
  nickname: string;
  password: string;
}

export interface CreateMatchPayload {
  title: string;
  mode: MatchMode;
  date: string;
  time: string;
  location: string;
  note?: string;
}

export interface UpdateMatchPayload {
  title?: string;
  mode?: MatchMode;
  date?: string;
  time?: string;
  location?: string;
  note?: string;
  status?: MatchStatus;
}

export interface FinishMatchPayload {
  result: MatchResult;
  comment?: string;
}

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,