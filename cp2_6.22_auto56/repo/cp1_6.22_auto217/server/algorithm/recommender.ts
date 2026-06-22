import type { Course, UserProgress, RecommendedCourse } from '../../shared/types';
import { storage } from '../storage';

export class Recommender {
  private storage = storage;

  generateRecommendations(limit: number = 5): RecommendedCourse[] {
    const allCourses = this.storage.getAllCourses();
    const userProgress = this.storage.getUserProgress();
    const completedCourses = userProgress.filter(p => p.status === 'completed');
    const completedCourseIds = new Set(completedCourses.map(p => p.courseId));
    const inProgressIds = new Set(userProgress.filter(p => p.status === 'in_progress').map(p => p.courseId));

    const masteredKnowledge = this.getMasteredKnowledge(completedCourses, allCourses);
    const recommendations: RecommendedCourse[] = [];

    for (const course of allCourses) {
      if (completedCourseIds.has(course.id)) continue;

      const prereqMet = this.checkPrerequisites(course, completedCourseIds, inProgressIds);
      if (!prereqMet) continue;

      const confidence = this.calculateConfidence(course, completedCourses, masteredKnowledge, inProgressIds);
      const reason = this.generateReason(course, completedCourses, masteredKnowledge, inProgressIds);

      recommendations.push({ course, confidence, reason });
    }

    recommendations.sort((a, b) => b.confidence - a.confidence);
    return recommendations.slice(0, limit);
  }

  private getMasteredKnowledge(completed: UserProgress[], allCourses: Course[]): Set<string> {
    const mastered = new Set<string>();
    for (const progress of completed) {
      const course = allCourses.find(c => c.id === progress.courseId);
      if (course) {
        course.knowledgePoints.forEach(kp => mastered.add(kp));
      }
    }
    return mastered;
  }

  private checkPrerequisites(course: Course, completedIds: Set<string>, inProgressIds: Set<string>): boolean {
    if (course.prerequisites.length === 0) return true;

    let corePrereqsMet = 0;
    const totalPrereqs = course.prerequisites.length;

    for (const prereq of course.prerequisites) {
      if (completedIds.has(prereq)) {
        corePrereqsMet++;
      } else if (inProgressIds.has(prereq)) {
        corePrereqsMet += 0.5;
      }
    }

    return corePrereqsMet >= totalPrereqs * 0.5;
  }

  private calculateConfidence(
    course: Course,
    completedCourses: UserProgress[],
    masteredKnowledge: Set<string>,
    inProgressIds: Set<string>
  ): number {
    let score = 0;
    const totalFactors = 5;

    const knowledgeOverlap = course.knowledgePoints.filter(kp => masteredKnowledge.has(kp)).length;
    const knowledgeRatio = course.knowledgePoints.length > 0 ? knowledgeOverlap / course.knowledgePoints.length : 0;
    score += knowledgeRatio * 25;

    const completedPrereqs = course.prerequisites.filter(p => completedCourses.some(c => c.courseId === p)).length;
    const prereqRatio = course.prerequisites.length > 0 ? completedPrereqs / course.prerequisites.length : 1;
    score += prereqRatio * 20;

    if (inProgressIds.has(course.id)) {
      score += 20;
    } else if (course.prerequisites.some(p => inProgressIds.has(p))) {
      score += 10;
    }

    const avgScore = completedCourses.length > 0
      ? completedCourses.reduce((sum, c) => sum + c.testScore, 0) / completedCourses.length
      : 75;
    score += Math.min(avgScore / 100 * 20, 20);

    const difficultyPenalty = Math.min(course.prerequisites.length * 2, 10);
    score += Math.max(15 - difficultyPenalty, 5);

    return Math.min(Math.round(score * 100 / (totalFactors * 20)), 99);
  }

  private generateReason(
    course: Course,
    completedCourses: UserProgress[],
    masteredKnowledge: Set<string>,
    inProgressIds: Set<string>
  ): string {
    const reasons: string[] = [];

    if (inProgressIds.has(course.id)) {
      return '继续当前正在学习的课程';
    }

    const matchedPrereqs = course.prerequisites.filter(p => completedCourses.some(c => c.courseId === p));
    if (matchedPrereqs.length > 0) {
      reasons.push(`已完成 ${matchedPrereqs.length} 门前置课程`);
    }

    const relatedKnowledge = course.knowledgePoints.filter(kp => masteredKnowledge.has(kp));
    if (relatedKnowledge.length > 0) {
      reasons.push(`与已掌握的 ${relatedKnowledge.length} 个知识点相关`);
    }

    if (course.prerequisites.some(p => inProgressIds.has(p))) {
      reasons.push('前置课程正在进行中');
    }

    if (reasons.length === 0) {
      reasons.push('适合作为入门课程');
    }

    return reasons.join('，');
  }
}

export const recommender = new Recommender();
