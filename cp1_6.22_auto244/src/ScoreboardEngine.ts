import { socketService } from './SocketService';
import type { Event, RankItem, ScoreRecord, Project } from './types';

class ScoreboardEngine {
  private rankings: Map<string, RankItem[]> = new Map();
  private events: Event[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    socketService.on('score:sync', (data) => {
      if (data && typeof data === 'object') {
        const record = data as ScoreRecord;
        this.updateScore(record);
      }
    });

    socketService.on('event:sync', (data) => {
      if (data && typeof data === 'object' && 'id' in data) {
        const event = data as Event;
        const existingIndex = this.events.findIndex((e) => e.id === event.id);
        if (existingIndex >= 0) {
          this.events[existingIndex] = event;
        } else {
          this.events.push(event);
        }
        this.recalculateAllRankings();
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getRankings(projectId: string): RankItem[] {
    return this.rankings.get(projectId) || [];
  }

  getProjects(): Project[] {
    const projects: Project[] = [];
    this.events.forEach((event) => {
      projects.push(...event.projects);
    });
    return projects;
  }

  getEvents(): Event[] {
    return [...this.events];
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Scoreboard listener error:', e);
      }
    });
  }

  private updateScore(record: ScoreRecord): void {
    const startTime = performance.now();

    let project: Project | undefined;
    for (const event of this.events) {
      project = event.projects.find((p) => p.id === record.projectId);
      if (project) break;
    }

    if (!project) return;

    const participant = project.participants.find(
      (p) => p.id === record.participantId
    );
    if (!participant) return;

    participant.scores[record.projectId] = record.score;

    this.calculateProjectRanking(project);

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 50) {
      console.warn(`Scoreboard ranking took ${duration.toFixed(2)}ms, exceeds 50ms constraint`);
    }

    this.notifyListeners();
  }

  private recalculateAllRankings(): void {
    const startTime = performance.now();

    for (const event of this.events) {
      for (const project of event.projects) {
        this.calculateProjectRanking(project);
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 50) {
      console.warn(`Scoreboard recalculation took ${duration.toFixed(2)}ms, exceeds 50ms constraint`);
    }

    this.notifyListeners();
  }

  private calculateProjectRanking(project: Project): void {
    const participantsWithScores = project.participants
      .filter((p) => p.scores[project.id] !== undefined)
      .map((participant) => ({
        participant,
        score: participant.scores[project.id],
      }));

    if (project.type === 'timed') {
      participantsWithScores.sort((a, b) => a.score - b.score);
    } else {
      participantsWithScores.sort((a, b) => b.score - a.score);
    }

    const rankItems: RankItem[] = participantsWithScores.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    this.rankings.set(project.id, rankItems);
  }
}

export const scoreboardEngine = new ScoreboardEngine();
