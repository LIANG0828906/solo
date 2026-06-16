import { v4 as uuidv4 } from 'uuid';
import type { User, ClassItem, Task, Review, GroupScore } from '../types';

const now = new Date();

export const mockUsers: User[] = [
  { id: 'user-1', name: '张老师', role: 'teacher', lastActive: now.toISOString() },
  { id: 'user-2', name: '李小明', role: 'student', lastActive: now.toISOString() },
  { id: 'user-3', name: '王小红', role: 'student', lastActive: new Date(now.getTime() - 3 * 60 * 1000).toISOString() },
  { id: 'user-4', name: '赵小刚', role: 'student', lastActive: new Date(now.getTime() - 30 * 60 * 1000).toISOString() },
  { id: 'user-5', name: '陈小芳', role: 'student', lastActive: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'user-6', name: '刘小华', role: 'student', lastActive: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'user-7', name: '杨小强', role: 'student', lastActive: new Date(now.getTime() - 10 * 60 * 1000).toISOString() },
  { id: 'user-8', name: '周小美', role: 'student', lastActive: new Date(now.getTime() - 5 * 60 * 1000).toISOString() },
];

export const mockClasses: ClassItem[] = [
  {
    id: 'class-1',
    name: '软件工程2024春',
    createdAt: '2024-03-01',
    creatorId: 'user-1',
    memberCount: 7,
    members: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7'],
  },
  {
    id: 'class-2',
    name: '人机交互设计',
    createdAt: '2024-02-15',
    creatorId: 'user-1',
    memberCount: 5,
    members: ['user-1', 'user-2', 'user-3', 'user-5', 'user-8'],
  },
  {
    id: 'class-3',
    name: '数据结构与算法',
    createdAt: '2024-01-20',
    creatorId: 'user-1',
    memberCount: 6,
    members: ['user-1', 'user-2', 'user-4', 'user-6', 'user-7', 'user-8'],
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    classId: 'class-1',
    name: '小组项目：需求分析文档',
    description: '**项目要求：**\n- 完成一份完整的需求分析文档\n- 包含用例图和活动图\n- 字数不少于3000字\n\n**提交格式：** PDF文档',
    deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in-progress',
    groupingMethod: 'random',
    groups: [
      {
        id: 'group-1',
        taskId: 'task-1',
        name: '第一组',
        memberIds: ['user-2', 'user-3', 'user-4'],
        leaderId: 'user-2',
        reviews: [],
      },
      {
        id: 'group-2',
        taskId: 'task-1',
        name: '第二组',
        memberIds: ['user-5', 'user-6', 'user-7'],
        leaderId: 'user-5',
        submission: {
          id: 'sub-2',
          groupId: 'group-2',
          submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          files: [
            { id: 'file-1', name: '需求分析文档.pdf', type: 'pdf', size: 2048000, pageCount: 15 },
          ],
        },
        reviews: [],
      },
    ],
  },
  {
    id: 'task-2',
    classId: 'class-1',
    name: '系统设计报告',
    description: '**设计内容：**\n- 系统架构设计\n- 数据库设计\n- 接口设计',
    deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    groupingMethod: 'manual',
    groups: [],
  },
  {
    id: 'task-3',
    classId: 'class-1',
    name: '期中项目展示',
    description: '**展示要求：**\n- PPT演示\n- 代码演示\n- 15分钟展示+5分钟问答',
    deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'reviewing',
    groupingMethod: 'random',
    groups: [
      {
        id: 'group-a',
        taskId: 'task-3',
        name: '第一组',
        memberIds: ['user-2', 'user-3'],
        leaderId: 'user-2',
        submission: {
          id: 'sub-a',
          groupId: 'group-a',
          submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          files: [
            { id: 'file-a1', name: '项目展示PPT.pdf', type: 'pdf', size: 5120000, pageCount: 25 },
            { id: 'file-a2', name: '演示截图.png', type: 'image', size: 512000 },
          ],
        },
        reviews: [
          {
            id: 'review-1',
            taskId: 'task-3',
            reviewerGroupId: 'group-b',
            revieweeGroupId: 'group-a',
            completeness: 4,
            creativity: 5,
            collaboration: 4,
            comment: '项目完成度很高，创意性很强，整体协作表现不错。',
            completed: true,
          },
          {
            id: 'review-2',
            taskId: 'task-3',
            reviewerGroupId: 'group-c',
            revieweeGroupId: 'group-a',
            completeness: 5,
            creativity: 4,
            collaboration: 5,
            comment: '界面设计精美，功能完整，团队协作默契。',
            completed: true,
          },
        ],
      },
      {
        id: 'group-b',
        taskId: 'task-3',
        name: '第二组',
        memberIds: ['user-4', 'user-5'],
        leaderId: 'user-4',
        submission: {
          id: 'sub-b',
          groupId: 'group-b',
          submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          files: [
            { id: 'file-b1', name: '项目报告.docx', type: 'document', size: 1024000 },
          ],
        },
        reviews: [
          {
            id: 'review-3',
            taskId: 'task-3',
            reviewerGroupId: 'group-a',
            revieweeGroupId: 'group-b',
            completeness: 3,
            creativity: 4,
            collaboration: 3,
            comment: '基本功能完成，但还有改进空间。',
            completed: true,
          },
        ],
      },
      {
        id: 'group-c',
        taskId: 'task-3',
        name: '第三组',
        memberIds: ['user-6', 'user-7'],
        leaderId: 'user-6',
        submission: {
          id: 'sub-c',
          groupId: 'group-c',
          submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          files: [
            { id: 'file-c1', name: '设计稿.jpg', type: 'image', size: 2048000 },
          ],
        },
        reviews: [],
      },
    ],
  },
  {
    id: 'task-4',
    classId: 'class-1',
    name: '期末项目答辩',
    description: '**答辩要求：**\n- 完整项目演示\n- 技术架构讲解\n- 团队分工说明',
    deadline: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    groupingMethod: 'random',
    groups: [
      {
        id: 'fg-1',
        taskId: 'task-4',
        name: '第一组',
        memberIds: ['user-2', 'user-3'],
        leaderId: 'user-2',
        submission: {
          id: 'fsub-1',
          groupId: 'fg-1',
          submittedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
          files: [
            { id: 'ffile-1', name: '项目报告.pdf', type: 'pdf', size: 3072000, pageCount: 30 },
          ],
        },
        reviews: [
          { id: 'fr1', taskId: 'task-4', reviewerGroupId: 'fg-2', revieweeGroupId: 'fg-1', completeness: 5, creativity: 4, collaboration: 5, comment: '非常优秀的项目，完成度很高，团队协作默契。', completed: true },
          { id: 'fr2', taskId: 'task-4', reviewerGroupId: 'fg-3', revieweeGroupId: 'fg-1', completeness: 4, creativity: 5, collaboration: 4, comment: '创意十足，技术实现很好。', completed: true },
        ],
      },
      {
        id: 'fg-2',
        taskId: 'task-4',
        name: '第二组',
        memberIds: ['user-4', 'user-5'],
        leaderId: 'user-4',
        submission: {
          id: 'fsub-2',
          groupId: 'fg-2',
          submittedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
          files: [
            { id: 'ffile-2', name: '设计文档.pdf', type: 'pdf', size: 2048000, pageCount: 20 },
          ],
        },
        reviews: [
          { id: 'fr3', taskId: 'task-4', reviewerGroupId: 'fg-1', revieweeGroupId: 'fg-2', completeness: 3, creativity: 4, collaboration: 3, comment: '整体还可以，但细节有待完善。', completed: true },
          { id: 'fr4', taskId: 'task-4', reviewerGroupId: 'fg-3', revieweeGroupId: 'fg-2', completeness: 4, creativity: 3, collaboration: 4, comment: '设计不错，功能基本完成。', completed: true },
        ],
      },
      {
        id: 'fg-3',
        taskId: 'task-4',
        name: '第三组',
        memberIds: ['user-6', 'user-7'],
        leaderId: 'user-6',
        submission: {
          id: 'fsub-3',
          groupId: 'fg-3',
          submittedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
          files: [
            { id: 'ffile-3', name: '项目源码.zip', type: 'document', size: 5120000 },
          ],
        },
        reviews: [
          { id: 'fr5', taskId: 'task-4', reviewerGroupId: 'fg-1', revieweeGroupId: 'fg-3', completeness: 5, creativity: 5, collaboration: 5, comment: '完美的项目，各方面都很出色！', completed: true },
          { id: 'fr6', taskId: 'task-4', reviewerGroupId: 'fg-2', revieweeGroupId: 'fg-3', completeness: 4, creativity: 5, collaboration: 4, comment: '创意非常棒，实现也很到位。', completed: true },
        ],
      },
    ],
  },
];

