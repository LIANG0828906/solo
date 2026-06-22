export enum CreativeType {
  功能 = '功能',
  技术 = '技术',
  设计 = '设计',
  市场 = '市场',
  运营 = '运营',
}

export interface ICreative {
  id: string;
  content: string;
  type: string;
  author: string;
  votes: number;
  voters: string[];
  createdAt: Date;
  boardRoomId: string;
  createdBy: string;
}

export interface IBoardRoom {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  creativeCount?: number;
  creatives: ICreative[];
}

export const TYPE_COLORS: Record<CreativeType, string> = {
  [CreativeType.功能]: '#2196F3',
  [CreativeType.技术]: '#4CAF50',
  [CreativeType.设计]: '#FF9800',
  [CreativeType.市场]: '#9C27B0',
  [CreativeType.运营]: '#F44336',
};
