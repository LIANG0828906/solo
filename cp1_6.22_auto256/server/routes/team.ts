import { Router } from 'express'
import type { Request, Response } from 'express'
import { memoryStore } from '../store/memory'
import type { Team, Vote, TeamMember, User } from '@/types'

const router = Router()

router.post('/', (req: Request, res: Response) => {
  const team = req.body as Team
  memoryStore.saveTeam(team)
  res.json({ team })
})

router.post('/join', (req: Request, res: Response) => {
  const { userId, inviteCode } = req.body as { userId: string; inviteCode: string }
  const team = memoryStore.getTeamByInviteCode(inviteCode)
  if (!team) {
    res.status(404).json({ error: 'Team not found' })
    return
  }
  if (team.members.length >= team.maxMembers) {
    res.status(400).json({ error: 'Team is full' })
    return
  }
  const user = memoryStore.getOrCreateUser(userId)
  if (!team.members.some(m => m.userId === userId)) {
    const member: TeamMember = {
      userId: user.id,
      userName: user.name,
      avatarColor: user.avatarColor,
      joinedAt: Date.now()
    }
    team.members.push(member)
    memoryStore.saveTeam(team)
  }
  res.json({ team })
})

router.get('/:id', (req: Request, res: Response) => {
  const team = memoryStore.getTeam(req.params.id)
  if (!team) {
    res.status(404).json({ error: 'Team not found' })
    return
  }
  res.json({ team })
})

router.put('/:id/vote/start', (req: Request, res: Response) => {
  const { leaderId, options } = req.body as { leaderId: string; options: Vote['options'] }
  const team = memoryStore.getTeam(req.params.id)
  if (!team || team.leaderId !== leaderId) {
    res.status(403).json({ error: 'Not authorized' })
    return
  }
  if (team.members.length < 2) {
    res.status(400).json({ error: 'Need at least 2 members to vote' })
    return
  }
  const vote: Vote = {
    id: `vote-${Date.now()}`,
    teamId: team.id,
    options,
    startTime: Date.now(),
    endTime: Date.now() + 30 * 60 * 1000,
    votes: {}
  }
  options.forEach(opt => {
    vote.votes[opt.id] = []
  })
  const updatedTeam = memoryStore.updateTeamVote(team.id, vote)
  if (!updatedTeam) {
    res.status(404).json({ error: 'Team not found' })
    return
  }
  res.json({ vote })
})

router.put('/:id/vote', (req: Request, res: Response) => {
  const { userId, optionId } = req.body as { userId: string; optionId: string }
  const vote = memoryStore.submitVote(req.params.id, userId, optionId)
  if (!vote) {
    res.status(404).json({ error: 'Vote not found or expired' })
    return
  }
  res.json({ vote })
})

router.get('/:id/vote', (req: Request, res: Response) => {
  const team = memoryStore.getTeam(req.params.id)
  if (!team || !team.vote) {
    res.status(404).json({ error: 'Vote not found' })
    return
  }
  res.json({ vote: team.vote })
})

export default router
