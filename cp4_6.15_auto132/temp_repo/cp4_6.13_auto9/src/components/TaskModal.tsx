import { useState, useEffect } from 'react';
import { X, Calendar, User, MessageSquare, FileText, Activity, Paperclip, Send } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { TaskDetail, User as UserType, Comment } from '../types';

interface TaskModalProps {
  task: TaskDetail;
  users: UserType[];
  onClose: () => void;
}

export default function TaskModal({ task, users, onClose }: TaskModalProps) {
  const { user, addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(task.comments);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEditedTask(task);
    setComments(task.comments);
  }, [task]);

  const assignee = users.find((u) => u.id === task.assigneeId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const priorityLabels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  };

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editedTask, userId: user?.id }),
      });
      const data = await response.json();
      if (data.success) {
        addToast({ message: '任务更新成功', type: 'success' });
        setIsEditing(false);
      }
    } catch {
      addToast({ message: '更新失败，请重试', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content: newComment }),
      });
      const data = await response.json();
      if (data.success) {
        setComments([data.comment, ...comments]);
        setNewComment('');
      }
    } catch {
      addToast({ message: '评论发布失败', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { key: 'details', label: '详情', icon: FileText },
    { key: 'comments', label: `评论 (${comments.length})`, icon: MessageSquare },
    { key: 'activity', label: '操作日志', icon: Activity },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="modal-overlay absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="modal-content relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${priorityColors[task.priority]}`}
            />
            <h2 className="text-lg font-semibold text-gray-800">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, title: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-mint/50"
                />
              ) : (
                task.title
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-mint'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">描述</h3>
                {isEditing ? (
                  <textarea
                    value={editedTask.description}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint/50 resize-none"
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {task.description || '暂无描述'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">优先级</h3>
                  {isEditing ? (
                    <select
                      value={editedTask.priority}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          priority: e.target.value as 'high' | 'medium' | 'low',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint/50"
                    >
                      <option value="high">高优先级</option>
                      <option value="medium">中优先级</option>
                      <option value="low">低优先级</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${priorityColors[task.priority]}`}
                      />
                      <span className="text-gray-700">
                        {priorityLabels[task.priority]}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      截止日期
                    </div>
                  </h3>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedTask.dueDate}
                      onChange={(e) =>
                        setEditedTask({ ...editedTask, dueDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint/50"
                    />
                  ) : (
                    <span className="text-gray-700">{formatDate(task.dueDate)}</span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      负责人
                    </div>
                  </h3>
                  {isEditing ? (
                    <select
                      value={editedTask.assigneeId}
                      onChange={(e) =>
                        setEditedTask({ ...editedTask, assigneeId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint/50"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {assignee && (
                        <>
                          <img
                            src={assignee.avatar}
                            alt={assignee.username}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-gray-700">{assignee.username}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Paperclip className="w-4 h-4" />
                    附件 ({task.attachments?.length || 0})
                  </div>
                </h3>
                {task.attachments && task.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {task.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.url}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{att.name}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">暂无附件</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                {user && (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="添加评论..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-mint/50 text-sm"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {comments.map((comment) => {
                  const commentUser = users.find((u) => u.id === comment.userId);
                  return (
                    <div key={comment.id} className="flex gap-3">
                      {commentUser && (
                        <img
                          src={commentUser.avatar}
                          alt={commentUser.username}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {commentUser?.username || '未知用户'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
                {comments.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">
                    暂无评论，快来发表第一条评论吧
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {task.activityLogs && task.activityLogs.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />
                  {task.activityLogs.map((log) => {
                    const logUser = users.find((u) => u.id === log.userId);
                    return (
                      <div key={log.id} className="flex gap-4 pb-6 last:pb-0">
                        <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-mint flex items-center justify-center flex-shrink-0">
                          {logUser && (
                            <img
                              src={logUser.avatar}
                              alt={logUser.username}
                              className="w-5 h-5 rounded-full"
                            />
                          )}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-gray-800">
                              {logUser?.username || '未知用户'}
                            </span>
                            <span className="text-xs text-mint font-medium">
                              {log.action}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm py-8">
                  暂无操作记录
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setEditedTask(task);
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                保存
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm bg-mint text-primary font-medium rounded-lg hover:bg-mint/80 transition-colors"
            >
              编辑任务
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
