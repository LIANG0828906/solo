const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const RECORDS_FILE = path.join(__dirname, '../data/records.json');
const FAMILIES_FILE = path.join(__dirname, '../data/families.json');

const readRecords = () => {
  const data = fs.readFileSync(RECORDS_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeRecords = (records) => {
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf-8');
};

const readFamilies = () => {
  const data = fs.readFileSync(FAMILIES_FILE, 'utf-8');
  return JSON.parse(data);
};

module.exports = (app) => {
  app.get('/api/families/:id/records', (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const families = readFamilies();
      const family = families.find(f => f.id === id);
      
      if (!family) {
        return res.status(404).json({ error: '家庭不存在' });
      }
      
      const allRecords = readRecords();
      let familyRecords = allRecords.filter(r => r.familyId === id);
      
      familyRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      familyRecords = familyRecords.map(record => {
        const member = family.members.find(m => m.id === record.memberId);
        return { ...record, member: member || null };
      });
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRecords = familyRecords.slice(startIndex, endIndex);
      
      res.json({
        data: paginatedRecords,
        total: familyRecords.length,
        page,
        limit,
        totalPages: Math.ceil(familyRecords.length / limit)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/families/:id/records', app.upload.single('image'), app.compressImage, (req, res) => {
    try {
      const { id } = req.params;
      const { content, mood, memberId } = req.body;
      
      if (!content || !memberId) {
        return res.status(400).json({ error: '内容和成员ID为必填' });
      }
      
      const families = readFamilies();
      const family = families.find(f => f.id === id);
      
      if (!family) {
        return res.status(404).json({ error: '家庭不存在' });
      }
      
      const member = family.members.find(m => m.id === memberId);
      if (!member) {
        return res.status(404).json({ error: '成员不存在' });
      }
      
      let imageUrl = null;
      if (req.file) {
        imageUrl = `/images/${req.file.filename}`;
      }
      
      const allRecords = readRecords();
      const newRecord = {
        id: uuidv4(),
        familyId: id,
        memberId,
        content,
        mood: mood || null,
        imageUrl,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
      };
      
      allRecords.push(newRecord);
      writeRecords(allRecords);
      
      newRecord.member = member;
      res.status(201).json(newRecord);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/records/:id/like', (req, res) => {
    try {
      const { id } = req.params;
      const { memberId } = req.body;
      
      if (!memberId) {
        return res.status(400).json({ error: '成员ID为必填' });
      }
      
      const allRecords = readRecords();
      const recordIndex = allRecords.findIndex(r => r.id === id);
      
      if (recordIndex === -1) {
        return res.status(404).json({ error: '记录不存在' });
      }
      
      const record = allRecords[recordIndex];
      const likeIndex = record.likes.indexOf(memberId);
      
      if (likeIndex > -1) {
        record.likes.splice(likeIndex, 1);
      } else {
        record.likes.push(memberId);
      }
      
      allRecords[recordIndex] = record;
      writeRecords(allRecords);
      
      res.json({
        id: record.id,
        likes: record.likes,
        liked: likeIndex === -1
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/records/:id/comments', (req, res) => {
    try {
      const { id } = req.params;
      const { memberId, content } = req.body;
      
      if (!memberId || !content) {
        return res.status(400).json({ error: '成员ID和评论内容为必填' });
      }
      
      const allRecords = readRecords();
      const recordIndex = allRecords.findIndex(r => r.id === id);
      
      if (recordIndex === -1) {
        return res.status(404).json({ error: '记录不存在' });
      }
      
      const families = readFamilies();
      const record = allRecords[recordIndex];
      const family = families.find(f => f.id === record.familyId);
      const member = family ? family.members.find(m => m.id === memberId) : null;
      
      if (!member) {
        return res.status(404).json({ error: '成员不存在' });
      }
      
      const newComment = {
        id: uuidv4(),
        memberId,
        memberName: member.name,
        memberAvatar: member.avatar,
        content,
        createdAt: new Date().toISOString()
      };
      
      record.comments.push(newComment);
      allRecords[recordIndex] = record;
      writeRecords(allRecords);
      
      res.status(201).json(newComment);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
