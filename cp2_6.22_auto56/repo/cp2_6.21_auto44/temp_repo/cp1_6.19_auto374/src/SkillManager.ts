import { create } from 'zustand';

export type SkillType = 'dash' | 'shield' | 'doubleJump' | 'slowTime';

export interface Skill {
  id: SkillType;
  name: string;
  cooldown: number;
  duration: number;
  currentCooldown: number;
  currentDuration: number;
  isActive: boolean;
  isReady: boolean;
  justReady: boolean;
  icon: string;
  particleCount: number;
}

interface SkillStore {
  skills: Record<SkillType, Skill>;
  triggerSkill: (skillId: SkillType) => boolean;
  updateSkills: (deltaTime: number) => void;
  resetJustReady: (skillId: SkillType) => void;
}

export const useSkillStore = create<SkillStore>((set, get) => ({
  skills: {
    dash: {
      id: 'dash',
      name: '冲刺',
      cooldown: 6000,
      duration: 0,
      currentCooldown: 0,
      currentDuration: 0,
      isActive: false,
      isReady: true,
      justReady: false,
      icon: '→',
      particleCount: 15,
    },
    shield: {
      id: 'shield',
      name: '护盾',
      cooldown: 8000,
      duration: 2000,
      currentCooldown: 0,
      currentDuration: 0,
      isActive: false,
      isReady: true,
      justReady: false,
      icon: '◈',
      particleCount: 20,
    },
    doubleJump: {
      id: 'doubleJump',
      name: '二段跳',
      cooldown: 5000,
      duration: 0,
      currentCooldown: 0,
      currentDuration: 0,
      isActive: false,
      isReady: true,
      justReady: false,
      icon: '↑',
      particleCount: 10,
    },
    slowTime: {
      id: 'slowTime',
      name: '时间减缓',
      cooldown: 12000,
      duration: 3000,
      currentCooldown: 0,
      currentDuration: 0,
      isActive: false,
      isReady: true,
      justReady: false,
      icon: '◉',
      particleCount: 25,
    },
  },

  triggerSkill: (skillId: SkillType): boolean => {
    const state = get();
    const skill = state.skills[skillId];
    if (!skill.isReady || skill.isActive) return false;

    set((state) => ({
      skills: {
        ...state.skills,
        [skillId]: {
          ...state.skills[skillId],
          isReady: false,
          isActive: skill.duration > 0,
          currentCooldown: skill.cooldown,
          currentDuration: skill.duration,
        },
      },
    }));
    return true;
  },

  updateSkills: (deltaTime: number) => {
    set((state) => {
      const newSkills = { ...state.skills };
      let changed = false;

      (Object.keys(newSkills) as SkillType[]).forEach((key) => {
        const skill = newSkills[key];
        let updated = { ...skill };

        if (updated.currentCooldown > 0) {
          updated.currentCooldown = Math.max(0, updated.currentCooldown - deltaTime);
          if (updated.currentCooldown === 0) {
            updated.isReady = true;
            updated.justReady = true;
          }
          changed = true;
        }

        if (updated.isActive && updated.currentDuration > 0) {
          updated.currentDuration = Math.max(0, updated.currentDuration - deltaTime);
          if (updated.currentDuration === 0) {
            updated.isActive = false;
          }
          changed = true;
        }

        newSkills[key] = updated;
      });

      return changed ? { skills: newSkills } : {};
    });
  },

  resetJustReady: (skillId: SkillType) => {
    set((state) => ({
      skills: {
        ...state.skills,
        [skillId]: {
          ...state.skills[skillId],
          justReady: false,
        },
      },
    }));
  },
}));
