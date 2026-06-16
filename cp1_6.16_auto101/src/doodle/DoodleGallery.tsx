import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Heart, X, Send, MessageCircle } from 'lucide-react'
import type { Doodle, Comment } from '../types'
import './DoodleGallery.css'

interface DoodleGalleryProps {
  bookId: string
}

export function DoodleGallery({ bookId }: DoodleGalleryProps) {
  const doodles = useAppStore(state => state.doodles)
  const likeDoodle = useAppStore(state => state.likeDoodle)
  const addComment = useAppStore(state => state.addComment)
  
  const [selectedDoodle, setSelectedDoodle] = useState<Doodle | null>(null)
  const [commentText, setCommentText] = useState('')
  
  const bookDoodles = doodles.filter(d => d.bookId === bookId)
  
  const handleLike = (doodleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    likeDoodle(doodleId)
    if (selectedDoodle?.id === doodleId) {
      const updated = doodles.find(d => d.id === doodleId)
      if (updated) {
        setSelectedDoodle({ ...updated, likes: updated.likes + 1 })
      }
    }
  }
  
  const handleViewDoodle = (doodle: Doodle) => {
    setSelectedDoodle(doodle)
    setCommentText('')
  }
  
  const handleCloseModal = () => {
    setSelectedDoodle(null)
    setCommentText('')
  }
  
  const handleSubmitComment = () => {
    if (!selectedDoodle || !commentText.trim()) return
    if (commentText.length > 50) return
    
    addComment(selectedDoodle.id, commentText.trim())
    
    const updatedDoodle = doodles.find(d => d.id === selectedDoodle.id)
    if (updatedDoodle) {
      const newComment: Comment = {
        id: 'temp-' + Date.now(),
        content: commentText.trim(),
        createdAt: new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      setSelectedDoodle({
        ...updatedDoodle,
        comments: [newComment, ...updatedDoodle.comments]
      })
    }
    
    setCommentText('')
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }
  
  if (bookDoodles.length === 0) {
    return (
      <div className="doodle-gallery-empty">
        <div className="empty-icon">🎨</div>
        <p>还没有涂鸦作品，快来创作第一幅吧！</p>
      </div>
    )
  }
  
  return (
    <div className="doodle-gallery">
      <div className="gallery-grid">
        {bookDoodles.map(doodle => (
          <div
            key={doodle.id}
            className="gallery-item"
            onClick={() => handleViewDoodle(doodle)}
          >
            <img
              src={doodle.imageData}
              alt="涂鸦作品"
              className="gallery-thumbnail"
            />
            <div className="gallery-overlay">
              <div className="gallery-like">
                <Heart size={16} fill="currentColor" />
                <span>{doodle.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedDoodle && (
        <div className="doodle-modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              <X size={24} />
            </button>
            
            <div className="modal-image-wrapper">
              <img
                src={selectedDoodle.imageData}
                alt="涂鸦大图"
                className="modal-image"
              />
            </div>
            
            <div className="modal-actions">
              <button
                className="like-btn"
                onClick={(e) => handleLike(selectedDoodle.id, e)}
              >
                <Heart size={20} fill="currentColor" />
                <span>点赞 {selectedDoodle.likes}</span>
              </button>
            </div>
            
            <div className="modal-comments">
              <div className="comments-header">
                <MessageCircle size={18} />
                <span>评论 ({selectedDoodle.comments.length})</span>
              </div>
              
              <div className="comment-input-area">
                <input
                  type="text"
                  className="comment-input"
                  placeholder="说点什么吧（最多50字）..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={50}
                />
                <button
                  className="send-btn"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="char-count">{commentText.length}/50</div>
              
              <div className="comments-list">
                {selectedDoodle.comments.length === 0 ? (
                  <div className="no-comments">暂无评论，快来抢沙发吧~</div>
                ) : (
                  selectedDoodle.comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-avatar">🐱</div>
                      <div className="comment-body">
                        <div className="comment-content">{comment.content}</div>
                        <div className="comment-time">{comment.createdAt}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoodleGallery
