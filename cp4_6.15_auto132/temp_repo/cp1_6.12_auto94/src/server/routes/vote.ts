import { Router, Request, Response } from 'express';
import { validateVote, validateTeamName } from '../middleware/validation';
import {
  voteCard,
  startVoting,
  endVoting,
  getSortedCards,
  getTeamState,
  addUser,
  getUser,
} from '../store/teamStore';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/:teamName/results', validateTeamName, (req: Request, res: Response) => {
  const { teamName } = req.params;
  const sortedCards = getSortedCards(teamName);
  const state = getTeamState(teamName);
  res.json({
    cards: sortedCards,
    votingActive: state.votingActive,
    votingRound: state.votingRound,
  });
});

router.post('/vote', validateVote, (req: Request, res: Response) => {
  const { cardId, userId, teamName } = req.body;
  const result = voteCard(teamName, cardId, userId);

  if (!result) {
    return res.status(400).json({ error: '投票失败，积分不足或已投过票' });
  }

  const io = req.app.get('io');
  io.to(teamName).emit('vote:updated', {
    cardId,
    votes: result.card.votes,
    userId,
    votesRemaining: result.user.votesRemaining,
  });

  res.json({
    card: result.card,
    user: result.user,
  });
});

router.post('/start', (req: Request, res: Response) => {
  const { teamName } = req.body;
  const state = startVoting(teamName);

  const io = req.app.get('io');
  io.to(teamName).emit('voting:started', {
    votingActive: state.votingActive,
    votingRound: state.votingRound,
    users: state.users.map((u) => ({ id: u.id, votesRemaining: u.votesRemaining })),
  });

  res.json({
    votingActive: state.votingActive,
    votingRound: state.votingRound,
  });
});

router.post('/end', (req: Request, res: Response) => {
  const { teamName } = req.body;
  const state = endVoting(teamName);
  const sortedCards = getSortedCards(teamName);

  const io = req.app.get('io');
  io.to(teamName).emit('voting:ended', {
    votingActive: state.votingActive,
    sortedCards,
  });

  res.json({
    votingActive: state.votingActive,
    sortedCards,
  });
});

router.post('/user', (req: Request, res: Response) => {
  const { teamName, nickname, color } = req.body;
  const userId = uuidv4();
  const user = addUser(teamName, {
    id: userId,
    nickname,
    color,
    teamName,
  });

  const io = req.app.get('io');
  io.to(teamName).emit('user:joined', user);

  res.json(user);
});

router.get('/:teamName/users/:userId', (req: Request, res: Response) => {
  const { teamName, userId } = req.params;
  const user = getUser(teamName, userId);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json(user);
});

export default router;
