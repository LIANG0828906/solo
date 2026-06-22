import { v4 as uuidv4 } from 'uuid';
import { socketService } from './SocketService';
import type { Event, Project, Participant, ScoreRecord } from './types';

class EventManager {
  private events: Event[] = [];
  private participantCounter = 0;

  constructor() {
    socketService.on('event:sync', (data) => {
      if (data && typeof data === 'object' && 'id' in (data as object)) {
        const incomingEvent = data as Event;
        const existingIndex = this.events.findIndex((e) => e.id === incomingEvent.id);
        if (existingIndex >= 0) {
          this.events[existingIndex] = incomingEvent;
        } else {
          this.events.push(incomingEvent);
        }
      }
    });
  }

  getEvents(): Event[] {
    return [...this.events];
  }

  getEvent(eventId: string): Event | undefined {
    return this.events.find((e) => e.id === eventId);
  }

  createEvent(name: string, date: string): Event {
    const event: Event = {
      id: uuidv4(),
      name,
      date,
      projects: [],
    };
    this.events.push(event);
    socketService.emit('event:update', event);
    return event;
  }

  addProject(
    eventId: string,
    name: string,
    maxParticipants: number,
    type: 'timed' | 'scored'
  ): Project | null {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) return null;

    const project: Project = {
      id: uuidv4(),
      name,
      maxParticipants,
      type,
      participants: [],
    };

    event.projects.push(project);
    socketService.emit('event:update', event);
    return project;
  }

  addParticipant(
    eventId: string,
    projectId: string,
    name: string,
    unit: string
  ): Participant | null {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) return null;

    const project = event.projects.find((p) => p.id === projectId);
    if (!project) return null;

    if (project.participants.length >= project.maxParticipants) {
      return null;
    }

    this.participantCounter++;
    const number = `NO.${String(this.participantCounter).padStart(3, '0')}`;

    let participant = project.participants.find(
      (p) => p.name === name && p.unit === unit
    );

    if (!participant) {
      participant = {
        id: uuidv4(),
        name,
        unit,
        number,
        projects: [],
        scores: {},
      };
    }

    if (!participant.projects.includes(projectId)) {
      participant.projects.push(projectId);
    }

    if (!project.participants.find((p) => p.id === participant!.id)) {
      project.participants.push(participant);
    }

    socketService.emit('event:update', event);
    return participant;
  }

  recordScore(
    eventId: string,
    projectId: string,
    participantId: string,
    score: number
  ): boolean {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) return false;

    const project = event.projects.find((p) => p.id === projectId);
    if (!project) return false;

    const participant = project.participants.find((p) => p.id === participantId);
    if (!participant) return false;

    participant.scores[projectId] = score;

    const scoreRecord: ScoreRecord = {
      projectId,
      participantId,
      score,
      timestamp: Date.now(),
    };

    socketService.emit('score:update', scoreRecord);
    socketService.emit('event:update', event);

    return true;
  }

  getParticipants(eventId: string, projectId: string): Participant[] {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) return [];

    const project = event.projects.find((p) => p.id === projectId);
    if (!project) return [];

    return [...project.participants];
  }
}

export const eventManager = new EventManager();
