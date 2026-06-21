const { Router } = require('express');

const router = Router();

let draft = {
  id: 'current',
  content: '',
  updatedAt: new Date().toISOString(),
};

router.get('/current', (_req, res) => {
  res.json(draft);
});

router.put('/current', (req, res) => {
  const { content } = req.body;
  draft = {
    ...draft,
    content: content ?? draft.content,
    updatedAt: new Date().toISOString(),
  };
  res.json(draft);
});

module.exports = { draftRouter: router };
