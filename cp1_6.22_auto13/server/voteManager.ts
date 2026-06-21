import { Vote, VoteType, VoteOption, VoteResult, RatingResult, VoteSubmission } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

class VoteManager {
  private votes: Map<string, Vote> = new Map();
  private participantVotes: Map<string, Set<string>> = new Map();

  startVote(type: VoteType, question: string, options: VoteOption[]): Vote {
    const id = uuidv4();
    const results: VoteResult[] = options.map(opt => ({ optionId: opt.id, count: 0 }));
    const ratingResults: RatingResult[] | undefined = type === 'rating'
      ? [1, 2, 3, 4, 5].map(r => ({ rating: r, count: 0 }))
      : undefined;

    const vote: Vote = {
      id,
      type,
      question,
      options,
      isActive: true,
      createdAt: Date.now(),
      results,
      ratingResults
    };

    this.votes.set(id, vote);
    return vote;
  }

  endVote(voteId: string): Vote | null {
    const vote = this.votes.get(voteId);
    if (!vote) return null;
    vote.isActive = false;
    return vote;
  }

  addVote(submission: VoteSubmission): Vote | null {
    const vote = this.votes.get(submission.voteId);
    if (!vote || !vote.isActive) return null;

    const participantKey = `${submission.participantId}-${submission.voteId}`;
    if (this.participantVotes.has(participantKey)) {
      return vote;
    }

    this.participantVotes.set(participantKey, new Set());

    if (vote.type === 'rating' && submission.rating !== undefined) {
      const ratingResults = vote.ratingResults!;
      const result = ratingResults.find(r => r.rating === submission.rating);
      if (result) result.count++;
    } else if (submission.selectedOptionIds) {
      for (const optionId of submission.selectedOptionIds) {
        const result = vote.results.find(r => r.optionId === optionId);
        if (result) result.count++;
      }
    }

    return vote;
  }

  getVote(voteId: string): Vote | null {
    return this.votes.get(voteId) || null;
  }

  getActiveVotes(): Vote[] {
    return Array.from(this.votes.values()).filter(v => v.isActive);
  }

  getAllVotes(): Vote[] {
    return Array.from(this.votes.values());
  }
}

export const voteManager = new VoteManager();
