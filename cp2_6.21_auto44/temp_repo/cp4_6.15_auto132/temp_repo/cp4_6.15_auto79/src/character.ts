import { SweeperGame, Cell } from './gameLogic';

export interface SkillResult {
  success: boolean;
  message: string;
  cellsAffected: Cell[];
  healthChange?: number;
}

export interface Character {
  id: string;
  name: string;
  skillName: string;
  cooldown: number;
  description: string;
  avatar: string;
  maxHealth: number;
  isPassive: boolean;
  executeSkill: (game: SweeperGame, row: number, col: number) => SkillResult;
}

const scout: Character = {
  id: 'scout',
  name: '侦察兵',
  skillName: '区域侦察',
  cooldown: 3,
  description: '一次性揭示周围3x3范围内所有格子',
  avatar: '🔭',
  maxHealth: 1,
  isPassive: false,
  executeSkill: (game: SweeperGame, row: number, col: number): SkillResult => {
    const cells = game.revealArea(row, col, 3);
    return {
      success: true,
      message: '区域侦察完成！',
      cellsAffected: cells,
    };
  },
};

const sapper: Character = {
  id: 'sapper',
  name: '工兵',
  skillName: '疑似标记',
  cooldown: 0,
  description: '标记一个格子为疑似地雷，标记错误扣除1点生命',
  avatar: '🛠️',
  maxHealth: 1,
  isPassive: false,
  executeSkill: (game: SweeperGame, row: number, col: number): SkillResult => {
    const result = game.suspectCell(row, col);
    const cell = game.getCell(row, col);

    if (!result.success) {
      return {
        success: false,
        message: '无法标记已揭开的格子',
        cellsAffected: [],
      };
    }

    const healthChange = result.isCorrect ? 0 : -1;

    return {
      success: true,
      message: result.isCorrect ? '疑似标记成功' : '标记错误！扣除1点生命',
      cellsAffected: cell ? [cell] : [],
      healthChange,
    };
  },
};

const medic: Character = {
  id: 'medic',
  name: '医疗兵',
  skillName: '战场急救',
  cooldown: -1,
  description: '被动技能：拥有3点生命，触雷仅扣血',
  avatar: '💊',
  maxHealth: 3,
  isPassive: true,
  executeSkill: (): SkillResult => {
    return {
      success: false,
      message: '医疗兵技能为被动技能',
      cellsAffected: [],
    };
  },
};

export const characters: Character[] = [scout, sapper, medic];

export const getCharacterById = (id: string): Character | undefined => {
  return characters.find(c => c.id === id);
};
