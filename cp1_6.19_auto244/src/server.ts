import express, { Request, Response } from 'express';
import cors from 'cors';
import { calculateRelation, Member } from './utils/relationCalculator.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface MemberInput {
  name: string;
  gender: '男' | '女';
  birthDate: string;
  spouseId?: string | null;
  parentIds?: string[];
}

let members: Member[] = [
  { id: 'g1', name: '张大山', gender: '男', birthDate: '1945-03-15', spouseId: 'g2', parentIds: [] },
  { id: 'g2', name: '李秀兰', gender: '女', birthDate: '1948-07-22', spouseId: 'g1', parentIds: [] },
  { id: 'g3', name: '王建国', gender: '男', birthDate: '1947-01-10', spouseId: 'g4', parentIds: [] },
  { id: 'g4', name: '赵美华', gender: '女', birthDate: '1950-09-05', spouseId: 'g3', parentIds: [] },
  { id: 'p1', name: '张志强', gender: '男', birthDate: '1972-05-18', spouseId: 'p2', parentIds: ['g1', 'g2'] },
  { id: 'p2', name: '王丽娟', gender: '女', birthDate: '1975-11-30', spouseId: 'p1', parentIds: ['g3', 'g4'] },
  { id: 'p3', name: '张志刚', gender: '男', birthDate: '1978-08-12', spouseId: 'p4', parentIds: ['g1', 'g2'] },
  { id: 'p4', name: '刘芳', gender: '女', birthDate: '1980-04-25', spouseId: 'p3', parentIds: [] },
  { id: 'p5', name: '张志梅', gender: '女', birthDate: '1982-12-08', spouseId: null, parentIds: ['g1', 'g2'] },
  { id: 'p6', name: '王丽华', gender: '女', birthDate: '1977-06-14', spouseId: null, parentIds: ['g3', 'g4'] },
  { id: 'c1', name: '张明宇', gender: '男', birthDate: '2000-02-20', spouseId: null, parentIds: ['p1', 'p2'] },
  { id: 'c2', name: '张明月', gender: '女', birthDate: '2003-10-15', spouseId: null, parentIds: ['p1', 'p2'] },
  { id: 'c3', name: '张明轩', gender: '男', birthDate: '2006-07-01', spouseId: null, parentIds: ['p1', 'p2'] },
  { id: 'c4', name: '张浩宇', gender: '男', birthDate: '2005-03-28', spouseId: null, parentIds: ['p3', 'p4'] },
  { id: 'c5', name: '张思琪', gender: '女', birthDate: '2008-12-12', spouseId: null, parentIds: ['p3', 'p4'] },
  { id: 'c6', name: '李一诺', gender: '女', birthDate: '2010-05-05', spouseId: null, parentIds: [] }
];

function generateId(): string {
  return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

function isValidBirthDate(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

function validateMemberInput(input: MemberInput, isUpdate: boolean = false): string[] {
  const errors: string[] = [];

  if (!isUpdate || input.name !== undefined) {
    if (!input.name || typeof input.name !== 'string') {
      errors.push('name 是必填字段');
    } else if (input.name.length < 2 || input.name.length > 20) {
      errors.push('name 长度必须在 2-20 字符之间');
    }
  }

  if (!isUpdate || input.gender !== undefined) {
    if (!input.gender || (input.gender !== '男' && input.gender !== '女')) {
      errors.push('gender 是必填字段，必须为 "男" 或 "女"');
    }
  }

  if (!isUpdate || input.birthDate !== undefined) {
    if (!input.birthDate || typeof input.birthDate !== 'string') {
      errors.push('birthDate 是必填字段');
    } else if (!isValidBirthDate(input.birthDate)) {
      errors.push('birthDate 格式必须为 YYYY-MM-DD');
    }
  }

  if (input.parentIds !== undefined) {
    if (!Array.isArray(input.parentIds)) {
      errors.push('parentIds 必须是数组');
    } else if (input.parentIds.length > 2) {
      errors.push('parentIds 最多只能有 2 个');
    } else {
      for (const pid of input.parentIds) {
        if (!members.find(m => m.id === pid)) {
          errors.push(`父/母 ID ${pid} 不存在`);
        }
      }
    }
  }

  if (input.spouseId !== undefined && input.spouseId !== null) {
    if (!members.find(m => m.id === input.spouseId)) {
      errors.push(`配偶 ID ${input.spouseId} 不存在`);
    }
  }

  return errors;
}

function updateBidirectionalRelations(memberId: string, newData: Partial<MemberInput>) {
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  if (newData.spouseId !== undefined) {
    if (member.spouseId && member.spouseId !== newData.spouseId) {
      const oldSpouse = members.find(m => m.id === member.spouseId);
      if (oldSpouse) {
        oldSpouse.spouseId = null;
      }
    }
    if (newData.spouseId) {
      const newSpouse = members.find(m => m.id === newData.spouseId);
      if (newSpouse) {
        if (newSpouse.spouseId && newSpouse.spouseId !== memberId) {
          const prevSpouse = members.find(m => m.id === newSpouse.spouseId);
          if (prevSpouse) {
            prevSpouse.spouseId = null;
          }
        }
        newSpouse.spouseId = memberId;
      }
    }
  }
}

function cleanRelationsOnDelete(memberId: string) {
  for (const m of members) {
    if (m.spouseId === memberId) {
      m.spouseId = null;
    }
    m.parentIds = m.parentIds.filter(pid => pid !== memberId);
  }
}

app.get('/api/members', (req: Request, res: Response) => {
  res.json(members);
});

app.get('/api/members/:id', (req: Request, res: Response) => {
  const member = members.find(m => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ error: '成员不存在' });
  }
  res.json(member);
});

