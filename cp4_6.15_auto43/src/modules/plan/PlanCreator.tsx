import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ReadingPlan, Member } from '../../types';
import { splitPagesToDaily, generateMember, formatDate } from '../../utils/calculateProgress';

interface PlanCreatorProps {
  onPlanCreated: (plan: ReadingPlan) => void;
}

export default function PlanCreator({ onPlanCreated }: PlanCreatorProps) {
  const [bookTitle, setBookTitle] = useState('人类简史');
  const [author, setAuthor] = useState('尤瓦尔·赫拉利');
  const [totalChapters, setTotalChapters] = useState(20);
  const [totalPages, setTotalPages] = useState(440);
  const [startDate, setStartDate] = useState(() => formatDate(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 29);
    return formatDate(d);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dailyAssignments = splitPagesToDaily(totalPages, startDate, endDate);

    const members: Member[] = [
      generateMember(uuidv4(), '小明', 0),
      generateMember(uuidv4(), '小红', 1),
      generateMember(uuidv4(), '小刚', 2),
      generateMember(uuidv4(), '小美', 3),
    ];

    members[0].dailyProgress = generateSampleProgress(dailyAssignments, 0.85);
    members[1].dailyProgress = generateSampleProgress(dailyAssignments, 0.7);
    members[2].dailyProgress = generateSampleProgress(dailyAssignments, 0.6);
    members[3].dailyProgress = generateSampleProgress(dailyAssignments, 0.9);

    const plan: ReadingPlan = {
      id: uuidv4(),
      bookTitle,
      author,
      totalChapters,
      totalPages,
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
      dailyAssignments,
      milestones: generateSampleMilestones(totalChapters, totalPages, dailyAssignments),
      members,
    };

    onPlanCreated(plan);
  };

  return (
    <div className="glass-card form-card" style={{ animation: 'fadeInUp 0.5s ease' }}>
      <h2 className="form-title">
        <span className="form-title-icon">📚</span>
        创建阅读计划
      </h2>
      <form onSubmit={handleSubmit} className="form-space">
        <div className="form-grid-2">
          <div>
            <label className="label">书名</label>
            <input
              type="text"
              className="input"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="请输入书名"
              required
            />
          </div>
          <div>
            <label className="label">作者</label>
            <input
              type="text"
              className="input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="请输入作者"
              required
            />
          </div>
        </div>
        <div className="form-grid-2">
          <div>
            <label className="label">总章节数</label>
            <input
              type="number"
              min="1"
              className="input"
              value={totalChapters}
              onChange={(e) => setTotalChapters(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="label">总页数</label>
            <input
              type="number"
              min="1"
              className="input"
              value={totalPages}
              onChange={(e) => setTotalPages(Number(e.target.value))}
              required
            />
          </div>
        </div>
        <div className="form-grid-2">
          <div>
            <label className="label">开始日期</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">目标完成日期</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-full">
            🚀 创建计划
          </button>
        </div>
      </form>
    </div>
  );
}

function generateSampleProgress(
  assignments: { date: string; pageCount: number }[],
  completionRate: number
) {
  const progress: { date: string; pagesRead: number }[] = [];
  const today = formatDate(new Date());

  for (const assignment of assignments) {
    if (assignment.date > today) break;
    if (Math.random() < completionRate) {
      const variance = 0.7 + Math.random() * 0.6;
      progress.push({
        date: assignment.date,
        pagesRead: Math.round(assignment.pageCount * variance),
      });
    }
  }

  return progress;
}

function generateSampleMilestones(
  totalChapters: number,
  totalPages: number,
  assignments: { date: string; startPage: number; endPage: number }[]
) {
  const pagesPerChapter = totalPages / totalChapters;
  const milestones = [];

  for (let chapter = 5; chapter <= totalChapters; chapter += 5) {
    const milestonePage = Math.ceil(chapter * pagesPerChapter);
    const foundAssignment = assignments.find(
      (a) => milestonePage >= a.startPage && milestonePage <= a.endPage
    );

    if (foundAssignment) {
      milestones.push({
        id: uuidv4(),
        chapter,
        completedAt: foundAssignment.date,
        title: `第 ${chapter} 章完成`,
        comments: [
          {
            id: uuidv4(),
            memberId: 'sample-1',
            content: chapter <= 10 ? '内容越来越精彩了！' : '收获满满，期待下一章！',
            createdAt: new Date().toISOString(),
          },
        ],
        likes: [],
      });
    }
  }

  return milestones;
}
