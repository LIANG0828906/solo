import type { Tea, Snack } from './types';

export const TEAS: Tea[] = [
  {
    id: 'longjing',
    name: '龙井',
    color: '#8db58c',
    origin: '浙江杭州西湖',
    year: '甲辰年春',
    aroma: '豆香馥郁，兰香幽远',
    description: '色绿、香郁、味甘、形美，四绝闻名天下'
  },
  {
    id: 'biluochun',
    name: '碧螺春',
    color: '#a8c976',
    origin: '江苏苏州洞庭山',
    year: '甲辰年明前',
    aroma: '花果清香，鲜嫩持久',
    description: '一嫩三鲜，铜丝条，螺旋形，满身毛'
  },
  {
    id: 'dahongpao',
    name: '大红袍',
    color: '#2b241a',
    origin: '福建武夷山',
    year: '癸卯年秋',
    aroma: '岩骨花香，兰香悠长',
    description: '武夷岩茶之王，香气馥郁持久，岩韵明显'
  },
  {
    id: 'zhengshan',
    name: '正山小种',
    color: '#8b4513',
    origin: '福建武夷山桐木关',
    year: '甲辰年夏',
    aroma: '松烟香，桂圆汤香',
    description: '世界红茶鼻祖，松烟熏制，汤色红亮'
  },
  {
    id: 'tieguanyin',
    name: '铁观音',
    color: '#556b2f',
    origin: '福建安溪',
    year: '甲辰年秋',
    aroma: '兰花香馥郁，观音韵明显',
    description: '七泡有余香，汤色金黄，滋味醇厚甘鲜'
  },
  {
    id: 'baihao',
    name: '白毫银针',
    color: '#e8e4d9',
    origin: '福建福鼎',
    year: '甲辰年头春',
    aroma: '毫香显著，清甜鲜爽',
    description: '白毫满披，色白如银，汤色杏黄明亮'
  }
];

export const SNACKS: Snack[] = [
  {
    id: 'guihua',
    name: '桂花糕',
    description: '糯米粉揉制，桂花点缀，香甜软糯'
  },
  {
    id: 'xingren',
    name: '杏仁酥',
    description: '杏仁磨粉，酥油和面，入口即化'
  },
  {
    id: 'meizi',
    name: '梅子干',
    description: '青梅腌制，酸甜可口，生津止渴'
  },
  {
    id: 'longxu',
    name: '龙须糖',
    description: '麦芽糖拉制，千丝万缕，香甜酥脆'
  }
];
