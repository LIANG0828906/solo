import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { websocketService } from '../utils/websocket';
import type { Meeting, MeetingSummary, Topic, Decision, TodoItem, TranscribeProgressEvent, SummaryUpdateEvent } from '../types';

const COLORS = ['#42a5f5', '#1a237e', '#4caf50', '#ff9800', '#e91e63', '#9c27b0'];

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [rawText, setRawText] = useState('');
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    transcription: true,
    summary: true,
    analytics: true,
  });
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMeeting = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/meetings/${id}`);
      const data = await response.json();
      setMeeting(data.data);
      setRawText(data.data?.rawText || '');
      setTranscriptionProgress(data.data?.transcriptionProgress || 0);
    } catch (error) {
      console.error('Failed to fetch meeting:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  useEffect(() => {
    websocketService.connect();

    const handleProgress = (event: TranscribeProgressEvent) => {
      if (event.meetingId === id) {
        setTranscriptionProgress(event.percentage);
      }
    };

    const handleSummaryUpdate = (event: SummaryUpdateEvent) => {
      if (event.meetingId === id) {
        setMeeting((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            summary: event.summary,
            status: event.isIncremental ? 'processing' : 'completed',
          };
        });
      }
    };

    websocketService.onProgress(handleProgress);
    websocketService.onSummaryUpdate(handleSummaryUpdate);

    return () => {
      websocketService.offProgress(handleProgress);
      websocketService.offSummaryUpdate(handleSummaryUpdate);
    };
  }, [id]);

  const handleStartAnalysis = async () => {
    if (!id || !rawText.trim()) return;

    setIsTranscribing(true);
    setTranscriptionProgress(0);

    try {
      await fetch(`/api/meetings/${id}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
    } catch (error) {
      console.error('Failed to start transcription:', error);
      setIsTranscribing(false);
    }
  };

  const debouncedSave = useCallback((updatedSummary: MeetingSummary) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/meetings/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: updatedSummary, rawText }),
        });
        setMeeting((prev) => prev ? { ...prev, summary: updatedSummary, rawText } : null);
      } catch (error) {
        console.error('Failed to save meeting:', error);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }, [id, rawText]);

  const handleTitleChange = (title: string) => {
    if (!meeting) return;
    const updatedSummary = { ...meeting.summary, title };
    debouncedSave(updatedSummary);
  };

  const handleTopicChange = (index: number, content: string) => {
    if (!meeting) return;
    const topics = [...meeting.summary.topics];
    topics[index] = { ...topics[index], content };
    const updatedSummary = { ...meeting.summary, topics };
    debouncedSave(updatedSummary);
  };

  const handleDecisionChange = (index: number, content: string) => {
    if (!meeting) return;
    const decisions = [...meeting.summary.decisions];
    decisions[index] = { ...decisions[index], content };
    const updatedSummary = { ...meeting.summary, decisions };
    debouncedSave(updatedSummary);
  };

  const handleTodoChange = (index: number, field: 'content' | 'assignee', value: string) => {
    if (!meeting) return;
    const todos = [...meeting.summary.todos];
    todos[index] = { ...todos[index], [field]: value };
    const updatedSummary = { ...meeting.summary, todos };
    debouncedSave(updatedSummary);
  };

  const handleTodoToggle = (index: number) => {
    if (!meeting) return;
    const todos = [...meeting.summary.todos];
    todos[index] = { ...todos[index], completed: !todos[index].completed };
    const updatedSummary = { ...meeting.summary, todos };
    debouncedSave(updatedSummary);
  };

  const handleAddTopic = () => {
    if (!meeting) return;
    const newTopic: Topic = { id: Date.now().toString(), content: '' };
    const updatedSummary = {
      ...meeting.summary,
      topics: [...meeting.summary.topics, newTopic],
    };
    debouncedSave(updatedSummary);
  };

  const handleAddDecision = () => {
    if (!meeting) return;
    const newDecision: Decision = { id: Date.now().toString(), content: '' };
    const updatedSummary = {
      ...meeting.summary,
      decisions: [...meeting.summary.decisions, newDecision],
    };
    debouncedSave(updatedSummary);
  };

  const handleAddTodo = () => {
    if (!meeting) return;
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      content: '',
      assignee: '',
      completed: false,
    };
    const updatedSummary = {
      ...meeting.summary,
      todos: [...meeting.summary.todos, newTodo],
    };
    debouncedSave(updatedSummary);
  };

  const generateMarkdown = (): string => {
    if (!meeting) return '';
    const { summary } = meeting;
    let md = `# ${summary.title}\n\n`;

    if (summary.topics.length > 0) {
      md += `## 议题\n\n`;
      summary.topics.forEach((topic, index) => {
        md += `${index + 1}. ${topic.content}\n`;
      });
      md += '\n';
    }

    if (summary.decisions.length > 0) {
      md += `## 决策\n\n`;
      summary.decisions.forEach((decision, index) => {
        md += `${index + 1}. ${decision.content}\n`;
      });
      md += '\n';
    }

    if (summary.todos.length > 0) {
      md += `## 待办事项\n\n`;
      summary.todos.forEach((todo) => {
        const checkbox = todo.completed ? '[x]' : '[ ]';
        const assignee = todo.assignee ? ` @${todo.assignee}` : '';
        md += `- ${checkbox} ${todo.content}${assignee}\n`;
      });
      md += '\n';
    }

    if (summary.participantEngagement.length > 0) {
      md += `## 参与度\n\n`;
      md += `| 参会者 | 发言时长 |\n| --- | --- |\n`;
      summary.participantEngagement.forEach((p) => {
        md += `| ${p.name} | ${p.speakingTime}秒 |\n`;
      });
    }

    return md;
  };

  const handleCopyToClipboard = async () => {
    const markdown = generateMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadMarkdown = () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting?.summary.title || 'meeting'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSection = (section: 'transcription' | 'summary' | 'analytics') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleRawTextChange = (value: string) => {
    setRawText(value);
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  };

  const engagementData = meeting?.summary.participantEngagement.map((p) => ({
    name: p.name,
    value: p.speakingTime,
  })) || [];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-gray-600">会议不存在</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">会议详情</h1>
            <p className="text-gray-500 text-sm mt-1">
              {meeting.name} · {new Date(meeting.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
          {isSaving && (
            <span className="text-sm text-gray-500">保存中...</span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 three-column-layout">
        <div className="card p-5">
          <button
            className="w-full flex items-center justify-between lg:cursor-default"
            onClick={() => toggleSection('transcription')}
          >
            <h2 className="text-lg font-semibold text-gray-800">录音文本</h2>
            <span className="lg:hidden text-gray-500">
              {expandedSections.transcription ? '▼' : '▶'}
            </span>
          </button>

          <div
            className={`accordion lg:h-auto ${
              expandedSections.transcription ? '' : 'accordion-collapsed'
            }`}
          >
            <div className="mt-4">
              <textarea
                ref={textAreaRef}
                value={rawText}
                onChange={(e) => handleRawTextChange(e.target.value)}
                placeholder="粘贴或输入会议录音文本..."
                className="w-full h-64 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />

              {isTranscribing && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>转写进度</span>
                    <span>{transcriptionProgress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${transcriptionProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                className="btn btn-accent w-full mt-4"
                onClick={handleStartAnalysis}
                disabled={isTranscribing || !rawText.trim()}
              >
                {isTranscribing ? '分析中...' : '开始分析'}
              </button>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <button
            className="w-full flex items-center justify-between lg:cursor-default"
            onClick={() => toggleSection('summary')}
          >
            <h2 className="text-lg font-semibold text-gray-800">会议纪要</h2>
            <span className="lg:hidden text-gray-500">
              {expandedSections.summary ? '▼' : '▶'}
            </span>
          </button>

          <div
            className={`accordion lg:h-auto ${
              expandedSections.summary ? '' : 'accordion-collapsed'
            }`}
          >
            <div className="mt-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题
                </label>
                <input
                  type="text"
                  value={meeting.summary.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    议题
                  </label>
                  <button
                    onClick={handleAddTopic}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + 添加
                  </button>
                </div>
                <div className="space-y-2">
                  {meeting.summary.topics.map((topic, index) => (
                    <div
                      key={topic.id}
                      className="list-item flex gap-2"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <span className="text-gray-400 mt-3">{index + 1}.</span>
                      <input
                        type="text"
                        value={topic.content}
                        onChange={(e) => handleTopicChange(index, e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="输入议题..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    决策
                  </label>
                  <button
                    onClick={handleAddDecision}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + 添加
                  </button>
                </div>
                <div className="space-y-2">
                  {meeting.summary.decisions.map((decision, index) => (
                    <div
                      key={decision.id}
                      className="list-item flex gap-2"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <span className="text-gray-400 mt-3">{index + 1}.</span>
                      <input
                        type="text"
                        value={decision.content}
                        onChange={(e) => handleDecisionChange(index, e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="输入决策..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    待办事项
                  </label>
                  <button
                    onClick={handleAddTodo}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + 添加
                  </button>
                </div>
                <div className="space-y-2">
                  {meeting.summary.todos.map((todo, index) => (
                    <div
                      key={todo.id}
                      className={`list-item flex gap-2 items-center p-2 rounded-lg transition-colors ${
                        todo.completed ? 'bg-green-50' : 'bg-white'
                      }`}
                      style={{
                        animationDelay: `${index * 0.05}s`,
                        borderLeft: todo.completed ? '3px solid #4caf50' : '3px solid transparent',
                      }}
                    >
                      <label className="relative flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleTodoToggle(index)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:border-green-500 peer-checked:bg-green-500 transition-all flex items-center justify-center">
                          {todo.completed && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </label>
                      <input
                        type="text"
                        value={todo.content}
                        onChange={(e) => handleTodoChange(index, 'content', e.target.value)}
                        className={`flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          todo.completed ? 'todo-completed bg-green-50' : ''
                        }`}
                        placeholder="输入待办事项..."
                      />
                      <input
                        type="text"
                        value={todo.assignee}
                        onChange={(e) => handleTodoChange(index, 'assignee', e.target.value)}
                        className="w-24 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="负责人"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <button
            className="w-full flex items-center justify-between lg:cursor-default"
            onClick={() => toggleSection('analytics')}
          >
            <h2 className="text-lg font-semibold text-gray-800">数据分析</h2>
            <span className="lg:hidden text-gray-500">
              {expandedSections.analytics ? '▼' : '▶'}
            </span>
          </button>

          <div
            className={`accordion lg:h-auto ${
              expandedSections.analytics ? '' : 'accordion-collapsed'
            }`}
          >
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">参与度分布</h3>
                {engagementData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={engagementData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {engagementData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value}秒`, '发言时长']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-400">
                    暂无参与度数据
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">导出纪要</h3>
                <div className="space-y-3">
                  <button
                    className="btn w-full"
                    onClick={handleDownloadMarkdown}
                    disabled={!meeting.summary.title && meeting.summary.topics.length === 0}
                  >
                    导出 Markdown
                  </button>
                  <button
                    className={`btn w-full ${copied ? 'btn-success' : 'btn-accent'}`}
                    onClick={handleCopyToClipboard}
                    disabled={!meeting.summary.title && meeting.summary.topics.length === 0}
                  >
                    {copied ? '✓ 已复制' : '一键复制'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">会议信息</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>参会人数</span>
                    <span>{meeting.participants.length} 人</span>
                  </div>
                  <div className="flex justify-between">
                    <span>会议时长</span>
                    <span>{Math.floor(meeting.duration / 60)} 分钟</span>
                  </div>
                  <div className="flex justify-between">
                    <span>状态</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      meeting.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : meeting.status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {meeting.status === 'completed'
                        ? '已完成'
                        : meeting.status === 'processing'
                        ? '处理中'
                        : '待处理'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
