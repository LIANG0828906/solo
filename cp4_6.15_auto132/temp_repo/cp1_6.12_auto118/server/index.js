const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const {
  COLORS,
  USERS,
  CURRENT_USER,
  getStories,
  getStoryById,
  addStory,
  updateStory
} = require('./data');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/user', (req, res) => {
  res.json(CURRENT_USER);
});

app.get('/api/stories', (req, res) => {
  const stories = getStories().map(s => ({
    id: s.id,
    title: s.title,
    summary: s.summary,
    coverColor: s.coverColor,
    paragraphCount: s.paragraphs.length,
    participantCount: s.participants.length,
    updatedAt: s.updatedAt
  }));
  res.json(stories);
});

app.get('/api/stories/:id', (req, res) => {
  const story = getStoryById(req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  res.json(story);
});

app.post('/api/stories', (req, res) => {
  const { title, summary, coverColor, initialContent } = req.body;

  if (!title || !summary) {
    return res.status(400).json({ error: 'Title and summary are required' });
  }

  const color = coverColor || COLORS[Math.floor(Math.random() * COLORS.length)];

  const firstParagraph = {
    id: uuidv4(),
    storyId: null,
    authorId: CURRENT_USER.id,
    authorNickname: CURRENT_USER.nickname,
    authorAvatar: CURRENT_USER.avatar,
    content: initialContent || '在很久很久以前...',
    index: 1,
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: Date.now()
  };

  const newStory = {
    id: uuidv4(),
    title,
    summary,
    coverColor: color,
    paragraphs: [firstParagraph],
    participants: [CURRENT_USER],
    contributorIds: [CURRENT_USER.id],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  firstParagraph.storyId = newStory.id;
  firstParagraph.id = uuidv4();

  const created = addStory(newStory);
  res.status(201).json(created);
});

app.post('/api/stories/:id/paragraphs', (req, res) => {
  const story = getStoryById(req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  const { content } = req.body;
  if (!content || content.length > 500) {
    return res.status(400).json({ error: 'Content is required and must be less than 500 characters' });
  }

  if (story.contributorIds.includes(CURRENT_USER.id)) {
    return res.status(400).json({ error: 'You have already contributed to this story' });
  }

  const newParagraph = {
    id: uuidv4(),
    storyId: story.id,
    authorId: CURRENT_USER.id,
    authorNickname: CURRENT_USER.nickname,
    authorAvatar: CURRENT_USER.avatar,
    content,
    index: story.paragraphs.length + 1,
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: Date.now()
  };

  const updatedParticipants = story.contributorIds.includes(CURRENT_USER.id)
    ? story.participants
    : [...story.participants, CURRENT_USER];

  const updated = updateStory(story.id, {
    paragraphs: [newParagraph, ...story.paragraphs],
    participants: updatedParticipants,
    contributorIds: [...story.contributorIds, CURRENT_USER.id]
  });

  res.json(newParagraph);
});

app.post('/api/paragraphs/:id/like', (req, res) => {
  const story = getStories().find(s =>
    s.paragraphs.some(p => p.id === req.params.id)
  );

  if (!story) {
    return res.status(404).json({ error: 'Paragraph not found' });
  }

  const paragraph = story.paragraphs.find(p => p.id === req.params.id);
  const likedIndex = paragraph.likedBy.indexOf(CURRENT_USER.id);

  if (likedIndex === -1) {
    paragraph.likedBy.push(CURRENT_USER.id);
    paragraph.likes += 1;
  } else {
    paragraph.likedBy.splice(likedIndex, 1);
    paragraph.likes -= 1;
  }

  updateStory(story.id, { paragraphs: story.paragraphs });
  res.json({ likes: paragraph.likes, liked: likedIndex === -1 });
});

app.post('/api/paragraphs/:id/comments', (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  const story = getStories().find(s =>
    s.paragraphs.some(p => p.id === req.params.id)
  );

  if (!story) {
    return res.status(404).json({ error: 'Paragraph not found' });
  }

  const paragraph = story.paragraphs.find(p => p.id === req.params.id);
  const newComment = {
    id: uuidv4(),
    paragraphId: paragraph.id,
    userId: CURRENT_USER.id,
    userNickname: CURRENT_USER.nickname,
    userAvatar: CURRENT_USER.avatar,
    content,
    createdAt: Date.now()
  };

  paragraph.comments.push(newComment);
  updateStory(story.id, { paragraphs: story.paragraphs });
  res.status(201).json(newComment);
});

app.get('/api/colors', (req, res) => {
  res.json(COLORS);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
