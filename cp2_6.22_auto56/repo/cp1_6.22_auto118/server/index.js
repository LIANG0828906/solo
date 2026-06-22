const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const classRoutes = require('./src/routes/classRoutes');
const taskRoutes = require('./src/routes/taskRoutes');

const app = express();

app.use(cors());
app.use(express.json());

const db = {
  classes: new Map(),
  groups: new Map(),
  tasks: new Map(),
  submissions: new Map()
};

app.set('db', db);

app.use('/api/classes', classRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/admin/progress', (req, res) => {
  const { classes, groups, tasks, submissions } = req.app.get('db');
  const result = [];
  for (const [classId, cls] of classes) {
    for (const [groupId, group] of groups) {
      if (group.classId === classId) {
        const groupTasks = [];
        for (const [taskId, task] of tasks) {
          if (task.groupId === groupId) {
            groupTasks.push({ ...task, id: taskId });
          }
        }
        const groupSubmissions = [];
        for (const [subId, sub] of submissions) {
          if (sub.groupId === groupId) {
            groupSubmissions.push({ ...sub, id: subId });
          }
        }
        result.push({
          classId,
          className: cls.name,
          groupId,
          groupName: group.name,
          members: group.members,
          progress: group.progress,
          tasks: groupTasks,
          submissions: groupSubmissions
        });
      }
    }
  }
  res.json(result);
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
