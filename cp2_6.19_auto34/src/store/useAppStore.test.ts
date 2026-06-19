import { describe, it, expect, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Sprint, BurndownPoint } from '@/types';
import {
  getTaskAssigneeAtDate,
  formatDateKey,
  generateTasksHash,
  getCacheKey,
} from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: uuidv4(),
  title: 'Test Task',
  description: 'Test Description',
  priority: 'medium',
  status: 'todo',
  assignee: null,
  estimate: 8,
  sprintId: null,
  createdAt: new Date('2024-01-01').toISOString(),
  assignmentHistory: [
    { assignee: null, date: new Date('2024-01-01').toISOString() },
  ],
  ...overrides,
});

const createMockSprint = (overrides: Partial<Sprint> = {}): Sprint => ({
  id: uuidv4(),
  name: 'Sprint 1',
  startDate: '2024-01-01',
  endDate: '2024-01-14',
  teamMembers: [],
  ...overrides,
});

describe('getTaskAssigneeAtDate', () => {
  it('should return the initial assignee when no history entries after target date', () => {
    const task = createMockTask({
      assignmentHistory: [
        { assignee: 'member-1', date: new Date('2024-01-01').toISOString() },
      ],
    });

    const result = getTaskAssigneeAtDate(task, new Date('2024-01-05'));
    expect(result).toBe('member-1');
  });

  it('should return the correct assignee based on history at specific date', () => {
    const task = createMockTask({
      assignmentHistory: [
        { assignee: 'member-1', date: new Date('2024-01-01').toISOString() },
        { assignee: 'member-2', date: new Date('2024-01-05').toISOString() },
        { assignee: 'member-3', date: new Date('2024-01-10').toISOString() },
      ],
    });

    expect(getTaskAssigneeAtDate(task, new Date('2024-01-03'))).toBe('member-1');
    expect(getTaskAssigneeAtDate(task, new Date('2024-01-05'))).toBe('member-2');
    expect(getTaskAssigneeAtDate(task, new Date('2024-01-07'))).toBe('member-2');
    expect(getTaskAssigneeAtDate(task, new Date('2024-01-10'))).toBe('member-3');
    expect(getTaskAssigneeAtDate(task, new Date('2024-01-12'))).toBe('member-3');
  });

  it('should handle null assignee in history', () => {
    const task = createMockTask({
      assignmentHistory: [
        { assignee: null, date: new Date('2024-01-01').toISOString() },
        { assignee: 'member-1', date: new Date('2024-01-05').toISOString() },
      ],
    });

    expect(getTaskAssigneeAtDate(task, new Date('2024-01-03'))).toBe(null);
    expect(getTaskAssigneeAtDate(task, new Date('2024-01-06'))).toBe('member-1');
  });
});

describe('formatDateKey', () => {
  it('should format date to YYYY-MM-DD', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDateKey(date)).toBe('2024-01-15');
  });
});

describe('generateTasksHash', () => {
  it('should generate consistent hash for same tasks', () => {
    const task1 = createMockTask({ id: 'task-1', assignee: 'member-1' });
    const task2 = createMockTask({ id: 'task-2', assignee: 'member-2' });

    const hash1 = generateTasksHash([task1, task2]);
    const hash2 = generateTasksHash([task1, task2]);

    expect(hash1).toBe(hash2);
  });

  it('should generate different hash when tasks change', () => {
    const task = createMockTask({ id: 'task-1', status: 'todo' });
    const hash1 = generateTasksHash([task]);

    const updatedTask = { ...task, status: 'done' as const };
    const hash2 = generateTasksHash([updatedTask]);

    expect(hash1).not.toBe(hash2);
  });
});

describe('getCacheKey', () => {
  it('should generate key with all parameter', () => {
    expect(getCacheKey('sprint-1', null)).toBe('sprint-1-all');
    expect(getCacheKey('sprint-1', 'member-1')).toBe('sprint-1-member-1');
  });
});

