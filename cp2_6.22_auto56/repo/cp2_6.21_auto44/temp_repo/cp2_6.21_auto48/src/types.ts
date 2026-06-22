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
  [CreativeType.功能]: '#1890ff',
  [CreativeType.交互]: '#52c41a',
  [CreativeType.视觉]: '#eb2f96',
  [CreativeType.运营]: '#fa8c16',
  [CreativeType.技术]: '#722ed1',
};
