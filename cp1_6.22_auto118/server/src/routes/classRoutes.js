const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/', (req, res) => {
  const { classes } = req.app.get('db');
  const result = [];
  for (const [id, cls] of classes) {
    result.push({ id, ...cls });
  }
  res.json(result);
});

router.post('/', (req, res) => {
  const { classes } = req.app.get('db');
  const { name, students } = req.body;
  const id = uuidv4();
  const parsedStudents = (students || '').split('\n').map(s => s.trim()).filter(Boolean);
  const cls = { name, students: parsedStudents, groups: [] };
  classes.set(id, cls);
  res.status(201).json({ id, ...cls });
});

router.get('/:id', (req, res) => {
  const { classes, groups, tasks } = req.app.get('db');
  const cls = classes.get(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  const classGroups = [];
  for (const [gid, group] of groups) {
    if (group.classId === req.params.id) {
      const g = { id: gid, ...group };
      if (group.taskId) {
        const task = tasks.get(group.taskId);
        if (task) g.task = task.description;
      }
      classGroups.push(g);
    }
  }
  res.json({ id: req.params.id, ...cls, groups: classGroups });
});

router.post('/:id/groups', (req, res) => {
  const { classes, groups } = req.app.get('db');
  const cls = classes.get(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  const { groupSize } = req.body;
  const shuffled = [...cls.students].sort(() => Math.random() - 0.5);
  const created = [];
  let groupIndex = 1;
  for (let i = 0; i < shuffled.length; i += groupSize) {
    const members = shuffled.slice(i, i + groupSize);
    const gid = uuidv4();
    const group = {
      classId: req.params.id,
      name: `第${groupIndex}组`,
      members,
      taskId: null,
      progress: 0,
      submissions: []
    };
    groups.set(gid, group);
    cls.groups.push(gid);
    created.push({ id: gid, ...group });
    groupIndex++;
  }
  res.status(201).json(created);
});

router.get('/:id/groups', (req, res) => {
  const { classes, groups, tasks } = req.app.get('db');
  const cls = classes.get(req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  const result = [];
  for (const [gid, group] of groups) {
    if (group.classId === req.params.id) {
      const g = { id: gid, ...group };
      if (group.taskId) {
        const task = tasks.get(group.taskId);
        if (task) g.task = task.description;
      }
      result.push(g);
    }
  }
  res.json(result);
});

module.exports = router;
