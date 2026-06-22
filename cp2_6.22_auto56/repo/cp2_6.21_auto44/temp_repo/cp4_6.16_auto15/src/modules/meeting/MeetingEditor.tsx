import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, FileText } from 'lucide-react';
import { parseMeetingContent, type ParsedMeeting, type ParsedTodo } from './MeetingParser';
import { useMeetingStore } from './MeetingStore';
import { useTaskStore } from '../task/TaskStore';

export default function MeetingEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'new';

  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState<ParsedMeeting | null>(null);
  const [title, setTitle] = useState('');
  const [conclusions, setConclusions] = useState<string[]>([]);
  const [todos, setTodos] = useState<ParsedTodo[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { getMeetingById, createMeeting, updateMeeting, setCurrentMeeting, setCurrentTodos } = useMeetingStore();
  const { getTodosByMeetingId } = useTaskStore();

  useEffect(() => {
    if (isEdit && id) {
      loadMeeting(id);
    }
  }, [id, isEdit]);

  const loadMeeting = async (meetingId: string) => {
    const meeting = await getMeetingById(meetingId);
    if (meeting) {
      setTitle(meeting.title);
      setConclusions(meeting.conclusions);
      setInputText(meeting.content);
      setCurrentMeeting(meeting);

      const meetingTodos = await getTodosByMeetingId(meetingId);
      const parsedTodos: ParsedTodo[] = meetingTodos.map((t) => ({
        title: t.title,
        assignee: t.assignee,
        dueDate: t.dueDate,
      }));
      setTodos(parsedTodos);
      setCurrentTodos(meetingTodos);
      setParsed({
        title: meeting.title,
        conclusions: meeting.conclusions,
        todos: parsedTodos,
      });
    }
  };

  const handleParse = useCallback(() => {
    if (!inputText.trim()) return;
    const result = parseMeetingContent(inputText);
    setParsed(result);
    setTitle(result.title);
    setConclusions(result.conclusions);
    setTodos(result.todos);
    setSaved(false);
  }, [inputText]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setSaved(false);

    try {
      if (isEdit && id) {
        await updateMeeting(id, {
          title: title.trim(),
          content: inputText,
          conclusions,
          todos: todos,
        });
      } else {
        const meeting = await createMeeting({
          title: title.trim(),
          content: inputText,
          conclusions,
          todos: todos,
        });
        navigate(`/meeting/${meeting.id}`, { replace: true });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddConclusion = () => {
    setConclusions([...conclusions, '']);
  };

  const handleConclusionChange = (index: number, value: string) => {
    const next = [...conclusions];
    next[index] = value;
    setConclusions(next);
  };

  const handleRemoveConclusion = (index: number) => {
    setConclusions(conclusions.filter((_, i) => i !== index));
  };

  const handleAddTodo = () => {
    setTodos([
      ...todos,
      {
        title: '',
        assignee: '',
        dueDate: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const handleTodoChange = (index: number, field: keyof ParsedTodo, value: string) => {
    const next = [...todos];
    next[index] = { ...next[index], [field]: value };
    setTodos(next);
  };

  const handleRemoveTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-editor mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">返回</span>
          </button>
          <h1 className="text-lg font-medium flex items-center gap-2">
            <FileText size={20} />
            {isEdit ? '编辑会议纪要' : '新建会议纪要'}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-editor mx-auto px-4 py-6">
        <section className="mb-6">
          <label className="block text-sm font-medium text-primary mb-2">
            会议文字记录
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请输入或粘贴会议文字记录（模拟语音转文字结果）..."
            className="w-full h-48 p-4 rounded-lg border border-surface-200 bg-surface-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleParse}
              disabled={!inputText.trim()}
              className="px-5 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              解析会议内容
            </button>
          </div>
        </section>

        {parsed && (
          <section className="bg-white rounded-lg shadow-sm border border-surface-200 overflow-hidden">
            <div className="p-5 border-b border-surface-100">
              <label className="block text-sm font-medium text-primary mb-2">
                会议主题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-md text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="p-5 border-b border-surface-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-primary">关键结论</h3>
                <button
                  onClick={handleAddConclusion}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary-600 transition-colors"
                >
                  <Plus size={14} />
                  添加结论
                </button>
              </div>
              <div className="space-y-2">
                {conclusions.map((c, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-primary text-sm mt-2 font-medium min-w-[20px]">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={c}
                      onChange={(e) => handleConclusionChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-surface-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="请输入结论..."
                    />
                    <button
                      onClick={() => handleRemoveConclusion(idx)}
                      className="p-2 text-gray-400 hover:text-danger transition-colors"
                      disabled={conclusions.length <= 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-primary">待办事项</h3>
                <button
                  onClick={handleAddTodo}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary-600 transition-colors"
                >
                  <Plus size={14} />
                  添加待办
                </button>
              </div>
              <div className="space-y-3">
                {todos.map((todo, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-50 rounded-md border border-surface-200"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-primary text-xs mt-1 font-medium bg-primary-50 px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={todo.title}
                        onChange={(e) => handleTodoChange(idx, 'title', e.target.value)}
                        className="flex-1 px-2 py-1 border border-surface-200 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                        placeholder="待办事项标题..."
                      />
                      <button
                        onClick={() => handleRemoveTodo(idx)}
                        className="p-1 text-gray-400 hover:text-danger transition-colors"
                        disabled={todos.length <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex gap-3 ml-7">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">负责人</label>
                        <input
                          type="text"
                          value={todo.assignee}
                          onChange={(e) => handleTodoChange(idx, 'assignee', e.target.value)}
                          className="w-full px-2 py-1 border border-surface-200 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                          placeholder="负责人"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">截止日期</label>
                        <input
                          type="date"
                          value={todo.dueDate}
                          onChange={(e) => handleTodoChange(idx, 'dueDate', e.target.value)}
                          className="w-full px-2 py-1 border border-surface-200 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-surface-50 border-t border-surface-100 flex items-center justify-between">
              <span className={`text-sm ${saved ? 'text-green-600' : 'text-transparent'}`}>
                ✓ 保存成功
              </span>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {saving ? '保存中...' : '保存会议纪要'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
