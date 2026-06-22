import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Work, Comment } from '../types';

interface WorkDetailProps {
  work: Work;
  onLike: (workId: string) => void;
  onAddComment: (workId: string, content: string) => void;
  onEditComment: (workId: string, commentId: string, content: string) => void;
  onDeleteComment: (workId: string, commentId: string) => void;
  onEdit: (work: Work) => void;
  onDelete: (workId: string) => void;
  onClose: () => void;
}

const categoryLabels: Record<string, string> = {
  article: '文章',
  video: '视频',
  image: '图片',
};

const WorkDetail: React.FC<WorkDetailProps> = ({
  work,
  onLike,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onEdit,
  onDelete,
  onClose,
}) => {
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const commentsRef = useRef<HTMLDivElement>(null);

  const handleLike = () => {
    if (!work.likedByUser) {
      onLike(work.id);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(work.id, commentText.trim());
    setCommentText('');
    setTimeout(() => {
      commentsRef.current?.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, 100);
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editText.trim()) return;
    onEditComment(work.id, commentId, editText.trim());
    setEditingCommentId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const sortedComments = [...work.comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-800">作品详情</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(work)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              编辑
            </button>
            <button
              onClick={() => onDelete(work.id)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              删除
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <div className="lg:w-3/5 p-6">
            <img
              src={work.coverUrl}
              alt={work.title}
              className="w-full h-80 lg:h-96 object-cover rounded-2xl shadow-lg"
            />
          </div>

          <div className="lg:w-2/5 p-6 border-l flex flex-col">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-3">
                {categoryLabels[work.category]}
              </span>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{work.title}</h1>
              <p className="text-gray-500 text-sm">
                创建于 {format(new Date(work.createdAt), 'yyyy年MM月dd日 HH:mm')}
              </p>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed flex-1">{work.description}</p>

            <div className="flex items-center gap-6 mb-6 pb-6 border-b">
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{work.views} 次浏览</span>
              </div>
              <button
                onClick={handleLike}
                disabled={work.likedByUser}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  work.likedByUser
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${work.likedByUser ? 'scale-110' : ''}`}
                  fill={work.likedByUser ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-medium">{work.likes}</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                评论 ({work.comments.length})
              </h3>

              <form onSubmit={handleSubmitComment} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写下你的评论..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  发送
                </button>
              </form>

              <div ref={commentsRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
                {sortedComments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>暂无评论，来抢沙发吧</p>
                  </div>
                ) : (
                  sortedComments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {comment.author.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{comment.author}</p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(comment.createdAt), 'MM-dd HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDeleteComment(work.id, comment.id)}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                            title="删除"
                          >
                            <svg className="w-4 h-4 text-gray-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-2 bg-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm">{comment.content}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDetail;
