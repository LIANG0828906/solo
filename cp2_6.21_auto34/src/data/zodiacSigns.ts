import { ZodiacSign } from '../types';

const colors = [
  '#ff6b6b', '#ff8e6b', '#ffb06b', '#ffd36b',
  '#fff56b', '#d3ff6b', '#a0ff6b', '#6bff9d',
  '#6bffe0', '#6bc9ff', '#6b96ff', '#6b6bff',
];

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const names = [
  '白羊座', '金牛座', '双子座', '巨蟹座',
  '狮子座', '处女座', '天秤座', '天蝎座',
  '射手座', '摩羯座', '宝瓶座', '双鱼座',
];

const descriptions = [
  '黄道十二星座之首，象征新生与活力。古代占星术中主战争与勇气。',
  '金星守护的星座，象征财富与稳定。主谷物丰收与物质繁荣。',
  '水星守护的星座，象征智慧与交流。主文书传递与贸易往来。',
  '月亮守护的星座，象征情感与家庭。主生育繁衍与家族传承。',
  '太阳守护的星座，象征权力与荣耀。主帝王将相与尊贵地位。',
  '水星守护的星座，象征精细与服务。主医药卫生与技艺传承。',
  '金星守护的星座，象征和谐与美。主婚姻嫁娶与艺术审美。',
  '火星与冥王星守护，象征深邃与转化。主生死轮回与神秘学。',
  '木星守护的星座，象征扩张与自由。主旅行探索与哲学思想。',
  '土星守护的星座，象征责任与结构。主官禄地位与事业成就。',
  '天王星守护的星座，象征创新与变革。主科技发明与人道主义。',
  '海王星守护的星座，象征梦幻与灵性。主宗教信仰与艺术灵感。',
];

export const zodiacSigns: ZodiacSign[] = letters.map((letter, index) => ({
  id: index + 1,
  letter,
  angle: index * 30,
  color: colors[index],
  name: names[index],
  description: descriptions[index],
}));
