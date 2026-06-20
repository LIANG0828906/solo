import React, { useState } from 'react';
import { Button, Tag, Input, message, Card } from 'antd';
import { SendOutlined, PlusOutlined } from '@ant-design/icons';
import BookSearch from '../components/BookSearch';
import { Book } from '../types';
import { useReviewStore } from '../stores/reviewStore';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import './ReviewEditor.css';

const { TextArea } = Input;

const ReviewEditor: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { createReview } = useReviewStore();
  const navigate = useNavigate();

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag) return;
    if (tags.length >= 5) {
      message.warning('最多只能添加5个标签');
      return;
    }
    if (tags.includes(trimmedTag)) {
      message.warning('该标签已存在');
      return;
    }
    setTags([...tags, trimmedTag]);
    setTagInput('');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!selectedBook) {
      message.error('请先选择一本书');
      return;
    }
    if (!content.trim()) {
      message.error('请输入书评内容');
      return;
    }
    if (tags.length === 0) {
      message.warning('建议添加至少一个标签');
    }

    setSubmitting(true);
    try {
      const result = await createReview({
        bookIsbn: selectedBook.isbn,
        content: content.trim(),
        tags
      });
      if (result) {
        message.success('书评提交成功，正在审核中');
        navigate('/');
      }
    } catch (error) {
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const renderMarkdown = () => {
    if (!content) {
      return '<p class="preview-placeholder">开始输入内容，这里将实时预览...</p>';
    }
    return marked(content);
  };

  return (
    <div className="review-editor-page">
      <div className="editor-header">
        <h1 className="editor-title">撰写书评</h1>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={submitting}
          className="submit-btn"
        >
          提交书评
        </Button>
      </div>

      <div className="book-search-section">
        <Card className="book-info-card" bordered={false}>
          <div className="book-search-wrapper">
            <BookSearch onSelect={handleBookSelect} placeholder="搜索书籍名称或作者（至少3个字符）..." />
          </div>
          {selectedBook && (
            <div className="selected-book-info">
              <img src={selectedBook.cover} alt={selectedBook.title} className="selected-book-cover" />
              <div className="selected-book-meta">
                <h3 className="selected-book-title">{selectedBook.title}</h3>
                <p className="selected-book-author">作者：{selectedBook.author}</p>
                <p className="selected-book-isbn">ISBN：{selectedBook.isbn}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="editor-main">
        <div className="editor-left-panel">
          <Card className="tags-card" bordered={false} title="标签">
            <div className="tags-input-wrapper">
              <Input
                placeholder="输入标签后按回车添加"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                onPressEnter={handleAddTag}
                suffix={
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={handleAddTag}
                    disabled={tags.length >= 5}
                  />
                }
              />
            </div>
            <div className="tags-list">
              {tags.map((tag, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  className="editor-tag"
                >
                  {tag}
                </Tag>
              ))}
            </div>
            <p className="tags-hint">最多添加5个标签，已添加 {tags.length}/5</p>
          </Card>
        </div>

        <div className="editor-right-panel">
          <div className="editor-container">
            <div className="editor-section">
              <div className="section-title">编辑</div>
              <TextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="写下你的书评...&#10;&#10;支持 Markdown 语法"
                className="review-textarea"
                autoSize={{ minRows: 20, maxRows: 30 }}
              />
            </div>
            <div className="preview-section">
              <div className="section-title">预览</div>
              <div
                className="markdown-preview"
                dangerouslySetInnerHTML={{ __html: renderMarkdown() }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewEditor;
