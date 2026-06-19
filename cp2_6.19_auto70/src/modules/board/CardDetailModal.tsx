import { useState, useEffect } from 'react';
import { X, Plus, Type, Bold, Italic, List } from 'lucide-react';
import type { Card, Tag } from '@/types';
import useBoardStore from '@/store/boardStore';
import { Modal } from '@/components/Modal';
import { useClickOutside } from '@/hooks/useClickOutside';

interface CardDetailModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CardDetailModal({ card, isOpen, onClose }: CardDetailModalProps) {
  const { tags, updateCard, addTagToCard, removeTagFromCard } = useBoardStore();
  const [caption, setCaption] = useState('');
  const [note, setNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  
  const tagInputRef = useClickOutside<HTMLDivElement>(() => {
    setShowTagInput(false);
    setTagInput('');
    setTagSuggestions([]);
  }, showTagInput);

  useEffect(() => {
    if (card) {
      setCaption(card.caption);
      setNote(card.note);
    }
  }, [card]);

  const handleSave = () => {
    if (card) {
      updateCard(card.id, { caption, note });
    }
    onClose();
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    
    if (value.trim()) {
      const filtered = tags.filter(t => 
        t.name.toLowerCase().includes(value.toLowerCase()) &&
        !card?.tags.includes(t.name)
      );
      setTagSuggestions(filtered);
    } else {
      setTagSuggestions(tags.filter(t => !card?.tags.includes(t.name)));
    }
  };

  const handleAddTag = (tagName: string) => {
    if (card && card.tags.length < 3) {
      addTagToCard(card.id, tagName.trim());
    }
    setTagInput('');
    setShowTagInput(false);
    setTagSuggestions([]);
  };

  const handleRemoveTag = (tagId: string) => {
    if (card) {
      removeTagFromCard(card.id, tagId);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = document.querySelector('.note-edit-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = note.substring(start, end);
    const newContent = note.substring(0, start) + prefix + selectedText + suffix + note.substring(end);
    
    setNote(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const renderNote = (text: string) => {
    return text.split('\n').map((line, i) => {
      let formatted = line
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li>$1</li>');
      
      if (!/^<h[1-3]|<li>/.test(formatted)) {
        formatted = `<p>${formatted}</p>`;
      }
      
      return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  if (!card) return null;

  const cardTags = tags.filter(t => card.tags.includes(t.name));

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="900px">
      <div className="card-detail">
        <div className="detail-image-section">
          <img
            src={card.imageUrl}
            alt={card.caption || '素材大图'}
            className="detail-image"
          />
        </div>
        
        <div className="detail-info-section">
          <div className="detail-header">
            <input
              type="text"
              className="detail-caption-input"
              placeholder="添加标题..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={100}
            />
            <button className="detail-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          
          <div className="detail-tags">
            <div className="tags-list">
              {cardTags.map((tag) => (
                <span key={tag.id} className="detail-tag" style={{ backgroundColor: tag.color + '30', color: tag.color }}>
                  {tag.name}
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {cardTags.length < 3 && (
                showTagInput ? (
                  <div ref={tagInputRef} className="tag-input-wrapper">
                    <input
                      type="text"
                      className="tag-input"
                      placeholder="输入标签名"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      autoFocus
                      maxLength={20}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          handleAddTag(tagInput);
                        }
                      }}
                    />
                    {tagSuggestions.length > 0 && (
                      <div className="tag-suggestions">
                        {tagSuggestions.slice(0, 5).map((tag) => (
                          <button
                            key={tag.id}
                            className="tag-suggestion"
                            onClick={() => handleAddTag(tag.name)}
                            style={{ borderLeftColor: tag.color }}
                          >
                            <span
                              className="suggestion-dot"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </button>
                        ))}
                        {tagInput.trim() && !tags.some(t => t.name.toLowerCase() === tagInput.toLowerCase()) && (
                          <button
                            className="tag-suggestion create"
                            onClick={() => handleAddTag(tagInput)}
                          >
                            <Plus size={14} />
                            创建 "{tagInput}"
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className="add-tag-inline"
                    onClick={() => {
                      setShowTagInput(true);
                      setTagSuggestions(tags.filter(t => !card.tags.includes(t.name)));
                    }}
                  >
                    <Plus size={14} />
                    添加标签
                  </button>
                )
              )}
            </div>
          </div>
          
          <div className="detail-note">
            <div className="note-header">
              <span className="note-title">文字便签</span>
              <button
                className="note-edit-btn"
                onClick={() => setIsEditingNote(!isEditingNote)}
              >
                {isEditingNote ? '预览' : '编辑'}
              </button>
            </div>
            
            {isEditingNote ? (
              <div className="note-editor-inline">
                <div className="editor-toolbar-inline">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormatting('# ')}
                    title="标题"
                  >
                    <Type size={14} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormatting('**', '**')}
                    title="加粗"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormatting('*', '*')}
                    title="斜体"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => insertFormatting('- ')}
                    title="列表"
                  >
                    <List size={14} />
                  </button>
                </div>
                <textarea
                  className="note-edit-textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="写下你的想法，支持 Markdown 格式..."
                  autoFocus
                />
              </div>
            ) : (
              <div className="note-preview">
                {note ? (
                  renderNote(note)
                ) : (
                  <span className="note-empty-hint">点击编辑添加便签</span>
                )}
              </div>
            )}
          </div>
          
          <div className="detail-meta">
            <span className="meta-item">
              尺寸: {card.width} × {card.height}
            </span>
            <span className="meta-item">
              比例: {card.aspectRatio}
            </span>
            <span className="meta-item">
              创建于: {new Date(card.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
          
          <div className="detail-actions">
            <button className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button className="btn-primary" onClick={handleSave}>
              保存
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
