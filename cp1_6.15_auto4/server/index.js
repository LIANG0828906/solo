import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const members = [
  { id: '1', name: '张伟', skills: [{ name: 'React', proficiency: 4 }, { name: 'TypeScript', proficiency: 5 }, { name: 'Node.js', proficiency: 3 }, { name: 'CSS', proficiency: 4 }] },
  { id: '2', name: '李娜', skills: [{ name: 'Python', proficiency: 5 }, { name: 'DataAnalysis', proficiency: 4 }, { name: 'MachineLearning', proficiency: 3 }, { name: 'SQL', proficiency: 4 }] },
  { id: '3', name: '王强', skills: [{ name: 'Java', proficiency: 5 }, { name: 'Spring', proficiency: 4 }, { name: 'MySQL', proficiency: 3 }, { name: 'Docker', proficiency: 4 }] },
  { id: '4', name: '陈雪', skills: [{ name: 'UI Design', proficiency: 5 }, { name: 'Figma', proficiency: 4 }, { name: 'CSS', proficiency: 3 }, { name: 'React', proficiency: 2 }] },
  { id: '5', name: '刘洋', skills: [{ name: 'DevOps', proficiency: 5 }, { name: 'Docker', proficiency: 4 }, { name: 'Kubernetes', proficiency: 3 }, { name: 'AWS', proficiency: 4 }, { name: 'CI/CD', proficiency: 4 }] },
  { id: '6', name: '赵敏', skills: [{ name: 'React', proficiency: 3 }, { name: 'Vue', proficiency: 5 }, { name: 'TypeScript', proficiency: 4 }, { name: 'CSS', proficiency: 3 }] },
  { id: '7', name: '孙磊', skills: [{ name: 'Python', proficiency: 4 }, { name: 'Django', proficiency: 3 }, { name: 'PostgreSQL', proficiency: 4 }, { name: 'Redis', proficiency: 3 }] },
  { id: '8', name: '周芳', skills: [{ name: 'ProductManagement', proficiency: 5 }, { name: 'Agile', proficiency: 4 }, { name: 'UX', proficiency: 3 }, { name: 'DataAnalysis', proficiency: 2 }] },
  { id: '9', name: '吴涛', skills: [{ name: 'Go', proficiency: 5 }, { name: 'Microservices', proficiency: 4 }, { name: 'gRPC', proficiency: 3 }, { name: 'Docker', proficiency: 4 }] },
  { id: '10', name: '郑丽', skills: [{ name: 'QA', proficiency: 5 }, { name: 'Selenium', proficiency: 4 }, { name: 'Jest', proficiency: 3 }, { name: 'CI/CD', proficiency: 3 }] },
];

const collaborations = [
  { memberIdA: '1', memberIdB: '4', projectCount: 5, lastDate: '2025-11-20' },
  { memberIdA: '1', memberIdB: '6', projectCount: 4, lastDate: '2025-10-15' },
  { memberIdA: '1', memberIdB: '2', projectCount: 2, lastDate: '2025-08-12' },
  { memberIdA: '2', memberIdB: '7', projectCount: 6, lastDate: '2025-12-01' },
  { memberIdA: '2', memberIdB: '8', projectCount: 3, lastDate: '2025-09-25' },
  { memberIdA: '3', memberIdB: '9', projectCount: 4, lastDate: '2025-11-05' },
  { memberIdA: '3', memberIdB: '5', projectCount: 3, lastDate: '2025-07-18' },
  { memberIdA: '5', memberIdB: '9', projectCount: 7, lastDate: '2025-12-10' },
  { memberIdA: '5', memberIdB: '10', projectCount: 2, lastDate: '2025-06-30' },
  { memberIdA: '4', memberIdB: '6', projectCount: 3, lastDate: '2025-10-08' },
  { memberIdA: '6', memberIdB: '8', projectCount: 2, lastDate: '2025-05-14' },
  { memberIdA: '7', memberIdB: '8', projectCount: 1, lastDate: '2025-04-22' },
  { memberIdA: '9', memberIdB: '10', projectCount: 2, lastDate: '2025-09-03' },
  { memberIdA: '1', memberIdB: '10', projectCount: 3, lastDate: '2025-11-28' },
  { memberIdA: '3', memberIdB: '7', projectCount: 1, lastDate: '2025-03-15' },
  { memberIdA: '2', memberIdB: '5', projectCount: 2, lastDate: '2025-08-20' },
  { memberIdA: '4', memberIdB: '8', projectCount: 4, lastDate: '2025-12-05' },
  { memberIdA: '6', memberIdB: '10', projectCount: 1, lastDate: '2025-02-10' },
  { memberIdA: '1', memberIdB: '5', projectCount: 2, lastDate: '2025-07-01' },
  { memberIdA: '3', memberIdB: '10', projectCount: 2, lastDate: '2025-06-12' },
  { memberIdA: '7', memberIdB: '9', projectCount: 3, lastDate: '2025-10-22' },
  { memberIdA: '2', memberIdB: '10', projectCount: 1, lastDate: '2025-01-18' },
  { memberIdA: '5', memberIdB: '7', projectCount: 2, lastDate: '2025-09-14' },
  { memberIdA: '1', memberIdB: '3', projectCount: 1, lastDate: '2025-04-05' },
  { memberIdA: '4', memberIdB: '10', projectCount: 2, lastDate: '2025-08-08' },
];

