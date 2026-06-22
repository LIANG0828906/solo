import React, { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getUserById, createExchangeRequest } from '../../shared/dataStore';
import { addRipple } from '../../shared/utils';
import type { Book } from '../../shared/dataStore';

interface ExchangeModalProps {
  book: Book;
  onClose: () => void;
}

export default function ExchangeModal({ book, onClose }: ExchangeModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [desiredBook, setDesiredBook] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const owner = getUserById(book.ownerId);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    createExchangeRequest(book.id, user.id, book.ownerId, message.trim(), desiredBook.trim());
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
        <div className="modal-content">
          <div className="modal-title">交换请求已发送</div>
          <p style={{ textAlign: 'center', color: 'var(--color-brown-light)', marginBottom: 24 }}>
            你的交换请求已发送给 {owner?.nickname}，请耐心等待对方确认。
            书籍状态已更新为"交换中"。
          </p>
          <div style={{ textAlign: 'center' }}>
            <button
              className="btn-primary"
              onClick={onClose}
              onMouseDown={addRipple}
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-title">发起交换</div>

        <div className="modal-parties">
          <div className="modal-party">
            <div className="modal-party-name">{user?.nickname}</div>
            <div className="modal-party-role">请求方</div>
          </div>
          <div className="modal-arrow">⇄</div>
          <div className="modal-party">
            <div className="modal-party-name">{owner?.nickname}</div>
            <div className="modal-party-role">书籍主人</div>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          marginBottom: 20,
          padding: '12px',
          background: 'var(--color-cream)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.9rem',
        }}>
          <strong>{book.title}</strong>
          <span style={{ color: 'var(--color-brown-light)', marginLeft: 8 }}>{book.exchangeType}</span>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>留言 *</label>
            <textarea
              className="form-input"
              placeholder="对书籍主人说点什么..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="form-group">
            <label>期望换得的书（可选）</label>
            <input
              type="text"
              className="form-input"
              placeholder="你希望交换的书名..."
              value={desiredBook}
              onChange={(e) => setDesiredBook(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              onMouseDown={addRipple}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!message.trim()}
              onMouseDown={addRipple}
            >
              确认交换
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
