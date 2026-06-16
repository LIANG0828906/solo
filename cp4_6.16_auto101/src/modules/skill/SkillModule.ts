import { v4 as uuidv4 } from 'uuid';
import type { Skill, SkillCategory } from '../../types';
import {
  getAllSkills,
  saveSkills,
} from '../../utils/storage';

export const SkillModule = {
  async createSkill(
    userId: string,
    data: Omit<Skill, 'id' | 'userId' | 'createdAt'>
  ): Promise<Skill> {
    const skills = await getAllSkills();
    const newSkill: Skill = {
      id: uuidv4(),
      userId,
      name: data.name,
      category: data.category,
      description: data.description,
      tags: data.tags,
      createdAt: Date.now(),
    };
    skills.push(newSkill);
    await saveSkills(skills);
    return newSkill;
  },

  async getSkillById(skillId: string): Promise<Skill | null> {
    const skills = await getAllSkills();
    return skills.find((s) => s.id === skillId) || null;
  },

  async getUserSkills(userId: string): Promise<Skill[]> {
    const skills = await getAllSkills();
    return skills
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async getSkillsByCategory(category: SkillCategory): Promise<Skill[]> {
    const skills = await getAllSkills();
    return skills
      .filter((s) => s.category === category)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async getAllSkills(): Promise<Skill[]> {
    const skills = await getAllSkills();
    return skills.sort((a, b) => b.createdAt - a.createdAt);
  },

  async searchSkills(keyword: string): Promise<Skill[]> {
    const skills = await getAllSkills();
    if (!keyword.trim()) {
      return skills.sort((a, b) => b.createdAt - a.createdAt);
    }
    const lowerKeyword = keyword.toLowerCase();
    return skills
      .filter((skill) => {
        return (
          skill.name.toLowerCase().includes(lowerKeyword) ||
          skill.description.toLowerCase().includes(lowerKeyword) ||
          skill.tags.some((tag) =>
            tag.toLowerCase().includes(lowerKeyword)
          )
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async deleteSkill(skillId: string): Promise<void> {
    const skills = await getAllSkills();
    const filtered = skills.filter((s) => s.id !== skillId);
    await saveSkills(filtered);
  },
};
