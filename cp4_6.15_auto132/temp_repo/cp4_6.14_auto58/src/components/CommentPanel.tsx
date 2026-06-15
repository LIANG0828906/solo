import React from 'react';
import type { Comment } from '../types';

interface CommentPanelProps {
  comments: Comment[];
  selectedCommentId: string | null;
  currentUser: string;
  onSelectComment: (commentId: string | null) => void;
  onAddReply: (commentId: string, content: string) => void;
  onResolveComment: (commentId: string) => void;
}

const CommentPanel: React.FC<CommentPanelProps> = ({
  comments,
  selectedCommentId,
  currentUser,
  onSelectComment,
  onAddReply,
  onResolveComment,
}) => {
  const [replyContent, setReplyContent] = React.useState('');

  const handleAddReply = (commentId: string) => {
    if (replyContent.trim()) {
      onAddReply(commentId, replyContent.trim());
      setReplyContent('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-800">批注列表</h3>
        <p className="text-xs text-gray-500 mt-1">共 {comments.length} 条批注</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            暂无批注
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-md border cursor-pointer transition-colors ${
                selectedCommentId === comment.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${comment.resolved ? 'opacity-60' : ''}`}
              onClick={() => onSelectComment(comment.id)}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-800">
                  {comment.author}
                </span>
                {comment.resolved && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    已解决
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
              {comment.replies.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="text-xs">
                      <span className="font-medium text-gray-700">
                        {reply.author}:
                      </span>{' '}
                      <span className="text-gray-600">{reply.content}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedCommentId === comment.id && !comment.resolved && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="添加回复..."
                    className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex gap-2">
                    <button
                      className="flex-1 text-xs px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddReply(comment.id);
                      }}
                    >
                      回复
                    </button>
                    <button
                      className="flex-1 text-xs px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolveComment(comment.id);
                      }}
                    >
                      解决
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentPanel;
