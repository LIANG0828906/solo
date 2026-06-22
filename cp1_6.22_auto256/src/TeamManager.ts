import { v4 as uuidv4 } from 'uuid'
import type { Team, TeamMember, Vote, VoteOption, User } from '@/types'
import * as api from '@/api'

export class TeamManager {
  private teams: Map<string, Team> = new Map()

  generateInviteCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    return code
  }

  async createTeam(user: User, planId: string): Promise<Team> {
    const existingTeam = this.findTeamByPlanId(planId)
    if (existingTeam) {
      return existingTeam
    }

    const team: Team = {
      id: uuidv4(),
      planId,
      inviteCode: this.generateInviteCode(),
      leaderId: user.id,
      members: [
        {
          userId: user.id,
          userName: user.name,
          avatarColor: user.avatarColor,
          joinedAt: Date.now()
        }
      ],
      maxMembers: 5,
      status: 'recruiting',
      createdAt: Date.now()
    }

    this.teams.set(team.id, team)

    try {
      await api.createTeam(team)
    } catch (e) {
      console.warn('Sync team to server failed:', e)
    }

    return team
  }

  async joinTeam(user: User, inviteCode: string): Promise<Team | null> {
    const team = this.findTeamByInviteCode(inviteCode)
    if (!team) return null

    if (team.members.length >= team.maxMembers) return null
    if (team.members.some(m => m.userId === user.id)) return team

    const member: TeamMember = {
      userId: user.id,
      userName: user.name,
      avatarColor: user.avatarColor,
      joinedAt: Date.now()
    }

    team.members.push(member)

    try {
      await api.joinTeam(team.id, user)
    } catch (e) {
      console.warn('Sync join team to server failed:', e)
    }

    return team
  }

  findTeamByInviteCode(inviteCode: string): Team | undefined {
    return Array.from(this.teams.values()).find(
      t => t.inviteCode.toUpperCase() === inviteCode.toUpperCase()
    )
  }

  findTeamByPlanId(planId: string): Team | undefined {
    return Array.from(this.teams.values()).find(t => t.planId === planId)
  }

  findTeamById(teamId: string): Team | undefined {
    return this.teams.get(teamId)
  }

  getMembers(teamId: string): TeamMember[] {
    const team = this.teams.get(teamId)
    return team ? team.members : []
  }

  async startVote(teamId: string, leaderId: string, options: VoteOption[]): Promise<Vote | null> {
    const team = this.teams.get(teamId)
    if (!team || team.leaderId !== leaderId) return null
    if (team.members.length < 2) return null

    const vote: Vote = {
      id: uuidv4(),
      teamId,
      options,
      startTime: Date.now(),
      endTime: Date.now() + 30 * 60 * 1000,
      votes: {}
    }

    options.forEach(opt => {
      vote.votes[opt.id] = []
    })

    team.vote = vote
    team.status = 'voting'

    try {
      await api.startVote(teamId, vote)
    } catch (e) {
      console.warn('Sync start vote to server failed:', e)
    }

    return vote
  }

  async submitVote(teamId: string, userId: string, optionId: string): Promise<Vote | null> {
    const team = this.teams.get(teamId)
    if (!team || !team.vote) return null
    if (Date.now() > team.vote.endTime) return null

    const hasVoted = Object.values(team.vote.votes).some(voters => voters.includes(userId))
    if (hasVoted) return team.vote

    if (!team.vote.votes[optionId]) {
      team.vote.votes[optionId] = []
    }
    team.vote.votes[optionId].push(userId)

    const result = this.checkVoteResult(team.vote)
    if (result) {
      team.vote.result = result
      team.status = 'confirmed'
    }

    try {
      await api.submitVote(teamId, userId, optionId)
    } catch (e) {
      console.warn('Sync submit vote to server failed:', e)
    }

    return team.vote
  }

  checkVoteResult(vote: Vote): VoteOption | null {
    const totalMembers = this.teams.get(vote.teamId)?.members.length || 0
    const majority = Math.ceil(totalMembers / 2)

    for (const option of vote.options) {
      const voteCount = vote.votes[option.id]?.length || 0
      if (voteCount >= majority) {
        return option
      }
    }

    if (Date.now() > vote.endTime) {
      let maxVotes = 0
      let winner: VoteOption | null = null
      for (const option of vote.options) {
        const voteCount = vote.votes[option.id]?.length || 0
        if (voteCount > maxVotes) {
          maxVotes = voteCount
          winner = option
        }
      }
      return winner
    }

    return null
  }

  updateTeamFromServer(team: Team): void {
    this.teams.set(team.id, team)
  }

  getAllTeams(): Team[] {
    return Array.from(this.teams.values())
  }
}

export const teamManager = new TeamManager()
