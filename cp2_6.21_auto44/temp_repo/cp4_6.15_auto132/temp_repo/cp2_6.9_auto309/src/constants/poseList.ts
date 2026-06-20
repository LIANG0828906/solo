import { PoseOption, PoseState } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const poseOptions: PoseOption[] = [
  {
    id: 'standing-bodhisattva',
    name: '立姿菩萨',
    description: '端庄站立，手持净瓶，慈眉善目',
    icon: '🧘',
  },
  {
    id: 'sitting-arhat',
    name: '坐姿罗汉',
    description: '结跏趺坐，面容刚毅，神态自在',
    icon: '🪑',
  },
  {
    id: 'half-lotus-thinking',
    name: '半跏思惟',
    description: '半跏趺坐，一手托腮，作思惟状',
    icon: '🤔',
  },
  {
    id: 'child',
    name: '童子',
    description: '天真活泼，身姿轻盈，憨态可掬',
    icon: '👦',
  },
  {
    id: 'warrior',
    name: '武将',
    description: '威风凛凛，身披铠甲，手持法器',
    icon: '⚔️',
  },
];

export const createDefaultPose = (poseId: string): PoseState => {
  const basePoses: Record<string, Omit<PoseState, 'id'>> = {
    'standing-bodhisattva': {
      name: '立姿菩萨',
      description: '端庄站立的菩萨像',
      baseHeight: 2.2,
      headRatio: 5,
      shoulderRatio: 0.95,
      waistCurve: 0.6,
    },
    'sitting-arhat': {
      name: '坐姿罗汉',
      description: '自在坐姿的罗汉像',
      baseHeight: 1.6,
      headRatio: 4.5,
      shoulderRatio: 1.1,
      waistCurve: 0.3,
    },
    'half-lotus-thinking': {
      name: '半跏思惟',
      description: '思惟姿态的菩萨像',
      baseHeight: 1.8,
      headRatio: 5,
      shoulderRatio: 0.9,
      waistCurve: 0.5,
    },
    'child': {
      name: '童子',
      description: '活泼可爱的童子像',
      baseHeight: 1.4,
      headRatio: 4,
      shoulderRatio: 0.85,
      waistCurve: 0.4,
    },
    'warrior': {
      name: '武将',
      description: '威武勇猛的武将像',
      baseHeight: 2.4,
      headRatio: 5.5,
      shoulderRatio: 1.2,
      waistCurve: 0.2,
    },
  };

  return {
    id: uuidv4(),
    ...basePoses[poseId] || basePoses['standing-bodhisattva'],
  };
};

export const stepNames: string[] = [
  '选泥',
  '和泥',
  '塑胎',
  '打磨',
  '上底色',
  '勾勒花纹',
  '贴金箔',
];