export function generateId(): string {
  return uuidv4();
}

export function calculateGroupScores(task: Task): GroupScore[] {
  return task.groups.map((group) => {
    const completedReviews = group.reviews.filter((r) => r.completed);
    if (completedReviews.length === 0) {
      return {
        groupId: group.id,
        groupName: group.name,
        avgCompleteness: 0,
        avgCreativity: 0,
        avgCollaboration: 0,
        avgTotal: 0,
        comments: [],
      };
    }

    const totalCompleteness = completedReviews.reduce((sum, r) => sum + r.completeness, 0);
    const totalCreativity = completedReviews.reduce((sum, r) => sum + r.creativity, 0);
    const totalCollaboration = completedReviews.reduce((sum, r) => sum + r.collaboration, 0);
    const count = completedReviews.length;

    const avgCompleteness = totalCompleteness / count;
    const avgCreativity = totalCreativity / count;
    const avgCollaboration = totalCollaboration / count;
    const avgTotal = (avgCompleteness + avgCreativity + avgCollaboration) / 3;

    return {
      groupId: group.id,
      groupName: group.name,
      avgCompleteness: Math.round(avgCompleteness * 10) / 10,
      avgCreativity: Math.round(avgCreativity * 10) / 10,
      avgCollaboration: Math.round(avgCollaboration * 10) / 10,
      avgTotal: Math.round(avgTotal * 10) / 10,
      comments: completedReviews.map((r) => r.comment),
    };
  });
}

export function getPendingReviews(task: Task, userGroupId: string): Review[] {
  const allReviews: Review[] = [];
  task.groups.forEach((group) => {
    group.reviews.forEach((review) => {
      if (review.reviewerGroupId === userGroupId && !review.completed) {
        allReviews.push(review);
      }
    });
  });
  return allReviews;
}

export function getCurrentUserGroup(task: Task, userId: string): string | null {
  for (const group of task.groups) {
    if (group.memberIds.includes(userId)) {
      return group.id;
    }
  }
  return null;
}
