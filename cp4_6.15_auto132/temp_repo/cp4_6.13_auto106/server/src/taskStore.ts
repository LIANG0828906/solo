import { v4 as uuidv4 } from 'uuid';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
}

interface NewTaskInput {
  title: string;
  assignee: string;
  priority: TaskPriority;
}

let tasks: Task[] = [
  {
    id: uuidv4(),
    title: '完成项目需求文档',
    assignee: '张三',
    priority: 'high',
    status: 'todo',
  },
  {
    id: uuidv4(),
    title: '设计系统架构图',
    assignee: '李四',
    priority: 'medium',
    status: 'todo',
  },
  {
    id: uuidv4(),
    title: '搭建前端开发环境',
    assignee: '王五',
    priority: 'high',
    status: 'in-progress',
  },
  {
    id: uuidv4(),
    title: '编写单元测试用例',
    assignee: '赵六',
    priority: 'low',
    status: 'in-progress',
  },
  {
    id: uuidv4(),
    title: '项目初始化配置',
    assignee: '张三',
    priority: 'medium',
    status: 'done',
  },
];

export const taskStore = {
  getTasks(): Task[] {
    return [...tasks];
  },

  getTaskById(id: string): Task | undefined {
    return tasks.find((t) => t.id === id);
  },

  addTask(input: NewTaskInput): Task {
    const newTask: Task = {
      id: uuidv4(),
      title: input.title,
      assignee: input.assignee,
      priority: input.priority,
      status: 'todo',
    };
    tasks.push(newTask);
    return newTask;
  },

  updateTaskStatus(id: string, newStatus: TaskStatus): Task | undefined {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.status = newStatus;
      return { ...task };
    }
    return undefined;
  },

  deleteTask(id: string): boolean {
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      tasks.splice(index, 1);
      return true;
    }
    return false;
  },
};
