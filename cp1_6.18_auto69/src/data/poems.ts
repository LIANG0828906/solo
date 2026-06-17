import { Poem } from '../types';

export const poems: Poem[] = [
  {
    id: 'poem-1',
    title: '静夜思',
    author: '李白',
    lines: [
      {
        id: 'line-1',
        text: '床前明月光',
        fragments: ['床', '前', '明月', '光'],
        characterCount: 5,
      },
      {
        id: 'line-2',
        text: '疑是地上霜',
        fragments: ['疑', '是', '地上', '霜'],
        characterCount: 5,
      },
      {
        id: 'line-3',
        text: '举头望明月',
        fragments: ['举头', '望', '明月'],
        characterCount: 5,
      },
      {
        id: 'line-4',
        text: '低头思故乡',
        fragments: ['低头', '思', '故乡'],
        characterCount: 5,
      },
    ],
  },
  {
    id: 'poem-2',
    title: '春晓',
    author: '孟浩然',
    lines: [
      {
        id: 'line-1',
        text: '春眠不觉晓',
        fragments: ['春眠', '不觉', '晓'],
        characterCount: 5,
      },
      {
        id: 'line-2',
        text: '处处闻啼鸟',
        fragments: ['处处', '闻', '啼鸟'],
        characterCount: 5,
      },
      {
        id: 'line-3',
        text: '夜来风雨声',
        fragments: ['夜来', '风雨', '声'],
        characterCount: 5,
      },
      {
        id: 'line-4',
        text: '花落知多少',
        fragments: ['花落', '知', '多少'],
        characterCount: 5,
      },
    ],
  },
];

export const getCurrentPoem = (): Poem => {
  return poems[0];
};