app.get('/api/members', (req, res) => {
  res.json(members);
});

app.post('/api/members', (req, res) => {
  const member = { id: uuidv4(), ...req.body };
  members.push(member);
  res.status(201).json(member);
});

app.put('/api/members/:id', (req, res) => {
  const idx = members.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Member not found' });
  members[idx] = { ...members[idx], ...req.body, id: members[idx].id };
  res.json(members[idx]);
});

app.delete('/api/members/:id', (req, res) => {
  const idx = members.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Member not found' });
  const deleted = members.splice(idx, 1)[0];
  res.json(deleted);
});

app.get('/api/collaborations', (req, res) => {
  res.json(collaborations);
});

app.post('/api/collaborations', (req, res) => {
  const collab = req.body;
  collaborations.push(collab);
  res.status(201).json(collab);
});

app.post('/api/recommend', (req, res) => {
  const { projectName, requiredSkills, bonusSkills } = req.body;

  const totalRequired = requiredSkills.length;
  const totalBonus = bonusSkills.length;

  const maxCollabCount = Math.max(
    1,
    ...members.map(m =>
      collaborations
        .filter(c => c.memberIdA === m.id || c.memberIdB === m.id)
        .reduce((sum, c) => sum + c.projectCount, 0)
    )
  );

  const results = members.map(member => {
    let requiredPart = 0;
    if (totalRequired > 0) {
      for (const reqSkill of requiredSkills) {
        const skill = member.skills.find(s => s.name === reqSkill);
        if (skill) {
          requiredPart += (skill.proficiency / 5) * (1 / totalRequired);
        }
      }
    }

    let bonusPart = 0;
    if (totalBonus > 0) {
      for (const bonusSkill of bonusSkills) {
        const skill = member.skills.find(s => s.name === bonusSkill);
        if (skill) {
          bonusPart += (skill.proficiency / 5) * (1 / totalBonus) * 0.3;
        }
      }
    }

    const skillOverlapScore = (requiredPart + bonusPart) * 100;

    const memberCollabCount = collaborations
      .filter(c => c.memberIdA === member.id || c.memberIdB === member.id)
      .reduce((sum, c) => sum + c.projectCount, 0);

    const collaborationScore = (memberCollabCount / maxCollabCount) * 100;

    const score = skillOverlapScore * 0.6 + collaborationScore * 0.4;

    const matchedSkills = member.skills
      .filter(s => requiredSkills.includes(s.name) || bonusSkills.includes(s.name))
      .map(s => s.name);

    return {
      member,
      score: Math.round(score * 100) / 100,
      skillOverlapScore: Math.round(skillOverlapScore * 100) / 100,
      collaborationScore: Math.round(collaborationScore * 100) / 100,
      matchedSkills,
    };
  });

  results.sort((a, b) => b.score - a.score);

  res.json({ projectName, recommendations: results });
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
