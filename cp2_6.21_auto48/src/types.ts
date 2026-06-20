export enum CreativeType {
  功能 = '功能',
  交互 = '交互',
  视觉 = '视觉',
  运营 = '运营',
  技术 = '技术',
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
  creatives: ICreative[];
}

export const TYPE_COLORS: Record<CreativeType, string> = {
  [CreativeType.功能]: '#2196F3',
  [CreativeType.交互]: '#4CAF50',
  [CreativeType.视觉]: '#FF9800',
  [CreativeType.运营]: '#9C27B0',
  [CreativeType.技术]: '#F44336',
};
