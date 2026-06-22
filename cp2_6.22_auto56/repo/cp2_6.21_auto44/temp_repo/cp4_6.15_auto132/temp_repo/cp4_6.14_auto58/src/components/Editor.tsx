import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EditorState, ContentState, convertFromRaw, convertToRaw, Modifier, SelectionState, CompositeDecorator, DraftDecoratorComponentProps } from 'draft-js';
import { Editor as DraftWysiwygEditor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { MessageSquare } from 'lucide-react';
import type { Comment } from '../types';

interface EditorProps {
  contentState: string;
  comments: Comment[];
  currentUser: string;
  onContentChange: (content: string, plainText: string) => void;
  onAddComment: (text: string, startOffset: number, endOffset: number, content: string) => void;
  onCommentClick: (commentId: string) => void;
  selectedCommentId: string | null;
}

interface CommentDecoratorProps extends DraftDecoratorComponentProps {
  comment: Comment;
  onClick: (commentId: string) => void;
  isSelected: boolean;
}

const CommentHighlight: React.FC<CommentDecoratorProps> = ({ children, comment, onClick, isSelected }) => {
  const bgColor = comment.resolved ? '#bbf7d0' : '#fef08a';
  const borderColor = isSelected ? '#3b82f6' : 'transparent';

  return (
    <span
      style={{
        backgroundColor: bgColor,
        borderRadius: '3px',
        padding: '1px 2px',
        cursor: 'pointer',
        borderBottom: `2px solid ${borderColor}`,
        transition: 'all 0.2s ease',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(comment.id);
      }}
    >
      {children}
    </span>
  );
};

const createCommentDecorator = (
  comments: Comment[],
  onCommentClick: (commentId: string) => void,
  selectedCommentId: string | null
) => {
  const decorators = comments.map((comment) => ({
    strategy: (
      contentBlock: { getText: () => string },
      callback: (start: number, end: number) => void,
      contentState: ContentState
    ) => {
      const blockKey = contentBlock.getKey?.() || '';
      const blockMap = contentState.getBlockMap();
      let currentOffset = 0;
      let foundBlock = false;

      blockMap.forEach((block) => {
        if (foundBlock) return;
        const blockText = block?.getText() || '';
        const blockLength = blockText.length + 1;

        if (comment.startOffset >= currentOffset && comment.startOffset < currentOffset + blockLength) {
          const blockStart = comment.startOffset - currentOffset;
          const blockEnd = Math.min(comment.endOffset - currentOffset, blockText.length);
          if (blockStart < blockEnd) {
            callback(blockStart, blockEnd);
          }
          foundBlock = true;
        }
        currentOffset += blockLength;
      });
    },
    component: (props: DraftDecoratorComponentProps) => (
      <CommentHighlight
        {...props}
        comment={comment}
        onClick={onCommentClick}
        isSelected={selectedCommentId === comment.id}
      />
    ),
  }));

  return new CompositeDecorator(decorators);
};

const getPlainTextFromContentState = (contentState: ContentState): string => {
  return contentState.getBlocksAsArray()
    .map((block) => block.getText())
    .join('\n');
};

const getSelectionOffsets = (editorState: EditorState): { start: number; end: number; text: string } | null => {
  const selection = editorState.getSelection();
  if (selection.isCollapsed()) return null;

  const contentState = editorState.getCurrentContent();
  const startKey = selection.getStartKey();
  const endKey = selection.getEndKey();
  const startOffset = selection.getStartOffset();
  const endOffset = selection.getEndOffset();

  const blockMap = contentState.getBlockMap();
  let currentOffset = 0;
  let start = 0;
  let end = 0;
  let foundStart = false;

  blockMap.forEach((block) => {
    const blockKey = block?.getKey() || '';
    const blockText = block?.getText() || '';
    const blockLength = blockText.length + 1;

    if (blockKey === startKey) {
      start = currentOffset + startOffset;
      foundStart = true;
    }
    if (blockKey === endKey) {
      end = currentOffset + endOffset;
    }
    currentOffset += blockLength;
  });

  if (!foundStart) return null;

  const selectedText = contentState.getPlainText().slice(start, end);

  return { start, end, text: selectedText };
};

const Editor: React.FC<EditorProps> = ({
  contentState,
  comments,
  currentUser,
  onContentChange,
  onAddComment,
  onCommentClick,
  selectedCommentId,
}) => {
  const [editorState, setEditorState] = useState<EditorState>(() => {
    try {
      const rawContent = JSON.parse(contentState);
      const content = convertFromRaw(rawContent);
      const decorator = createCommentDecorator(comments, onCommentClick, selectedCommentId);
      return EditorState.createWithContent(content, decorator);
    } catch {
      const decorator = createCommentDecorator(comments, onCommentClick, selectedCommentId);
      return EditorState.createEmpty(decorator);
    }
  });

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentInputValue, setCommentInputValue] = useState('');
  const [commentPosition, setCommentPosition] = useState({ top: 0, left: 0 });
  const commentInputRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<{ start: number; end: number; text: string } | null>(null);

  useEffect(() => {
    try {
      const rawContent = JSON.parse(contentState);
      const content = convertFromRaw(rawContent);
      const decorator = createCommentDecorator(comments, onCommentClick, selectedCommentId);
      const newEditorState = EditorState.createWithContent(content, decorator);
      setEditorState(newEditorState);
    } catch {
      // 忽略解析错误
    }
  }, [contentState, comments, selectedCommentId, onCommentClick]);

  const handleEditorChange = useCallback((newEditorState: EditorState) => {
    setEditorState(newEditorState);

    const contentState = newEditorState.getCurrentContent();
    const rawContent = JSON.stringify(convertToRaw(contentState));
    const plainText = getPlainTextFromContentState(contentState);

    onContentChange(rawContent, plainText);
  }, [onContentChange]);

  const handleAddCommentClick = useCallback(() => {
    const selection = getSelectionOffsets(editorState);
    if (!selection || selection.start === selection.end) {
      return;
    }

    savedSelectionRef.current = selection;

    const selectionState = window.getSelection();
    if (selectionState && selectionState.rangeCount > 0) {
      const range = selectionState.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();

      if (editorRect) {
        setCommentPosition({
          top: rect.bottom - editorRect.top + 8,
          left: rect.left - editorRect.left,
        });
      }
    }

    setShowCommentInput(true);
    setCommentInputValue('');
  }, [editorState]);

  useEffect(() => {
    if (showCommentInput && commentInputRef.current) {
      const input = commentInputRef.current.querySelector('textarea, input');
      if (input) {
        (input as HTMLElement).focus();
      }
    }
  }, [showCommentInput]);

  const handleCommentSubmit = useCallback(() => {
    if (!commentInputValue.trim() || !savedSelectionRef.current) {
      setShowCommentInput(false);
      return;
    }

    const { start, end, text } = savedSelectionRef.current;
    onAddComment(text, start, end, commentInputValue.trim());

    setShowCommentInput(false);
    setCommentInputValue('');
    savedSelectionRef.current = null;
  }, [commentInputValue, onAddComment]);

  const handleCommentCancel = useCallback(() => {
    setShowCommentInput(false);
    setCommentInputValue('');
    savedSelectionRef.current = null;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        commentInputRef.current &&
        !commentInputRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.rdw-comment-wrapper')
      ) {
        handleCommentCancel();
      }
    };

    if (showCommentInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCommentInput, handleCommentCancel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          const newStateBold = Modifier.toggleInlineStyle(
            editorState.getCurrentContent(),
            editorState.getSelection(),
            'BOLD'
          );
          handleEditorChange(
            EditorState.push(editorState, newStateBold, 'change-inline-style')
          );
          break;
        case 'i':
          e.preventDefault();
          const newStateItalic = Modifier.toggleInlineStyle(
            editorState.getCurrentContent(),
            editorState.getSelection(),
            'ITALIC'
          );
          handleEditorChange(
            EditorState.push(editorState, newStateItalic, 'change-inline-style')
          );
          break;
        case 'u':
          e.preventDefault();
          const newStateUnderline = Modifier.toggleInlineStyle(
            editorState.getCurrentContent(),
            editorState.getSelection(),
            'UNDERLINE'
          );
          handleEditorChange(
            EditorState.push(editorState, newStateUnderline, 'change-inline-style')
          );
          break;
      }
    }
  }, [editorState, handleEditorChange]);

  const CommentButton = () => (
    <div
      className="rdw-option-wrapper rdw-comment-wrapper"
      onClick={handleAddCommentClick}
      title="添加批注"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        cursor: 'pointer',
        padding: '0 8px',
      }}
    >
      <MessageSquare size={18} className="text-gray-600" />
    </div>
  );

  const toolbarConfig = {
    options: ['inline', 'blockType', 'list', 'custom'],
    inline: {
      options: ['bold', 'italic', 'underline'],
    },
    blockType: {
      options: ['H1', 'H2', 'H3', 'Blockquote', 'Code'],
    },
    list: {
      options: ['unordered', 'ordered'],
    },
    custom: {
      components: [<CommentButton key="comment" />],
    },
  };

  return (
    <div
      ref={editorRef}
      className="editor-container"
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        position: 'relative',
      }}
      onKeyDown={handleKeyDown}
    >
      <style>{`
        .rdw-editor-toolbar {
          background-color: #f1f5f9 !important;
          border-radius: 8px !important;
          border: none !important;
          margin: 8px !important;
          padding: 4px 8px !important;
          position: sticky !important;
          top: 8px !important;
          z-index: 10 !important;
        }
        .rdw-editor-main {
          padding: 0 16px 16px 16px !important;
          min-height: 400px !important;
        }
        .rdw-option-wrapper {
          border: none !important;
          background: transparent !important;
          padding: 4px 6px !important;
          border-radius: 4px !important;
          margin: 0 2px !important;
        }
        .rdw-option-wrapper:hover {
          background-color: #e2e8f0 !important;
          box-shadow: none !important;
        }
        .rdw-option-active {
          background-color: #dbeafe !important;
          color: #2563eb !important;
        }
        .rdw-dropdown-wrapper {
          border: none !important;
          background: transparent !important;
          border-radius: 4px !important;
        }
        .rdw-dropdown-wrapper:hover {
          background-color: #e2e8f0 !important;
          box-shadow: none !important;
        }
        .comment-input-wrapper {
          position: absolute;
          z-index: 100;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .public-DraftEditor-content {
          min-height: 400px;
        }
      `}</style>

      <DraftWysiwygEditor
        editorState={editorState}
        onEditorStateChange={handleEditorChange}
        toolbar={toolbarConfig}
        wrapperClassName="editor-wrapper"
        editorClassName="editor-content"
        toolbarClassName="editor-toolbar"
      />

      {showCommentInput && (
        <div
          ref={commentInputRef}
          className="comment-input-wrapper"
          style={{
            top: commentPosition.top,
            left: commentPosition.left,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '12px',
              border: '1px solid #e2e8f0',
              width: '280px',
            }}
          >
            <textarea
              value={commentInputValue}
              onChange={(e) => setCommentInputValue(e.target.value)}
              placeholder="输入批注内容..."
              style={{
                width: '100%',
                minHeight: '80px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleCommentSubmit();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCommentCancel();
                }
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              <button
                onClick={handleCommentCancel}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={!commentInputValue.trim()}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: commentInputValue.trim() ? '#3b82f6' : '#93c5fd',
                  color: 'white',
                  cursor: commentInputValue.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
