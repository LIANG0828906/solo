import { v4 as uuidv4 } from 'uuid';

type EventListener = (...args: unknown[]) => void;

class SimpleEventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: EventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }
}

export interface VoteOption {
  id: string;
  text: string;
}

export interface Vote {
  id: string;
  question: string;
  options: VoteOption[];
  isMultiChoice: boolean;
  results: Record<string, number>;
  totalVotes: number;
  voterIds: Set<string>;
}

export const voteEventEmitter = new SimpleEventEmitter();

const votes: Map<string, Vote> = new Map();

export function createVote(
  question: string,
  optionTexts: string[],
  isMultiChoice: boolean
): Vote {
  const id = uuidv4().substring(0, 8);
  const options: VoteOption[] = optionTexts.map((text, idx) => ({
    id: `opt_${idx}`,
    text,
  }));
  const results: Record<string, number> = {};
  options.forEach((opt) => {
    results[opt.id] = 0;
  });
  const vote: Vote = {
    id,
    question,
    options,
    isMultiChoice,
    results,
    totalVotes: 0,
    voterIds: new Set(),
  };
  votes.set(id, vote);
  voteEventEmitter.emit('vote:created', vote);
  return vote;
}

export function submitVote(
  voteId: string,
  optionIds: string[],
  voterId: string
): Vote | null {
  const vote = votes.get(voteId);
  if (!vote) return null;
  if (vote.voterIds.has(voterId)) return null;

  vote.voterIds.add(voterId);
  optionIds.forEach((optId) => {
    if (vote.results[optId] !== undefined) {
      vote.results[optId] += 1;
    }
  });
  vote.totalVotes += 1;

  voteEventEmitter.emit('vote:updated', { ...vote, voterIds: Array.from(vote.voterIds) });
  return { ...vote, voterIds: new Set(vote.voterIds) };
}

export function getVote(voteId: string): Vote | null {
  return votes.get(voteId) ?? null;
}

export function getVoteResults(voteId: string): Vote | null {
  return votes.get(voteId) ?? null;
}
