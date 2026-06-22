import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface VoteOption {
  id: string
  text: string
  votes: number
}

export interface Vote {
  id: string
  title: string
  options: VoteOption[]
  createdAt: number
}

interface VoteState {
  votes: Vote[]
  votedIds: string[]
  createVote: (title: string, options: string[]) => void
  castVote: (voteId: string, optionId: string) => void
  hasVoted: (voteId: string) => boolean
  loadFromStorage: () => void
}

const STORAGE_KEY_VOTES = 'votehub_votes'
const STORAGE_KEY_VOTED_IDS = 'votehub_voted_ids'

const loadVotes = (): Vote[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_VOTES)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const loadVotedIds = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_VOTED_IDS)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const useVoteStore = create<VoteState>((set, get) => ({
  votes: [],
  votedIds: [],

  loadFromStorage: () => {
    set({
      votes: loadVotes(),
      votedIds: loadVotedIds(),
    })
  },

  createVote: (title: string, options: string[]) => {
    const newVote: Vote = {
      id: uuidv4(),
      title: title.trim(),
      options: options
        .filter(opt => opt.trim().length > 0)
        .map(text => ({
          id: uuidv4(),
          text: text.trim(),
          votes: 0,
        })),
      createdAt: Date.now(),
    }

    const newVotes = [newVote, ...get().votes]
    localStorage.setItem(STORAGE_KEY_VOTES, JSON.stringify(newVotes))
    set({ votes: newVotes })
  },

  castVote: (voteId: string, optionId: string) => {
    const { votedIds } = get()
    if (votedIds.includes(voteId)) return

    const newVotes = get().votes.map(vote => {
      if (vote.id !== voteId) return vote
      return {
        ...vote,
        options: vote.options.map(opt =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ),
      }
    })

    const newVotedIds = [...votedIds, voteId]

    localStorage.setItem(STORAGE_KEY_VOTES, JSON.stringify(newVotes))
    localStorage.setItem(STORAGE_KEY_VOTED_IDS, JSON.stringify(newVotedIds))

    set({ votes: newVotes, votedIds: newVotedIds })
  },

  hasVoted: (voteId: string) => {
    return get().votedIds.includes(voteId)
  },
}))
