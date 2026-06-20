import { create } from 'zustand'

export interface PollOption {
  id: string
  name: string
  votes: number
}

export interface PollState {
  currentPollId: string | null
  options: PollOption[]
  pollTitle: string
  pollDescription: string
  isEnded: boolean
  hasVoted: boolean
}

export interface PollActions {
  setPollData: (data: Partial<PollState>) => void
  updateOptionVotes: (optionId: string, votes: number) => void
  endPoll: () => void
  setHasVoted: (voted: boolean) => void
  reset: () => void
}

const initialState: PollState = {
  currentPollId: null,
  options: [],
  pollTitle: '',
  pollDescription: '',
  isEnded: false,
  hasVoted: false,
}

export const usePollStore = create<PollState & PollActions>((set) => ({
  ...initialState,
  setPollData: (data) => set((state) => ({ ...state, ...data })),
  updateOptionVotes: (optionId, votes) =>
    set((state) => ({
      options: state.options.map((opt) =>
        opt.id === optionId ? { ...opt, votes } : opt
      ),
    })),
  endPoll: () => set({ isEnded: true }),
  setHasVoted: (voted) => set({ hasVoted: voted }),
  reset: () => set(initialState),
}))
