import { RaceData, ClassData } from '../shared/types';

export const RACE_DATA: RaceData[] = [
  {
    id: 'human',
    name: '人类',
    bonuses: { strength: 1, agility: 1, intelligence: 1, constitution: 1, spirit: 1 },
    description: '适应性强的全能种族，所有属性+1',
  },
  {
    id: 'elf',
    name: '精灵',
    bonuses: { agility: 2, constitution: -1 },
    description: '敏捷的森林种族，敏捷+2，体质-1',
  },
  {
    id: 'dwarf',
    name: '矮人',
    bonuses: { constitution: 2, agility: -1 },
    description: '坚韧的山地种族，体质+2，敏捷-1',
  },
  {
    id: 'orc',
    name: '兽人',
    bonuses: { strength: 2, intelligence: -1 },
    description: '强壮的战斗种族，力量+2，智力-1',
  },
];

export const CLASS_DATA: ClassData[] = [
  {
    id: 'warrior',
    name: '战士',
    description: '近战大师，高生命高防御',
    primaryAttribute: 'strength',
  },
  {
    id: 'mage',
    name: '法师',
    description: '奥术之力，高伤害范围攻击',
    primaryAttribute: 'intelligence',
  },
  {
    id: 'ranger',
    name: '游侠',
    description: '远程射手，高命中高暴击',
    primaryAttribute: 'agility',
  },
  {
    id: 'rogue',
    name: '盗贼',
    description: '暗影刺客，高暴击高闪避',
    primaryAttribute: 'agility',
  },
  {
    id: 'priest',
    name: '牧师',
    description: '神圣使者，治疗与辅助',
    primaryAttribute: 'spirit',
  },
  {
    id: 'warlock',
    name: '术士',
    description: '暗影操控者，诅咒与召唤',
    primaryAttribute: 'intelligence',
  },
];
