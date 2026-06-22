export interface FlavorTag {
  id: string;
  name: string;
  color: string;
  regions: string[];
}

export interface FlavorCategory {
  id: string;
  name: string;
  color: string;
  tags: FlavorTag[];
}

export const flavorWheelData: FlavorCategory[] = [
  {
    id: 'fruit',
    name: '果酸',
    color: '#E8A87C',
    tags: [
      { id: 'citrus', name: '柑橘', color: '#F5A962', regions: ['埃塞俄比亚', '肯尼亚'] },
      { id: 'berry', name: '浆果', color: '#E87461', regions: ['埃塞俄比亚', '卢旺达'] },
      { id: 'stone', name: '核果', color: '#F2994A', regions: ['哥伦比亚', '危地马拉'] },
    ],
  },
  {
    id: 'floral',
    name: '花香',
    color: '#C38D9E',
    tags: [
      { id: 'jasmine', name: '茉莉花', color: '#D4A5A5', regions: ['埃塞俄比亚', '耶加雪菲'] },
      { id: 'rose', name: '玫瑰', color: '#E8B4B8', regions: ['也门', '埃塞俄比亚'] },
      { id: 'chamomile', name: '洋甘菊', color: '#E8C4C4', regions: ['肯尼亚', '坦桑尼亚'] },
    ],
  },
  {
    id: 'nutty',
    name: '坚果',
    color: '#A8A8A8',
    tags: [
      { id: 'almond', name: '杏仁', color: '#C4A77D', regions: ['巴西', '哥伦比亚'] },
      { id: 'hazelnut', name: '榛子', color: '#B8956E', regions: ['危地马拉', '洪都拉斯'] },
      { id: 'walnut', name: '核桃', color: '#A67B5B', regions: ['秘鲁', '玻利维亚'] },
    ],
  },
  {
    id: 'roasted',
    name: '烘烤',
    color: '#6B4226',
    tags: [
      { id: 'caramel', name: '焦糖', color: '#8B5E3C', regions: ['苏门答腊', '巴西'] },
      { id: 'chocolate', name: '巧克力', color: '#5D3A1A', regions: ['哥斯达黎加', '巴拿马'] },
      { id: 'tobacco', name: '烟草', color: '#4A2C1A', regions: ['苏门答腊', '印度'] },
    ],
  },
];

export const getAllTags = (): FlavorTag[] => {
  return flavorWheelData.flatMap((category) => category.tags);
};

export const getTagById = (id: string): FlavorTag | undefined => {
  return getAllTags().find((tag) => tag.id === id);
};

export const getCategoryByTagId = (tagId: string): FlavorCategory | undefined => {
  return flavorWheelData.find((category) =>
    category.tags.some((tag) => tag.id === tagId)
  );
};
