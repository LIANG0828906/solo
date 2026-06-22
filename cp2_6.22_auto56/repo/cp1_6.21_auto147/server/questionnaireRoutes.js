import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const questionnaires = new Map();

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

router.post('/', (req, res) => {
  const { title, questions } = req.body;

  if (!title || title.length > 100) {
    return res.status(400).json({ error: '标题不能为空且不超过100字' });
  }

  if (!questions || questions.length === 0 || questions.length > 20) {
    return res.status(400).json({ error: '问题数量必须在1到20之间' });
  }

  for (const q of questions) {
    if (!q.type || !['single', 'multiple', 'text'].includes(q.type)) {
      return res.status(400).json({ error: '无效的问题类型' });
    }
    if (q.type !== 'text' && (!q.options || q.options.length < 2)) {
      return res.status(400).json({ error: '选择题至少需要2个选项' });
    }
  }

  const id = uuidv4();
  const inviteCode = generateInviteCode();
  const questionnaire = {
    id,
    title,
    questions,
    inviteCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  questionnaires.set(id, questionnaire);
  res.status(201).json(questionnaire);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const questionnaire = questionnaires.get(id);

  if (!questionnaire) {
    return res.status(404).json({ error: '问卷不存在' });
  }

  res.json(questionnaire);
});

router.get('/', (req, res) => {
  const list = Array.from(questionnaires.values()).map(q => ({
    id: q.id,
    title: q.title,
    questionCount: q.questions.length,
    inviteCode: q.inviteCode,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt
  }));
  res.json(list);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, questions } = req.body;

  const questionnaire = questionnaires.get(id);
  if (!questionnaire) {
    return res.status(404).json({ error: '问卷不存在' });
  }

  if (title && title.length > 100) {
    return res.status(400).json({ error: '标题不能超过100字' });
  }

  if (questions && (questions.length === 0 || questions.length > 20)) {
    return res.status(400).json({ error: '问题数量必须在1到20之间' });
  }

  if (questions) {
    for (const q of questions) {
      if (!q.type || !['single', 'multiple', 'text'].includes(q.type)) {
        return res.status(400).json({ error: '无效的问题类型' });
      }
      if (q.type !== 'text' && (!q.options || q.options.length < 2)) {
        return res.status(400).json({ error: '选择题至少需要2个选项' });
      }
    }
  }

  questionnaire.title = title || questionnaire.title;
  questionnaire.questions = questions || questionnaire.questions;
  questionnaire.updatedAt = new Date().toISOString();

  questionnaires.set(id, questionnaire);
  res.json(questionnaire);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!questionnaires.has(id)) {
    return res.status(404).json({ error: '问卷不存在' });
  }

  questionnaires.delete(id);
  res.json({ message: '问卷已删除' });
});

router.post('/retrieve', (req, res) => {
  const { inviteCode } = req.body;

  if (!inviteCode) {
    return res.status(400).json({ error: '邀请码不能为空' });
  }

  const questionnaire = Array.from(questionnaires.values()).find(
    q => q.inviteCode === inviteCode.toUpperCase()
  );

  if (!questionnaire) {
    return res.status(404).json({ error: '问卷不存在' });
  }

  res.json(questionnaire);
});

export default router;
export { questionnaires };
