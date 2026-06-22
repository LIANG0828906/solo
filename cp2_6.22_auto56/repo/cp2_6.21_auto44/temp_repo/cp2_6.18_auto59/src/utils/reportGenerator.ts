import type { Task, TemplateType, CustomTemplateConfig } from '../types';
import {
  formatReportTitle,
  formatDate,
  formatTotalWorkHours,
  formatEstimatedTime,
} from './formatters';

interface GenerateReportParams {
  tasks: Task[];
  templateType: TemplateType;
  customTemplate: CustomTemplateConfig;
  draftNotes: string;
}

interface ReportSection {
  type: 'title' | 'workHours' | 'completedTasks' | 'pendingTasks' | 'notes';
  title?: string;
  content: string;
}

const getPendingTasks = (tasks: Task[]): Task[] =>
  tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => a.order - b.order);

const getCompletedTasks = (tasks: Task[]): Task[] =>
  tasks
    .filter((t) => t.status === 'completed')
    .sort((a, b) => a.order - b.order);

const getTotalCompletedMinutes = (tasks: Task[]): number =>
  tasks
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.estimatedMinutes, 0);

const buildCompletedTasksSection = (tasks: Task[], title: string): string => {
  const completed = getCompletedTasks(tasks);
  if (completed.length === 0) {
    return `## ${title}\n\n暂无已完成任务\n`;
  }
  const lines = completed.map(
    (task) =>
      `● [${task.priority}] ${task.content}（${formatEstimatedTime(task.estimatedMinutes)}）`
  );
  return `## ${title}\n\n${lines.join('\n')}\n`;
};

const buildPendingTasksSection = (tasks: Task[], title: string): string => {
  const pending = getPendingTasks(tasks);
  if (pending.length === 0) {
    return `## ${title}\n\n暂无待处理任务\n`;
  }
  const lines = pending.map(
    (task) =>
      `○ [${task.priority}] ${task.content}（${formatEstimatedTime(task.estimatedMinutes)}）`
  );
  return `## ${title}\n\n${lines.join('\n')}\n`;
};

const buildWorkHoursSection = (tasks: Task[], title: string): string => {
  const totalMinutes = getTotalCompletedMinutes(tasks);
  return `## ${title}：${formatTotalWorkHours(totalMinutes)}\n`;
};

const buildTitleSection = (title: string): string => {
  return `# ${title || formatReportTitle()}\n\n日期：${formatDate()}\n`;
};

const buildNotesSection = (notes: string, title: string): string => {
  return `## ${title}\n\n${notes.trim() || '暂无备注'}\n`;
};

export const generatePlainTextReport = (params: GenerateReportParams): string => {
  const { tasks, templateType, customTemplate, draftNotes } = params;

  const sections: string[] = [];

  if (templateType === 'simple') {
    sections.push(buildTitleSection(formatReportTitle()));
    sections.push(buildCompletedTasksSection(tasks, '已完成任务'));
    const pending = getPendingTasks(tasks);
    if (pending.length > 0) {
      sections.push(buildPendingTasksSection(tasks, '待完成任务'));
    }
  } else if (templateType === 'detailed') {
    sections.push(buildTitleSection(formatReportTitle()));
    sections.push(buildWorkHoursSection(tasks, '今日总工时'));
    sections.push(buildCompletedTasksSection(tasks, '已完成任务'));
    sections.push(buildPendingTasksSection(tasks, '待完成任务'));
    sections.push(buildNotesSection(draftNotes, '备注'));
  } else {
    const sortedSections = [...customTemplate.sections].sort(
      (a, b) => a.order - b.order
    );

    for (const section of sortedSections) {
      if (!section.enabled) continue;

      switch (section.key) {
        case 'title':
          sections.push(buildTitleSection(section.title || formatReportTitle()));
          break;
        case 'workHours':
          sections.push(buildWorkHoursSection(tasks, section.title || '今日总工时'));
          break;
        case 'completedTasks':
          sections.push(
            buildCompletedTasksSection(tasks, section.title || '已完成任务')
          );
          break;
        case 'pendingTasks':
          sections.push(
            buildPendingTasksSection(tasks, section.title || '待完成任务')
          );
          break;
        case 'notes':
          sections.push(buildNotesSection(draftNotes, section.title || '备注'));
          break;
      }
    }
  }

  return sections.join('\n');
};

export interface ReportRenderData {
  sections: ReportSection[];
  title: string;
  date: string;
  totalCompletedMinutes: number;
  completedTasks: Task[];
  pendingTasks: Task[];
}

export const generateReportRenderData = (
  params: GenerateReportParams
): ReportRenderData => {
  const { tasks, templateType, customTemplate, draftNotes } = params;

  const sections: ReportSection[] = [];
  let title = formatReportTitle();

  const addSection = (type: ReportSection['type'], content: string, sectionTitle?: string) => {
    sections.push({ type, title: sectionTitle, content });
  };

  if (templateType === 'simple') {
    addSection('title', formatReportTitle(), '标题');
    addSection(
      'completedTasks',
      buildCompletedTasksSection(tasks, '已完成任务'),
      '已完成任务'
    );
    const pending = getPendingTasks(tasks);
    if (pending.length > 0) {
      addSection(
        'pendingTasks',
        buildPendingTasksSection(tasks, '待完成任务'),
        '待完成任务'
      );
    }
  } else if (templateType === 'detailed') {
    addSection('title', formatReportTitle(), '标题');
    addSection(
      'workHours',
      buildWorkHoursSection(tasks, '今日总工时'),
      '今日总工时'
    );
    addSection(
      'completedTasks',
      buildCompletedTasksSection(tasks, '已完成任务'),
      '已完成任务'
    );
    addSection(
      'pendingTasks',
      buildPendingTasksSection(tasks, '待完成任务'),
      '待完成任务'
    );
    addSection('notes', buildNotesSection(draftNotes, '备注'), '备注');
  } else {
    const sortedSections = [...customTemplate.sections].sort(
      (a, b) => a.order - b.order
    );

    for (const sec of sortedSections) {
      if (!sec.enabled) continue;

      switch (sec.key) {
        case 'title':
          title = sec.title || formatReportTitle();
          addSection('title', buildTitleSection(title), sec.title);
          break;
        case 'workHours':
          addSection(
            'workHours',
            buildWorkHoursSection(tasks, sec.title || '今日总工时'),
            sec.title
          );
          break;
        case 'completedTasks':
          addSection(
            'completedTasks',
            buildCompletedTasksSection(tasks, sec.title || '已完成任务'),
            sec.title
          );
          break;
        case 'pendingTasks':
          addSection(
            'pendingTasks',
            buildPendingTasksSection(tasks, sec.title || '待完成任务'),
            sec.title
          );
          break;
        case 'notes':
          addSection(
            'notes',
            buildNotesSection(draftNotes, sec.title || '备注'),
            sec.title
          );
          break;
      }
    }
  }

  return {
    sections,
    title,
    date: formatDate(),
    totalCompletedMinutes: getTotalCompletedMinutes(tasks),
    completedTasks: getCompletedTasks(tasks),
    pendingTasks: getPendingTasks(tasks),
  };
};
