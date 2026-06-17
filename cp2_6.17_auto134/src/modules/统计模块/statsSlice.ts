import { create } from 'zustand'
import { useVoteStore, Vote } from '../投票模块/voteSlice'

export interface BarChartItem {
  name: string
  total: number
}

export interface PieChartItem {
  name: string
  value: number
  color: string
}

const PIE_COLORS = ['#6C63FF', '#FF6584', '#4ECDC4', '#FFD93D', '#6BCB77']

interface StatsState {
  barChartData: BarChartItem[]
  pieChartData: PieChartItem[]
  totalVotes: number
  totalPolls: number
  computeStats: () => void
}

const getTotalVotes = (vote: Vote): number => {
  return vote.options.reduce((sum, opt) => sum + opt.votes, 0)
}

export const useStatsStore = create<StatsState>((set) => ({
  barChartData: [],
  pieChartData: [],
  totalVotes: 0,
  totalPolls: 0,

  computeStats: () => {
    const votes = useVoteStore.getState().votes

    const barChartData: BarChartItem[] = votes.map(vote => ({
      name: vote.title,
      total: getTotalVotes(vote),
    }))

    const pieChartData: PieChartItem[] = votes.map((vote, index) => ({
      name: vote.title,
      value: getTotalVotes(vote),
      color: PIE_COLORS[index % PIE_COLORS.length],
    }))

    const totalVotes = votes.reduce((sum, vote) => sum + getTotalVotes(vote), 0)

    set({
      barChartData,
      pieChartData,
      totalVotes,
      totalPolls: votes.length,
    })
  },
}))
