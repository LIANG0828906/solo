import { v4 as uuidv4 } from 'uuid';
import type { Skill, User, ProficiencyLevel, TimeSlot } from '../types';

export const calculateMatchScore = (
  userSkill: Skill,
  targetSkill: Skill
): number => {
  let score = 0;

  if (userSkill.name === targetSkill.name) {
    score += 50;
  }

  const overlappingSlots = userSkill.timeSlots.filter(slot =>
    targetSkill.timeSlots.includes(slot)
  );
  score += overlappingSlots.length * 20;

  return Math.min(score, 100);
};

export const findMatchingBuddies = (
  currentUserId: string,
  userSkill: Skill,
  allSkills: Skill[],
  allUsers: User[]
): Array<{ userId: string; user: User; skill: Skill; score: number }> => {
  const start = performance.now();
  const results: Array<{ userId: string; user: User; skill: Skill; score: number }> = [];

  for (const skill of allSkills) {
    if (skill.userId === currentUserId) continue;
    if (skill.name !== userSkill.name) continue;

    const score = calculateMatchScore(userSkill, skill);
    if (score > 60) {
      const user = allUsers.find(u => u.id === skill.userId);
      if (user) {
        results.push({ userId: user.id, user, skill, score });
      }
    }
  }

  const elapsed = performance.now() - start;
  if (elapsed > 50) {
    console.warn(`匹配算法耗时 ${elapsed.toFixed(2)}ms，超过50ms限制`);
  }

  return results.sort((a, b) => b.score - a.score);
};

export const createSkill = (
  userId: string,
  name: string,
  level: ProficiencyLevel,
  timeSlots: TimeSlot[]
): Skill => ({
  id: uuidv4(),
  name: name.trim().slice(0, 20),
  level,
  timeSlots,
  userId,
  createdAt: Date.now()
});

export const validateSkillName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 20;
};

export const getUniqueSkillNames = (skills: Skill[]): string[] => {
  return [...new Set(skills.map(s => s.name))];
};

export const generateMockUsers = (count: number): User[] => {
  const names = ['小明', '小红', '阿杰', '小李', '小王', '小张', '阿美', '小华', '小李', '阿强',
    '小林', '小陈', '小周', '小吴', '小郑'];
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: uuidv4(),
      nickname: names[i % names.length] + (i >= names.length ? i : ''),
    });
  }
  return users;
};

export const generateMockSkills = (users: User[]): Skill[] => {
  const skillNames = ['JavaScript', 'Python', '画画', '吉他', '钢琴', '日语', '英语', '瑜伽', '摄影'];
  const levels: ProficiencyLevel[] = ['初级', '中级', '高级'];
  const slots: TimeSlot[][] = [
    ['morning'], ['afternoon'], ['evening'], ['morning', 'evening'], ['afternoon', 'evening']
  ];
  const skills: Skill[] = [];
  for (const user of users.slice(1)) {
    const skillCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < skillCount; i++) {
      skills.push(createSkill(
        user.id,
      skillNames[Math.floor(Math.random() * skillNames.length)],
      levels[Math.floor(Math.random() * levels.length)],
      slots[Math.floor(Math.random() * slots.length)]
      ));
    }
  }
  return skills;
};
