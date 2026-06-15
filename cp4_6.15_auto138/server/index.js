import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

let ideas = [];
let onlineUsers = 0;

const groupColors = {
  'pending': '#00bcd4',
  'in-progress': '#ff9800',
  'completed': '#4caf50'
};

function calculateMatrixScore(idea, allIdeas = ideas) {
  if (allIdeas.length === 0) {
    return { feasibility: 0, influence: 0 };
  }

  const feasibilityRaw = idea.likes * 0.6 + idea.comments.length * 0.4;
  const influenceRaw = idea.likes * 0.4 + idea.comments.length * 0.6;

  let maxFeasibility = 0;
  let maxInfluence = 0;
  allIdeas.forEach(i => {
    const f = i.likes * 0.6 + i.comments.length * 0.4;
    const inf = i.likes * 0.4 + i.comments.length * 0.6;
    if (f > maxFeasibility) maxFeasibility = f;
    if (inf > maxInfluence) maxInfluence = inf;
  });

  const feasibility = maxFeasibility > 0 
    ? Math.max(0, Math.min(100, (feasibilityRaw / maxFeasibility) * 100))
    : 0;
  const influence = maxInfluence > 0 
    ? Math.max(0, Math.min(100, (influenceRaw / maxInfluence) * 100))
    : 0;

  return { feasibility, influence };
}

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('onlineUsers', onlineUsers);
  
  socket.emit('initialIdeas', ideas);
  
  socket.on('addIdea', (ideaData) => {
    const newIdea = {
      id: uuidv4(),
      title: ideaData.title,
      description: ideaData.description,
      author: ideaData.author || '匿名用户',
      authorAvatar: ideaData.authorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + uuidv4(),
      likes: 0,
      likedBy: [],
      comments: [],
      group: 'pending',
      createdAt: Date.now(),
      matrixScore: { feasibility: 0, influence: 0 }
    };
    ideas.unshift(newIdea);
    io.emit('ideaAdded', newIdea);
  });
  
  socket.on('likeIdea', ({ ideaId, userId }) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (idea) {
      const userIndex = idea.likedBy.indexOf(userId);
      if (userIndex === -1) {
        idea.likes++;
        idea.likedBy.push(userId);
      } else {
        idea.likes--;
        idea.likedBy.splice(userIndex, 1);
      }
      
      ideas.forEach(i => {
        i.matrixScore = calculateMatrixScore(i, ideas);
      });
      
      io.emit('ideaUpdated', idea);
      io.emit('allMatrixScoresUpdated', ideas.map(i => ({
        id: i.id,
        feasibility: i.matrixScore.feasibility,
        influence: i.matrixScore.influence
      })));
    }
  });
  
  socket.on('addComment', ({ ideaId, comment, author }) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (idea) {
      const newComment = {
        id: uuidv4(),
        text: comment,
        author: author || '匿名用户',
        createdAt: Date.now()
      };
      idea.comments.push(newComment);
      
      ideas.forEach(i => {
        i.matrixScore = calculateMatrixScore(i, ideas);
      });
      
      io.emit('commentAdded', { ideaId, comment: newComment });
      io.emit('allMatrixScoresUpdated', ideas.map(i => ({
        id: i.id,
        feasibility: i.matrixScore.feasibility,
        influence: i.matrixScore.influence
      })));
    }
  });
  
  socket.on('updateGroup', ({ ideaId, group }) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (idea) {
      idea.group = group;
      io.emit('groupUpdated', { ideaId, group });
    }
  });
  
  socket.on('updateMatrixScore', ({ ideaId, feasibility, influence }) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (idea) {
      idea.matrixScore = { feasibility, influence };
      io.emit('matrixScoreUpdated', { ideaId, feasibility, influence });
    }
  });
  
  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('onlineUsers', onlineUsers);
  });
});

app.get('/api/ideas', (req, res) => {
  res.json(ideas);
});

app.get('/api/matrix', (req, res) => {
  const matrixData = ideas.map(idea => {
    const score = calculateMatrixScore(idea);
    return {
      id: idea.id,
      title: idea.title,
      group: idea.group,
      color: groupColors[idea.group] || '#999',
      feasibility: idea.matrixScore.feasibility || score.feasibility,
      influence: idea.matrixScore.influence || score.influence
    };
  });
  matrixData.sort((a, b) => (b.feasibility + b.influence) - (a.feasibility + a.influence));
  res.json(matrixData);
});

app.get('/api/matrix-scores', (req, res) => {
  const maxRawFeasibility = Math.max(...ideas.map(i => i.likes * 0.6 + i.comments.length * 0.4), 1);
  const maxRawInfluence = Math.max(...ideas.map(i => i.likes * 0.4 + i.comments.length * 0.6), 1);

  const scores = ideas.map(idea => {
    const rawFeasibility = idea.likes * 0.6 + idea.comments.length * 0.4;
    const rawInfluence = idea.likes * 0.4 + idea.comments.length * 0.6;
    
    const calculatedFeasibility = maxRawFeasibility > 0 
      ? Math.max(0, Math.min(100, (rawFeasibility / maxRawFeasibility) * 100))
      : 0;
    const calculatedInfluence = maxRawInfluence > 0 
      ? Math.max(0, Math.min(100, (rawInfluence / maxRawInfluence) * 100))
      : 0;
    
    const finalFeasibility = (idea.matrixScore.feasibility > 0 || idea.matrixScore.influence > 0) 
      ? idea.matrixScore.feasibility 
      : calculatedFeasibility;
    const finalInfluence = (idea.matrixScore.feasibility > 0 || idea.matrixScore.influence > 0) 
      ? idea.matrixScore.influence 
      : calculatedInfluence;

    return {
      id: idea.id,
      title: idea.title,
      likes: idea.likes,
      commentsCount: idea.comments.length,
      group: idea.group,
      color: groupColors[idea.group] || '#999',
      feasibility: Math.round(finalFeasibility),
      influence: Math.round(finalInfluence),
      totalScore: Math.round(finalFeasibility + finalInfluence)
    };
  });
  scores.sort((a, b) => b.totalScore - a.totalScore);
  res.json(scores);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
