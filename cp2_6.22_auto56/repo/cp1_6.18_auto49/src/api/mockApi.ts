import { TimelineNode, Branch } from '../types';

export const getInitialTemplate = (): { nodes: TimelineNode[]; branches: Branch[] } => {
  const nodes: TimelineNode[] = [
    {
      id: 'node-1',
      title: '故事的开始',
      content: '## 一切的起点\n\n在一个阳光明媚的早晨，主角醒来发现了一封神秘的信件...',
      imageUrl: '',
      date: '2024-01-01',
      isBranch: false,
      edited: true,
      order: 0,
    },
    {
      id: 'node-2',
      title: '神秘的相遇',
      content: '主角在森林中遇到了一位神秘的老人，老人告诉了他一个古老的传说...',
      imageUrl: '',
      date: '2024-01-15',
      isBranch: false,
      edited: true,
      order: 1,
    },
    {
      id: 'branch-2-1',
      title: '选择相信',
      content: '主角选择相信老人的话，开始了冒险之旅...',
      imageUrl: '',
      date: '2024-01-16',
      isBranch: true,
      parentId: 'node-2',
      branchIndex: 0,
      edited: true,
      order: 2,
    },
    {
      id: 'branch-2-2',
      title: '选择怀疑',
      content: '主角对老人的话表示怀疑，决定自己调查真相...',
      imageUrl: '',
      date: '2024-01-16',
      isBranch: true,
      parentId: 'node-2',
      branchIndex: 1,
      edited: true,
      order: 3,
    },
    {
      id: 'node-3',
      title: '真相大白',
      content: '无论选择哪条路，主角最终都发现了隐藏在背后的真相...',
      imageUrl: '',
      date: '2024-02-01',
      isBranch: false,
      edited: true,
      order: 4,
    },
  ];

  const branches: Branch[] = [
    {
      parentId: 'node-2',
      nodeIds: ['branch-2-1', 'branch-2-2'],
      mergeTargetId: 'node-3',
    },
  ];

  return { nodes, branches };
};
