import React from 'react';
import type { Comment } from '../types';

interface EditorProps {
  content: string;
  plainText: string;
  comments: Comment[];
  selectedCommentId: string | null;
  onContentChange: (content: string, plainText: string) => void;
  onSelectComment: (commentId: string | null) => void;
  onCreateComment: (text: string, startOffset: number, endOffset: number, content: string) => void;
}

const Editor: React.FC<EditorProps> = ({
  content,
  plainText,
  comments,
  selectedCommentId,
  onContentChange,
  onSelectComment,
  onCreateComment,
}) => {
  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="text-gray-500 text-sm mb-2">编辑器区域</div>
      <div className="text-gray-400 text-xs">
        <p>文档内容长度: {plainText.length} 字符</p>
        <p>批注数量: {comments.length}</p>
        <p>选中批注: {selectedCommentId || '无'}</p>
      </div>
      <textarea
        className="w-full h-64 mt-4 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={plainText}
        onChange={(e) => onContentChange(content, e.target.value)}
        placeholder="在此输入文档内容..."
      />
    </div>
  );
};

export default Editor;
