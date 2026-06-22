import type { User, Team, PlanHistory, Vote } from '@/types'
import { v4 as uuidv4 } from 'uuid'

class MemoryStore {
  private users: Map<string, User> = new Map()
  private teams: Map<string, Team> = new Map()
  private history: Map<string, PlanHistory[]> = new Map()
  private inviteCodeIndex: Map<string, string> = new Map()

  private defaultUserNames = ['张小明', '李小红', '王大力', '赵健康', '钱运动', '孙阳光', '周快乐', '吴活力']
  private avatarColors = ['#FF4757', '#1E90FF', '#2ED573', '#FFA502', '#A55EEA']

  getOrCreateUser(userId?: string): User {
    if (userId && this.users.has(userId)) {
      return this.users.get(userId)!
    }

    const id = userId || uuidv4()
    const user: User = {
      id,
      name: this.defaultUserNames[Math.floor(Math.random() * this.defaultUserNames.length)],
      avatarColor: this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)],
      fitnessLevel: 'intermediate',
      preferences: ['hiking', 'cycling'],
      locationRadius: 10
    }

    this.users.set(id, user)
    return user
  }

  updateUserPreferences(
    userId: string,
    fitnessLevel: User['fitnessLevel'],
    preferences: User['preferences'],
    locationRadius: number
  ): User | null {
    const user = this.users.get(userId)
    if (!user) return null

    user.fitnessLevel = fitnessLevel
    user.preferences = preferences
    user.locationRadius = locationRadius
    return user
  }

  saveTeam(team: Team): void {
    this.teams.set(team.id, team)
    this.inviteCodeIndex.set(team.inviteCode.toUpperCase(), team.id)
  }

  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId)
  }

  getTeamByInviteCode(inviteCode: string): Team | undefined {
    const teamId = this.inviteCodeIndex.get(inviteCode.toUpperCase())
    return teamId ? this.teams.get(teamId) : undefined
  }

  updateTeamVote(teamId: string, vote: Vote): Team | null {
    const team = this.teams.get(teamId)
    if (!team) return null
    team.vote = vote
    team.status = 'voting'
    return team
  }

  submitVote(teamId: string, userId: string, optionId: string): Vote | null {
    const team = this.teams.get(teamId)
    if (!team || !team.vote) return null
    if (Date.now() > team.vote.endTime) return null

    const hasVoted = Object.values(team.vote.votes).some(voters => voters.includes(userId))
    if (hasVoted) return team.vote

    if (!team.vote.votes[optionId]) {
      team.vote.votes[optionId] = []
    }
    team.vote.votes[optionId].push(userId)

    const result = this.checkVoteResult(team.vote, team.members.length)
    if (result) {
      team.vote.result = result
      team.status = 'confirmed'
    }

    return team.vote
  }

  private checkVoteResult(vote: Vote, totalMembers: number): Vote['result'] {
    const majority = Math.ceil(totalMembers / 2)

    for (const option of vote.options) {
      const voteCount = vote.votes[option.id]?.length || 0
      if (voteCount >= majority) {
        return option
      }
    }

    if (Date.now() > vote.endTime) {
      let maxVotes = 0
      let winner: Vote['result'] = undefined
      for (const option of vote.options) {
        const voteCount = vote.votes[option.id]?.length || 0
        if (voteCount > maxVotes) {
          maxVotes = voteCount
          winner = option
        }
      }
      return winner
    }

    return undefined
  }

  getUserHistory(userId: string): PlanHistory[] {
    return this.history.get(userId) || []
  }

  addHistory(history: PlanHistory): void {
    const userHistory = this.history.get(history.userId) || []
    userHistory.unshift(history)
    this.history.set(history.userId, userHistory)
  }
}

export const memoryStore = new MemoryStore()