app.post('/api/members', (req: Request, res: Response) => {
  const input: MemberInput = req.body;
  const errors = validateMemberInput(input);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const newMember: Member = {
    id: generateId(),
    name: input.name,
    gender: input.gender,
    birthDate: input.birthDate,
    spouseId: input.spouseId ?? null,
    parentIds: input.parentIds ?? []
  };

  members.push(newMember);
  updateBidirectionalRelations(newMember.id, input);

  res.status(201).json(newMember);
});

app.put('/api/members/:id', (req: Request, res: Response) => {
  const idx = members.findIndex(m => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '成员不存在' });
  }

  const input: Partial<MemberInput> = req.body;
  const errors = validateMemberInput(input as MemberInput, true);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const member = members[idx];
  const updated = { ...member, ...input };

  if (input.parentIds !== undefined) {
    updated.parentIds = input.parentIds;
  }

  members[idx] = updated;
  updateBidirectionalRelations(req.params.id, input);

  res.json(members[idx]);
});

app.delete('/api/members/:id', (req: Request, res: Response) => {
  const idx = members.findIndex(m => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: '成员不存在' });
  }

  cleanRelationsOnDelete(req.params.id);
  members.splice(idx, 1);

  res.json({ message: '删除成功' });
});

app.post('/api/relation', (req: Request, res: Response) => {
  const { memberId1, memberId2 } = req.body;
  if (!memberId1 || !memberId2) {
    return res.status(400).json({ error: 'memberId1 和 memberId2 都是必填字段' });
  }

  const relation = calculateRelation(members, memberId1, memberId2);
  res.json({ relation });
});

app.post('/api/import', (req: Request, res: Response) => {
  const inputMembers = req.body;
  if (!Array.isArray(inputMembers)) {
    return res.status(400).json({ error: '导入数据必须是数组' });
  }

  const errors: string[] = [];
  const tempIds: Map<string, string> = new Map();
  const tempMembers: Member[] = [];

  for (let i = 0; i < inputMembers.length; i++) {
    const input = inputMembers[i];
    const inputErrors: string[] = [];

    if (!input.id || typeof input.id !== 'string') {
      inputErrors.push('缺少 id 字段');
    }
    if (!input.name || typeof input.name !== 'string') {
      inputErrors.push('缺少 name 字段');
    } else if (input.name.length < 2 || input.name.length > 20) {
      inputErrors.push('name 长度必须在 2-20 字符之间');
    }
    if (!input.gender || (input.gender !== '男' && input.gender !== '女')) {
      inputErrors.push('缺少或无效的 gender 字段');
    }
    if (!input.birthDate || typeof input.birthDate !== 'string') {
      inputErrors.push('缺少 birthDate 字段');
    } else if (!isValidBirthDate(input.birthDate)) {
      inputErrors.push('birthDate 格式必须为 YYYY-MM-DD');
    }
    if (input.parentIds !== undefined && !Array.isArray(input.parentIds)) {
      inputErrors.push('parentIds 必须是数组');
    }
    if (input.parentIds && input.parentIds.length > 2) {
      inputErrors.push('parentIds 最多只能有 2 个');
    }

    if (inputErrors.length > 0) {
      errors.push(`第 ${i + 1} 个成员 (${input.id || 'unknown'}): ${inputErrors.join('; ')}`);
    } else {
      const newId = generateId();
      tempIds.set(input.id, newId);
      tempMembers.push({
        id: newId,
        name: input.name,
        gender: input.gender,
        birthDate: input.birthDate,
        spouseId: input.spouseId ?? null,
        parentIds: (input.parentIds ?? []).slice()
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  for (const m of tempMembers) {
    if (m.spouseId) {
      const mappedId = tempIds.get(m.spouseId);
      if (mappedId) {
        m.spouseId = mappedId;
      } else {
        errors.push(`成员 ${m.name} 的配偶 ID ${m.spouseId} 不存在于导入数据中`);
      }
    }
    const mappedParentIds: string[] = [];
    for (const pid of m.parentIds) {
      const mappedId = tempIds.get(pid);
      if (mappedId) {
        mappedParentIds.push(mappedId);
      } else {
        errors.push(`成员 ${m.name} 的父/母 ID ${pid} 不存在于导入数据中`);
      }
    }
    m.parentIds = mappedParentIds;
  }

  const spouseErrors = new Set<string>();
  for (const m of tempMembers) {
    if (m.spouseId) {
      const spouse = tempMembers.find(s => s.id === m.spouseId);
      if (spouse && spouse.spouseId !== m.id) {
        spouseErrors.add(`成员 ${m.name} 与 ${spouse.name} 的配偶关系不一致`);
      }
    }
  }
  spouseErrors.forEach(e => errors.push(e));

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  members = tempMembers;
  res.json({ success: true, count: members.length });
});

app.get('/api/export', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(members);
});

app.listen(PORT, () => {
  console.log('Family Tree Server running on port 3001');
});
