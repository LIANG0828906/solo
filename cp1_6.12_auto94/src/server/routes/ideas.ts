import { Router, Request, Response } from 'express';
import {
  validateCreateCard,
  validateUpdatePosition,
  validateTeamName,
} from '../middleware/validation';
import {
  getTeamState,
  addCard,
  updateCardPosition,
  updateCardGroup,
  deleteCard,
  updateGroupName,
  addGroup,
  deleteGroup,
} from '../store/teamStore';

const router = Router();

router.get('/:teamName', validateTeamName, (req: Request, res: Response) => {
  const { teamName } = req.params;
  const state = getTeamState(teamName);
  res.json({
    cards: state.cards,
    groups: state.groups,
    votingActive: state.votingActive,
    votingRound: state.votingRound,
  });
});

router.post('/', validateCreateCard, (req: Request, res: Response) => {
  const { content, author, authorColor, teamName, x, y } = req.body;
  const card = addCard(teamName, {
    content,
    author,
    authorColor,
    x,
    y,
    groupId: null,
  });

  const io = req.app.get('io');
  io.to(teamName).emit('card:created', card);

  res.status(201).json(card);
});

router.put('/:id/position', validateUpdatePosition, (req: Request, res: Response) => {
  const { id } = req.params;
  const { x, y, teamName } = req.body;
  const card = updateCardPosition(teamName, id, x, y);

  if (!card) {
    return res.status(404).json({ error: '卡片不存在' });
  }

  const io = req.app.get('io');
  io.to(teamName).emit('card:positionUpdated', { id, x, y });

  res.json(card);
});

router.put('/:id/group', (req: Request, res: Response) => {
  const { id } = req.params;
  const { groupId, teamName } = req.body;
  const card = updateCardGroup(teamName, id, groupId);

  if (!card) {
    return res.status(404).json({ error: '卡片不存在' });
  }

  const io = req.app.get('io');
  io.to(teamName).emit('card:groupUpdated', { id, groupId });

  res.json(card);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { teamName } = req.body;
  const success = deleteCard(teamName, id);

  if (!success) {
    return res.status(404).json({ error: '卡片不存在' });
  }

  const io = req.app.get('io');
  io.to(teamName).emit('card:deleted', id);

  res.json({ success: true });
});

router.get('/:teamName/groups', validateTeamName, (req: Request, res: Response) => {
  const { teamName } = req.params;
  const state = getTeamState(teamName);
  res.json(state.groups);
});

router.post('/groups', (req: Request, res: Response) => {
  const { teamName, name } = req.body;
  const group = addGroup(teamName, name);

  const io = req.app.get('io');
  io.to(teamName).emit('group:created', group);

  res.status(201).json(group);
});

router.put('/groups/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { teamName, name } = req.body;
  const group = updateGroupName(teamName, id, name);

  if (!group) {
    return res.status(404).json({ error: '分组不存在' });
  }

  const io = req.app.get('io');
  io.to(teamName).emit('group:updated', group);

  res.json(group);
});

router.delete('/groups/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { teamName } = req.body;
  const success = deleteGroup(teamName, id);

  if (!success) {
    return res.status(404).json({ error: '分组不存在' });
  }

  const io = req.app.get('io');
  io.to(teamName).emit('group:deleted', id);

  res.json({ success: true });
});

export default router;
