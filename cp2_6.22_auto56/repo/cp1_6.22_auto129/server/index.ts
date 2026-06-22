import express from 'express';
import cors from 'cors';
import { dataMethods } from './data.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/activities', (req, res) => {
  const { status } = req.query;
  const activities = dataMethods.getActivities(status as string);
  res.json(activities);
});

app.get('/api/activity/:id', (req, res) => {
  const { id } = req.params;
  const activity = dataMethods.getActivityById(id);
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }
  res.json(activity);
});

app.post('/api/activities', (req, res) => {
  try {
    const activity = dataMethods.createActivity(req.body);
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create activity' });
  }
});

app.post('/api/register', (req, res) => {
  const { activityId, userId } = req.body;
  const result = dataMethods.registerActivity(activityId, userId);
  res.json(result);
});

app.post('/api/checkin', (req, res) => {
  const { activityId, userId } = req.body;
  const result = dataMethods.checkIn(activityId, userId);
  res.json(result);
});

app.get('/api/leaderboard', (req, res) => {
  const { limit } = req.query;
  const leaderboard = dataMethods.getLeaderboard(limit ? parseInt(limit as string) : undefined);
  res.json(leaderboard);
});

app.post('/api/users', (req, res) => {
  try {
    const user = dataMethods.registerUser(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Failed to register user' });
  }
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = dataMethods.getUserById(id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

app.post('/api/users/batch', (req, res) => {
  const { userIds } = req.body;
  const users = dataMethods.getUsersByIds(userIds);
  res.json(users);
});

app.get('/api/comments', (req, res) => {
  const { activityId, page, pageSize } = req.query;
  const result = dataMethods.getComments(
    activityId as string,
    page ? parseInt(page as string) : 1,
    pageSize ? parseInt(pageSize as string) : 10
  );
  res.json(result);
});

app.post('/api/comments', (req, res) => {
  const { activityId, userId, content } = req.body;
  const comment = dataMethods.createComment(activityId, userId, content);
  res.json(comment);
});

app.put('/api/comments/:id/like', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const result = dataMethods.likeComment(id, userId);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
