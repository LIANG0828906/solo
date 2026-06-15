import { describe, it, expect, beforeEach } from 'vitest';
import { characters, getCharacterById, Character, SkillResult } from './character';
import { SweeperGame } from './gameLogic';

const scout = characters[0];
const sapper = characters[1];
const medic = characters[2];

describe('角色定义', () => {
  describe('侦察兵 (Scout)', () => {
    it('应该有正确的属性', () => {
      expect(scout.id).toBe('scout');
      expect(scout.name).toBe('侦察兵');
      expect(scout.skillName).toBe('区域侦察');
      expect(scout.cooldown).toBe(3);
      expect(scout.maxHealth).toBe(1);
      expect(scout.isPassive).toBe(false);
      expect(scout.avatar).toBe('🔭');
    });

    it('技能描述应该包含3x3范围', () => {
      expect(scout.description).toContain('3x3');
    });
  });

  describe('工兵 (Sapper)', () => {
    it('应该有正确的属性', () => {
      expect(sapper.id).toBe('sapper');
      expect(sapper.name).toBe('工兵');
      expect(sapper.skillName).toBe('疑似标记');
      expect(sapper.cooldown).toBe(0);
      expect(sapper.maxHealth).toBe(1);
      expect(sapper.isPassive).toBe(false);
      expect(sapper.avatar).toBe('🛠️');
    });

    it('技能描述应该包含扣血说明', () => {
      expect(sapper.description).toContain('错误');
      expect(sapper.description).toContain('1');
    });
  });

  describe('医疗兵 (Medic)', () => {
    it('应该有正确的属性', () => {
      expect(medic.id).toBe('medic');
      expect(medic.name).toBe('医疗兵');
      expect(medic.skillName).toBe('战场急救');
      expect(medic.cooldown).toBe(-1);
      expect(medic.maxHealth).toBe(3);
      expect(medic.isPassive).toBe(true);
      expect(medic.avatar).toBe('💊');
    });

    it('技能描述应该说明是被动技能', () => {
      expect(medic.description).toContain('被动');
    });
  });
});

describe('技能执行', () => {
  describe('侦察兵技能', () => {
    let game: SweeperGame;

    beforeEach(() => {
      game = new SweeperGame(8, 8, 10);
    });

    it('执行技能应该揭开3x3范围', () => {
      const result: SkillResult = scout.executeSkill(game, 3, 3);
      expect(result.success).toBe(true);
      expect(result.cellsAffected.length).toBe(9);
      expect(result.healthChange).toBeUndefined();

      const grid = game.getGrid();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          expect(grid[3 + dr][3 + dc].isRevealed).toBe(true);
        }
      }
    });

    it('边界位置技能正常执行', () => {
      const result: SkillResult = scout.executeSkill(game, 0, 0);
      expect(result.success).toBe(true);
      expect(result.cellsAffected.length).toBe(4);
    });

    it('重复揭开相同区域不会重复计数', () => {
      const result1: SkillResult = scout.executeSkill(game, 3, 3);
      const result2: SkillResult = scout.executeSkill(game, 3, 3);
      expect(result1.cellsAffected.length).toBe(9);
      expect(result2.cellsAffected.length).toBe(0);
    });
  });

  describe('工兵技能', () => {
    let game: SweeperGame;

    beforeEach(() => {
      game = new SweeperGame(8, 8, 10);
      game.revealCell(0, 0);
    });

    it('标记地雷应该成功且不扣血', () => {
      const grid = game.getGrid();
      let mineRow = -1, mineCol = -1;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (grid[row][col].isMine && !grid[row][col].isRevealed) {
            mineRow = row;
            mineCol = col;
            break;
          }
        }
        if (mineRow !== -1) break;
      }

      const result: SkillResult = sapper.executeSkill(game, mineRow, mineCol);
      expect(result.success).toBe(true);
      expect(result.healthChange).toBe(0);
    });

    it('标记安全格子应该扣1血', () => {
      const grid = game.getGrid();
      let safeRow = -1, safeCol = -1;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (!grid[row][col].isMine && !grid[row][col].isRevealed) {
            safeRow = row;
            safeCol = col;
            break;
          }
        }
        if (safeRow !== -1) break;
      }

      const result: SkillResult = sapper.executeSkill(game, safeRow, safeCol);
      expect(result.success).toBe(true);
      expect(result.healthChange).toBe(-1);
    });

    it('取消疑似标记不扣血', () => {
      const grid = game.getGrid();
      let safeRow = -1, safeCol = -1;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (!grid[row][col].isMine && !grid[row][col].isRevealed) {
            safeRow = row;
            safeCol = col;
            break;
          }
        }
        if (safeRow !== -1) break;
      }

      sapper.executeSkill(game, safeRow, safeCol);
      const result: SkillResult = sapper.executeSkill(game, safeRow, safeCol);
      expect(result.healthChange).toBe(0);
    });

    it('已揭开的格子无法使用工兵技能', () => {
      game.revealCell(3, 3);
      const result: SkillResult = sapper.executeSkill(game, 3, 3);
      expect(result.success).toBe(false);
      expect(result.message).toBe('无法标记已揭开的格子');
    });
  });

  describe('医疗兵技能', () => {
    let game: SweeperGame;

    beforeEach(() => {
      game = new SweeperGame(8, 8, 10);
    });

    it('被动技能使用失败', () => {
      const result: SkillResult = medic.executeSkill(game, 3, 3);
      expect(result.success).toBe(false);
      expect(result.message).toBe('医疗兵技能为被动技能');
    });
  });

  describe('技能边界情况', () => {
    let game: SweeperGame;

    beforeEach(() => {
      game = new SweeperGame(8, 8, 10);
    });

    it('无效行坐标返回空数组', () => {
      const result: SkillResult = scout.executeSkill(game, -1, 3);
      expect(result.success).toBe(true);
      expect(result.cellsAffected.length).toBe(0);
    });

    it('无效列坐标返回空数组', () => {
      const result: SkillResult = scout.executeSkill(game, 3, 100);
      expect(result.success).toBe(true);
      expect(result.cellsAffected.length).toBe(0);
    });
  });
});

describe('角色查找', () => {
  it('应该导出所有三个角色', () => {
    expect(characters.length).toBe(3);
    expect(characters[0].id).toBe('scout');
    expect(characters[1].id).toBe('sapper');
    expect(characters[2].id).toBe('medic');
  });

  it('可以通过ID查找角色', () => {
    expect(getCharacterById('scout')?.id).toBe('scout');
    expect(getCharacterById('sapper')?.id).toBe('sapper');
    expect(getCharacterById('medic')?.id).toBe('medic');
    expect(getCharacterById('unknown')).toBeUndefined();
  });
});

describe('技能冷却验证', () => {
  it('侦察兵技能有3回合冷却', () => {
    expect(scout.cooldown).toBe(3);
  });

  it('工兵技能没有冷却', () => {
    expect(sapper.cooldown).toBe(0);
  });

  it('医疗兵是被动技能，冷却为-1', () => {
    expect(medic.cooldown).toBe(-1);
  });

  it('被动技能标志正确', () => {
    expect(scout.isPassive).toBe(false);
    expect(sapper.isPassive).toBe(false);
    expect(medic.isPassive).toBe(true);
  });
});

describe('生命值配置', () => {
  it('侦察兵和工兵只有1点生命', () => {
    expect(scout.maxHealth).toBe(1);
    expect(sapper.maxHealth).toBe(1);
  });

  it('医疗兵有3点生命', () => {
    expect(medic.maxHealth).toBe(3);
  });
});
