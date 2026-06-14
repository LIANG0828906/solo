import { v4 as uuidv4 } from 'uuid';
import type { Debate, Argument, DebateRecord, Speaker, RecordType } from '../src/types';

class InMemoryStore {
  private debates: Map<string, Debate> = new Map();
  private arguments: Map<string, Argument[]> = new Map();
  private records: Map<string, DebateRecord[]> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const now = Date.now();
    
    const sampleDebates: Debate[] = [
      {
        id: uuidv4(),
        name: '人工智能是否会取代人类工作',
        proSpeaker: '张三',
        conSpeaker: '李四',
        proDuration: 5,
        conDuration: 5,
        status: 'waiting',
        currentSpeaker: 'pro',
        remainingTime: 5 * 60 * 1000,
        isRunning: false,
        createdAt: now - 3600000,
      },
      {
        id: uuidv4(),
        name: '大学生是否应该创业',
        proSpeaker: '王五',
        conSpeaker: '赵六',
        proDuration: 3,
        conDuration: 3,
        status: 'in_progress',
        currentSpeaker: 'con',
        remainingTime: 2 * 60 * 1000 + 30 * 1000,
        isRunning: false,
        createdAt: now - 7200000,
      },
    ];

    sampleDebates.forEach(debate => {
      this.debates.set(debate.id, debate);
      this.arguments.set(debate.id, []);
      this.records.set(debate.id, []);
    });
  }

  getAllDebates(): Debate[] {
    return Array.from(this.debates.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getDebate(id: string): Debate | undefined {
    return this.debates.get(id);
  }

  createDebate(data: Omit<Debate, 'id' | 'status' | 'currentSpeaker' | 'remainingTime' | 'isRunning' | 'createdAt'>): Debate {
    const debate: Debate = {
      id: uuidv4(),
      ...data,
      status: 'waiting',
      currentSpeaker: 'pro',
      remainingTime: data.proDuration * 60 * 1000,
      isRunning: false,
      createdAt: Date.now(),
    };
    this.debates.set(debate.id, debate);
    this.arguments.set(debate.id, []);
    this.records.set(debate.id, []);
    return debate;
  }

  updateDebate(id: string, updates: Partial<Debate>): Debate | undefined {
    const debate = this.debates.get(id);
    if (!debate) return undefined;
    
    const updated = { ...debate, ...updates };
    this.debates.set(id, updated);
    return updated;
  }

  getArguments(debateId: string): Argument[] {
    return this.arguments.get(debateId) || [];
  }

  addArgument(debateId: string, data: Omit<Argument, 'id' | 'debateId' | 'timestamp'>): Argument | undefined {
    if (!this.debates.has(debateId)) return undefined;
    
    const argument: Argument = {
      id: uuidv4(),
      debateId,
      ...data,
      timestamp: Date.now(),
    };
    
    const args = this.arguments.get(debateId) || [];
    args.push(argument);
    this.arguments.set(debateId, args);
    
    this.addRecord(debateId, {
      speaker: data.speaker,
      type: 'argument',
      content: data.content,
    });
    
    return argument;
  }

  getRecords(debateId: string): DebateRecord[] {
    return this.records.get(debateId) || [];
  }

  addRecord(debateId: string, data: Omit<DebateRecord, 'id' | 'debateId' | 'timestamp'>): DebateRecord | undefined {
    if (!this.debates.has(debateId)) return undefined;
    
    const record: DebateRecord = {
      id: uuidv4(),
      debateId,
      ...data,
      timestamp: Date.now(),
    };
    
    const records = this.records.get(debateId) || [];
    records.push(record);
    this.records.set(debateId, records);
    
    return record;
  }

  switchSpeaker(debateId: string): Debate | undefined {
    const debate = this.debates.get(debateId);
    if (!debate) return undefined;
    
    const newSpeaker: Speaker = debate.currentSpeaker === 'pro' ? 'con' : 'pro';
    const newDuration = newSpeaker === 'pro' ? debate.proDuration : debate.conDuration;
    
    const updated = this.updateDebate(debateId, {
      currentSpeaker: newSpeaker,
      remainingTime: newDuration * 60 * 1000,
      isRunning: false,
    });
    
    this.addRecord(debateId, {
      speaker: newSpeaker,
      type: 'switch_speaker',
    });
    
    return updated;
  }

  resetTimer(debateId: string): Debate | undefined {
    const debate = this.debates.get(debateId);
    if (!debate) return undefined;
    
    const duration = debate.currentSpeaker === 'pro' ? debate.proDuration : debate.conDuration;
    
    const updated = this.updateDebate(debateId, {
      remainingTime: duration * 60 * 1000,
      isRunning: false,
    });
    
    this.addRecord(debateId, {
      speaker: debate.currentSpeaker,
      type: 'timer_reset',
    });
    
    return updated;
  }

  updateTimer(debateId: string, isRunning: boolean, remainingTime: number, currentSpeaker?: Speaker): Debate | undefined {
    const debate = this.debates.get(debateId);
    if (!debate) return undefined;
    
    const updates: Partial<Debate> = { isRunning, remainingTime };
    if (currentSpeaker) updates.currentSpeaker = currentSpeaker;
    
    const updated = this.updateDebate(debateId, updates);
    
    const recordType: RecordType = isRunning ? 'timer_start' : 'timer_pause';
    this.addRecord(debateId, {
      speaker: currentSpeaker || debate.currentSpeaker,
      type: recordType,
    });
    
    return updated;
  }

  markTimeUp(debateId: string): void {
    const debate = this.debates.get(debateId);
    if (!debate) return;
    
    this.addRecord(debateId, {
      speaker: debate.currentSpeaker,
      type: 'time_up',
    });
  }
}

export const store = new InMemoryStore();
