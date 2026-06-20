import React, { useState } from 'react';
import { Member, Task, TaskStatus } from '../data';

interface MemberPanelProps {
  members: Member[];
  tasks: Task[];
  isOpen: boolean;
  onToggle: () => void;
  onGenerateReport: (memberId: string) => Promise<string>;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  'in-progress': '进行中',
  done: '已完成',
};

const MemberPanel: React.FC<MemberPanelProps> = ({
  members,
  tasks,
  isOpen,
  onToggle,
  onGenerateReport,
}) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [report, setReport] = useState<string>('');
  const [reportItems, setReportItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setReport('');
    setReportItems([]);
  };

  const handleGenerateReport = async () => {
    if (!selectedMember) return;
    setLoading(true);
    try {
      const reportContent = await onGenerateReport(selectedMember.id);
      setReport(reportContent);
      const lines = reportContent.split('\n').filter((line) => line.trim().startsWith('- '));
      setReportItems([]);
      lines.forEach((line, index) => {
        setTimeout(() => {
          setReportItems((prev) => [...prev, line.substring(2)]);
        }, index * 150);
      });
    } catch (error) {
      console.error('生成报告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberTasks = (memberId: string) => {
    return tasks.filter((t) => t.assigneeId === memberId);
  };

  const getTasksByStatus = (memberId: string, status: TaskStatus) => {
    return getMemberTasks(memberId).filter((t) => t.status === status);
  };

  return (
    <>
      <button
        className={`panel-toggle ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        {isOpen ? '›' : '👥'}
      </button>

      <div className={`member-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h3>团队成员</h3>
        </div>

        <div className="member-list">
          {members.map((member) => (
            <div
              key={member.id}
              className={`member-item ${selectedMember?.id === member.id ? 'selected' : ''}`}
              onClick={() => handleMemberClick(member)}
            >
              <span
                className="member-avatar"
                style={{ backgroundColor: member.avatarColor }}
              >
                {member.name.charAt(0)}
              </span>
              <span className="member-name">{member.name}</span>
              <span className="member-task-count">
                {getMemberTasks(member.id).length} 个任务
              </span>
            </div>
          ))}
        </div>

        {selectedMember && (
          <div className="member-detail">
            <div className="detail-header-row">
              <span
                className="member-avatar large"
                style={{ backgroundColor: selectedMember.avatarColor }}
              >
                {selectedMember.name.charAt(0)}
              </span>
              <div>
                <h4>{selectedMember.name}</h4>
                <p className="member-stats">
                  共 {getMemberTasks(selectedMember.id).length} 个任务
                </p>
              </div>
            </div>

            <div className="personal-kanban">
              {(['todo', 'in-progress', 'done'] as TaskStatus[]).map((status) => (
                <div key={status} className="personal-column">
                  <div className="personal-column-header">
                    <span>{statusLabels[status]}</span>
                    <span className="count">
                      {getTasksByStatus(selectedMember.id, status).length}
                    </span>
                  </div>
                  <div className="personal-task-list">
                    {getTasksByStatus(selectedMember.id, status).map((task) => (
                      <div key={task.id} className="personal-task-item">
                        <span
                          className="mini-dot"
                          style={{
                            backgroundColor:
                              task.priority === 'high'
                                ? '#ff4d4f'
                                : task.priority === 'medium'
                                ? '#faad14'
                                : '#52c41a',
                          }}
                        />
                        <span className="task-name">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="generate-report-btn"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? '生成中...' : '生成工作报告'}
            </button>

            {reportItems.length > 0 && (
              <div className="report-section">
                <h5>近7天工作报告</h5>
                <ul className="report-list">
                  {reportItems.map((item, index) => (
                    <li key={index} className="report-item" style={{ animationDelay: `${index * 0.1}s` }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MemberPanel;
