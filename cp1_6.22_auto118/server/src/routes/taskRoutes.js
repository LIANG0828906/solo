const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getRandomTask } = require('../services/fakeTaskPool');
const { calculateProgress } = require('../services/scoreCalculator');

const router = express.Router();

router.post('/claim', (req, res) => {
  const { tasks, groups } = req.app.get('db');
  const { groupId, classId } = req.body;
  const group = groups.get(groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const description = getRandomTask();
  const id = uuidv4();
  const task = {
    groupId,
    classId,
    description,
    assignedAt: Date.now(),
    countdown: 1800
  };
  tasks.set(id, task);
  group.taskId = id;
  res.status(201).json({ id, ...task });
});

router.post('/progress', (req, res) => {
  const { submissions, groups } = req.app.get('db');
  const { groupId, text, rating } = req.body;
  const group = groups.get(groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const id = uuidv4();
  const submission = {
    groupId,
    text,
    rating,
    timestamp: Date.now()
  };
  submissions.set(id, submission);
  group.submissions.push(id);
  const groupSubmissions = [];
  for (const sid of group.submissions) {
    const sub = submissions.get(sid);
    if (sub) groupSubmissions.push(sub);
  }
  group.progress = calculateProgress(groupSubmissions);
  res.status(201).json({ id, ...submission, progress: group.progress });
});

router.get('/progress', (req, res) => {
  const { classes, groups, tasks, submissions } = req.app.get('db');
  const result = [];
  for (const [groupId, group] of groups) {
    const cls = classes.get(group.classId);
    const groupSubmissions = [];
    for (const sid of group.submissions) {
      const sub = submissions.get(sid);
      if (sub) groupSubmissions.push({ id: sid, ...sub });
    }
    const groupTasks = [];
    if (group.taskId) {
      const task = tasks.get(group.taskId);
      if (task) groupTasks.push({ id: group.taskId, ...task });
    }
    result.push({
      classId: group.classId,
      className: cls ? cls.name : null,
      groupId,
      groupName: group.name,
      members: group.members,
      progress: group.progress,
      tasks: groupTasks,
      submissions: groupSubmissions
    });
  }
  res.json(result);
});

module.exports = router;
