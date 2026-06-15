import { Router } from 'express';
import { getCollection, findUserById } from '../db.js';

const router = Router();

const tagLabels = {
  schedule: { early: '早睡星人', night: '夜猫子' },
  cleanliness: { tidy: '洁癖常态', flexible: '随叫随到' },
  social: { outgoing: '社交达人', solo: '独行侠' },
};

function computeMatchScore(a, b) {
  let score = 0;
  const weights = { schedule: 35, cleanliness: 30, social: 20, budget: 15 };

  score += a.schedule === b.schedule ? weights.schedule : weights.schedule * 0.2;
  score += a.cleanliness === b.cleanliness ? weights.cleanliness : weights.cleanliness * 0.3;
  score += a.social === b.social ? weights.social : weights.social * 0.4;

  const aOverlap = Math.min(a.budgetMax, b.budgetMax) - Math.max(a.budgetMin, b.budgetMin);
  const aRange = a.budgetMax - a.budgetMin;
  const budgetRatio = aRange > 0 ? Math.max(0, aOverlap) / aRange : 1;
  score += weights.budget * Math.min(1, budgetRatio);

  return Math.round(score);
}

router.post('/find', async (req, res) => {
  try {
    const { schedule, cleanliness, social, budgetMin, budgetMax } = req.body;
    const me = { schedule, cleanliness, social, budgetMin, budgetMax };
    const users = await getCollection('users');

    const results = users
      .filter((u) => u.id !== 'user-me')
      .map((u) => {
        const matchScore = computeMatchScore(me, u);
        const tags = [tagLabels.schedule[u.schedule], tagLabels.cleanliness[u.cleanliness], tagLabels.social[u.social]];
        return {
          id: u.id,
          nickname: u.nickname,
          avatar: u.avatar,
          tags,
          budget: [u.budgetMin, u.budgetMax],
          matchScore,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    setTimeout(() => res.json(results), 120);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '匹配服务异常' });
  }
});

export default router;