describe('useAppStore - getBurndownData', () => {
  const member1Id = 'member-1';
  const member2Id = 'member-2';
  let sprintId: string;

  beforeEach(() => {
    const state = useAppStore.getState();
    state.tasks = [];
    state.sprints = [];

    const sprint = createMockSprint({
      startDate: '2024-01-01',
      endDate: '2024-01-03',
      teamMembers: [member1Id, member2Id],
    });
    sprintId = sprint.id;
    state.sprints = [sprint];
    state.currentSprintId = sprintId;
  });

  it('should return empty array for invalid sprintId', () => {
    const state = useAppStore.getState();
    const result = state.getBurndownData('invalid-sprint');
    expect(result).toEqual([]);
  });

  it('should calculate overall burndown data correctly without member filter', () => {
    const state = useAppStore.getState();

    state.tasks = [
      createMockTask({
        id: 'task-1',
        sprintId,
        estimate: 8,
        status: 'done',
        assignee: member1Id,
        assignmentHistory: [
          { assignee: member1Id, date: new Date('2024-01-01').toISOString() },
        ],
      }),
      createMockTask({
        id: 'task-2',
        sprintId,
        estimate: 4,
        status: 'todo',
        assignee: member2Id,
        assignmentHistory: [
          { assignee: member2Id, date: new Date('2024-01-01').toISOString() },
        ],
      }),
    ];

    const result = state.getBurndownData(sprintId);

    expect(result).toHaveLength(3);

    const totalEstimate = 12;
    expect(result[0].ideal).toBeCloseTo(totalEstimate);
    expect(result[2].ideal).toBeCloseTo(0);

    const doneEstimate = 8;
    const expectedActual = totalEstimate - doneEstimate;
    expect(result[0].actual).toBeCloseTo(expectedActual);
    expect(result[1].actual).toBeCloseTo(expectedActual);
    expect(result[2].actual).toBeCloseTo(expectedActual);
  });

  it('should filter burndown data by assigneeId', () => {
    const state = useAppStore.getState();

    state.tasks = [
      createMockTask({
        id: 'task-1',
        sprintId,
        estimate: 8,
        status: 'in-progress',
        assignee: member1Id,
        assignmentHistory: [
          { assignee: member1Id, date: new Date('2024-01-01').toISOString() },
        ],
      }),
      createMockTask({
        id: 'task-2',
        sprintId,
        estimate: 4,
        status: 'done',
        assignee: member2Id,
        assignmentHistory: [
          { assignee: member2Id, date: new Date('2024-01-01').toISOString() },
        ],
      }),
    ];

    const member1Data = state.getBurndownData(sprintId, member1Id);

    expect(member1Data).toHaveLength(3);
    expect(member1Data[0].ideal).toBeCloseTo(8);
    expect(member1Data[0].actual).toBeCloseTo(8);

    const member2Data = state.getBurndownData(sprintId, member2Id);
    expect(member2Data[0].ideal).toBeCloseTo(4);
    expect(member2Data[0].actual).toBeCloseTo(0);

    const allData = state.getBurndownData(sprintId, null);
    expect(allData[0].ideal).toBeCloseTo(12);
  });

  it('should handle task reassignment history correctly', () => {
    const state = useAppStore.getState();

    state.tasks = [
      createMockTask({
        id: 'task-1',
        sprintId,
        estimate: 8,
        status: 'todo',
        assignee: member2Id,
        assignmentHistory: [
          { assignee: member1Id, date: new Date('2024-01-01').toISOString() },
          { assignee: member2Id, date: new Date('2024-01-02').toISOString() },
        ],
      }),
    ];

    const member1Data = state.getBurndownData(sprintId, member1Id);
    expect(member1Data[0].ideal).toBeCloseTo(8);
    expect(member1Data[1].ideal).toBeCloseTo(0);
    expect(member1Data[2].ideal).toBeCloseTo(0);

    const member2Data = state.getBurndownData(sprintId, member2Id);
    expect(member2Data[0].ideal).toBeCloseTo(0);
    expect(member2Data[1].ideal).toBeCloseTo(8);
    expect(member2Data[2].ideal).toBeCloseTo(4);
  });

  it('should return same data from cache for same parameters', () => {
    const state = useAppStore.getState();

    state.tasks = [
      createMockTask({
        id: 'task-1',
        sprintId,
        estimate: 8,
        status: 'todo',
        assignee: member1Id,
        assignmentHistory: [
          { assignee: member1Id, date: new Date('2024-01-01').toISOString() },
        ],
      }),
    ];

    const result1 = state.getBurndownData(sprintId, member1Id);
    const result2 = state.getBurndownData(sprintId, member1Id);

    expect(result1).toBe(result2);
  });

  it('should invalidate cache when tasks change', () => {
    const state = useAppStore.getState();

    state.tasks = [
      createMockTask({
        id: 'task-1',
        sprintId,
        estimate: 8,
        status: 'todo',
        assignee: member1Id,
        assignmentHistory: [
          { assignee: member1Id, date: new Date('2024-01-01').toISOString() },
        ],
      }),
    ];

    const result1 = state.getBurndownData(sprintId, member1Id);

    state.tasks = [
      { ...state.tasks[0], status: 'done' as const },
    ];

    const result2 = state.getBurndownData(sprintId, member1Id);

    expect(result1).not.toBe(result2);
    expect(result1[0].actual).not.toBe(result2[0].actual);
  });
});
