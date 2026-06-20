const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FAMILIES_FILE = path.join(__dirname, '../data/families.json');
const RECORDS_FILE = path.join(__dirname, '../data/records.json');

const readFamilies = () => {
  const data = fs.readFileSync(FAMILIES_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeFamilies = (families) => {
  fs.writeFileSync(FAMILIES_FILE, JSON.stringify(families, null, 2), 'utf-8');
};

const readRecords = () => {
  const data = fs.readFileSync(RECORDS_FILE, 'utf-8');
  return JSON.parse(data);
};

const generateShareCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const getWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

module.exports = (app) => {
  app.post('/api/families', (req, res) => {
    try {
      const { name, creatorName, creatorAvatar } = req.body;
      
      if (!name || !creatorName) {
        return res.status(400).json({ error: '家庭名称和创建者名称为必填' });
      }
      
      const families = readFamilies();
      let shareCode;
      do {
        shareCode = generateShareCode();
      } while (families.some(f => f.shareCode === shareCode));
      
      const newFamily = {
        id: uuidv4(),
        name,
        shareCode,
        createdAt: new Date().toISOString(),
        members: [
          {
            id: uuidv4(),
            name: creatorName,
            avatar: creatorAvatar || null,
            joinedAt: new Date().toISOString(),
            isCreator: true
          }
        ]
      };
      
      families.push(newFamily);
      writeFamilies(families);
      
      res.status(201).json(newFamily);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/families/join', (req, res) => {
    try {
      const { shareCode, memberName, memberAvatar } = req.body;
      
      if (!shareCode || !memberName) {
        return res.status(400).json({ error: '分享码和成员名称为必填' });
      }
      
      const families = readFamilies();
      const family = families.find(f => f.shareCode === shareCode);
      
      if (!family) {
        return res.status(404).json({ error: '家庭不存在' });
      }
      
      const existingMember = family.members.find(m => m.name === memberName);
      if (existingMember) {
        return res.status(400).json({ error: '该成员名称已存在于此家庭' });
      }
      
      const newMember = {
        id: uuidv4(),
        name: memberName,
        avatar: memberAvatar || null,
        joinedAt: new Date().toISOString(),
        isCreator: false
      };
      
      family.members.push(newMember);
      writeFamilies(families);
      
      res.json({ family, member: newMember });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/families', (req, res) => {
    try {
      const families = readFamilies();
      res.json(families);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/families/:id', (req, res) => {
    try {
      const { id } = req.params;
      const families = readFamilies();
      const family = families.find(f => f.id === id);
      
      if (!family) {
        return res.status(404).json({ error: '家庭不存在' });
      }
      
      res.json(family);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/families/:id/weekly', (req, res) => {
    try {
      const { id } = req.params;
      const families = readFamilies();
      const family = families.find(f => f.id === id);
      
      if (!family) {
        return res.status(404).json({ error: '家庭不存在' });
      }
      
      const { start, end } = getWeekRange();
      const allRecords = readRecords();
      const familyRecords = allRecords.filter(r => r.familyId === id);
      
      const weeklyRecords = familyRecords.filter(r => {
        const recordDate = new Date(r.createdAt);
        return recordDate >= start && recordDate <= end;
      });
      
      const moodStats = {};
      weeklyRecords.forEach(r => {
        if (r.mood) {
          moodStats[r.mood] = (moodStats[r.mood] || 0) + 1;
        }
      });
      
      const memberStats = {};
      family.members.forEach(m => {
        memberStats[m.id] = {
          member: m,
          recordCount: 0
        };
      });
      
      weeklyRecords.forEach(r => {
        if (memberStats[r.memberId]) {
          memberStats[r.memberId].recordCount++;
        }
      });
      
      res.json({
        weekStart: start.toISOString(),
        weekEnd: end.toISOString(),
        totalRecords: weeklyRecords.length,
        records: weeklyRecords,
        moodStats,
        memberStats: Object.values(memberStats)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/families/:id/random', (req, res) => {
    try {
      const { id } = req.params;
      const families = readFamilies();
      const family = families.find(f => f.id === id);
      
      if (!family) {
        return res.status(404).json({ error: '家庭不存在' });
      }
      
      const allRecords = readRecords();
      const familyRecords = allRecords.filter(r => r.familyId === id);
      
      if (familyRecords.length === 0) {
        return res.status(404).json({ error: '暂无记录' });
      }
      
      const randomIndex = Math.floor(Math.random() * familyRecords.length);
      const randomRecord = familyRecords[randomIndex];
      
      const member = family.members.find(m => m.id === randomRecord.memberId);
      randomRecord.member = member || null;
      
      res.json(randomRecord);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
