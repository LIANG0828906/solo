import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Trophy, Tag, MessageCircle, Send, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore, generateId } from '../store';
import type { Answer } from '../types';

interface AnswerItemProps {
  answer: Answer;
  questionId: string;
  depth?: number;
}

const AnswerItem: React.FC<AnswerItemProps> = ({ answer, questionId, depth = 0 }) => {
  const voteAnswer = useStore(state => state.voteAnswer);
  const setBestAnswer = useStore(state => state.setBestAnswer);
  const addAnswer = useStore(state => state.addAnswer);
  
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [upvoteAnimating, setUpvoteAnimating] = useState(false);
  const [downvoteAnimating, setDownvoteAnimating] = useState(false);
  const [displayUpvotes, setDisplayUpvotes] = useState(answer.upvotes);
  const [trophyAnimating, setTrophyAnimating] = useState(answer.isBest);

  const handleUpvote = () => {
    setUpvoteAnimating(true);
    voteAnswer(questionId, answer.id, 'up');
    setDisplayUpvotes(prev => prev + 1);
    setTimeout(() => setUpvoteAnimating(false), 400);
  };

  const handleDownvote = () => {
    setDownvoteAnimating(true);
    voteAnswer(questionId, answer.id, 'down');
    setTimeout(() => setDownvoteAnimating(false), 400);
  };

  const handleSetBest = () => {
    setTrophyAnimating(true);
    setBestAnswer(questionId, answer.id);
    toast.success('已设为最佳答案！');
  };

  const handleReply = () => {
    if (!replyContent.trim()) {
      toast.error('请输入回复内容');
      return;
    }
    const newReply: Answer = {
      id: generateId(),
      questionId,
      content: replyContent.trim(),
      parentId: answer.id,
      upvotes: 0,
      downvotes: 0,
      isBest: false,
      createdAt: new Date().toISOString()
    };
    addAnswer(questionId, newReply);
    setReplyContent('');
    setShowReplyInput(false);
    toast.success('回复成功！');
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: answer.isBest 
      ? '0 0 0 2px #ffc107, 0px 4px 12px rgba(255, 193, 7, 0.2)' 
      : '0px 2px 4px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s ease',
    position: 'relative'
  };

  const upvoteButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: upvoteAnimating ? '#1976d2' : '#e3f2fd',
    color: upvoteAnimating ? '#ffffff' : '#1976d2',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.3s ease',
    transform: upvoteAnimating ? 'scale(1.05)' : 'scale(1)'
  };

  const downvoteButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: downvoteAnimating ? '#d32f2f' : '#ffebee',
    color: downvoteAnimating ? '#ffffff' : '#d32f2f',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.3s ease',
    transform: downvoteAnimating ? 'scale(1.05)' : 'scale(1)'
  };

  const trophyStyles: React.CSSProperties = {
    color: '#ffc107',
    filter: trophyAnimating ? 'drop-shadow(0 0 8px #ffc107)' : 'none',
    animation: trophyAnimating ? 'trophySpin 1.5s ease-in-out' : 'none'
  };

  return (
    <>
      <style>{`
        @keyframes trophySpin {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(1.2); }
          50% { transform: rotate(15deg) scale(1.2); }
          75% { transform: rotate(-10deg) scale(1.1); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <div style={{ marginLeft: depth > 0 ? '32px' : 0, marginTop: depth > 0 ? '16px' : 0 }}>
        <div style={cardStyles}>
          {answer.isBest && (
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '16px',
              background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
              color: '#ffffff',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.4)'
            }}>
              <Trophy size={14} style={trophyStyles} />
              最佳答案
            </div>
          )}

          <p style={{ 
            fontSize: '15px', 
            color: '#5d4037', 
            lineHeight: '1.7', 
            margin: 0,
            marginBottom: '16px'
          }}>
            {answer.content}
          </p>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '12px',
            color: '#a1887f',
            marginBottom: '16px'
          }}>
            <Clock size={14} />
            <span>{new Date(answer.createdAt).toLocaleString('zh-CN')}</span>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button onClick={handleUpvote} style={upvoteButtonStyles}>
              <ThumbsUp size={16} />
              <span style={{ 
                transition: 'transform 0.3s ease',
                transform: upvoteAnimating ? 'translateY(-2px)' : 'translateY(0)'
              }}>
                {displayUpvotes}
              </span>
            </button>

            <button onClick={handleDownvote} style={downvoteButtonStyles}>
              <ThumbsDown size={16} />
              <span>{answer.downvotes}</span>
            </button>

            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#fff3e0',
                color: '#e65100',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffe0b2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff3e0';
              }}
            >
              <MessageCircle size={16} />
              回复
            </button>

            {!answer.parentId && !answer.isBest && (
              <button
                onClick={handleSetBest}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fff8e1',
                  color: '#f57f17',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  marginLeft: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffecb3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff8e1';
                }}
              >
                <Trophy size={16} />
                设为最佳答案
              </button>
            )}
          </div>

          {showReplyInput && (
            <div style={{ marginTop: '16px' }}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="写下你的回复..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ffcc80',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  color: '#5d4037',
                  outline: 'none',
                  resize: 'vertical',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#e65100';
                  e.target.style.boxShadow = '0px 4px 12px rgba(230, 81, 0, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ffcc80';
                  e.target.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.04)';
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={handleReply}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    backgroundColor: '#e65100',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0px 2px 4px rgba(230, 81, 0, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0px 4px 12px rgba(230, 81, 0, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.backgroundColor = '#bf360c';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0px 2px 4px rgba(230, 81, 0, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundColor = '#e65100';
                  }}
                >
                  <Send size={16} />
                  发送回复
                </button>
              </div>
            </div>
          )}
        </div>

        {answer.replies?.map(reply => (
          <AnswerItem key={reply.id} answer={reply} questionId={questionId} depth={depth + 1} />
        ))}
      </div>
    </>
  );
};

export const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const getQuestion = useStore(state => state.getQuestion);
  const getAnswers = useStore(state => state.getAnswers);
  const addAnswer = useStore(state => state.addAnswer);
  
  const [newAnswerContent, setNewAnswerContent] = useState('');
  
  const question = id ? getQuestion(id) : undefined;
  const answers = id ? getAnswers(id) : [];

  const bestAnswers = answers.filter(a => a.isBest);
  const regularAnswers = answers.filter(a => !a.isBest).sort((a, b) => b.upvotes - a.upvotes);
  const sortedAnswers = [...bestAnswers, ...regularAnswers];

  const handleSubmitAnswer = () => {
    if (!newAnswerContent.trim() || !id) {
      toast.error('请输入回答内容');
      return;
    }
    const newAnswer: Answer = {
      id: generateId(),
      questionId: id,
      content: newAnswerContent.trim(),
      parentId: null,
      upvotes: 0,
      downvotes: 0,
      isBest: false,
      createdAt: new Date().toISOString()
    };
    addAnswer(id, newAnswer);
    setNewAnswerContent('');
    toast.success('回答发布成功！');
  };

  if (!question) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '80px 24px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#bf360c', marginBottom: '12px' }}>问题不存在</h2>
        <p style={{ color: '#8d6e63' }}>该问题可能已被删除或不存在。</p>
      </div>
    );
  }

  const tagStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#fff3e0',
    color: '#e65100',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500'
  };

  const statusStyles: Record<string, React.CSSProperties> = {
    pending: { backgroundColor: '#fff3e0', color: '#f57c00' },
    answered: { backgroundColor: '#e3f2fd', color: '#1976d2' },
    resolved: { backgroundColor: '#e8f5e9', color: '#388e3c' }
  };

  const statusText: Record<string, string> = {
    pending: '等待回答',
    answered: '已有回答',
    resolved: '已解决'
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            ...statusStyles[question.status]
          }}>
            {statusText[question.status]}
          </span>
          <span style={{ fontSize: '13px', color: '#a1887f' }}>
            {new Date(question.createdAt).toLocaleString('zh-CN')}
          </span>
        </div>

        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#bf360c', 
          margin: 0,
          marginBottom: '16px',
          lineHeight: '1.3'
        }}>
          {question.title}
        </h1>

        <p style={{ 
          fontSize: '15px', 
          color: '#5d4037', 
          lineHeight: '1.8',
          marginBottom: '20px'
        }}>
          {question.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {question.tags.map(tag => (
            <span key={tag} style={tagStyles}>
              <Tag size={14} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
        marginBottom: '24px'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '700', 
          color: '#bf360c', 
          margin: 0,
          marginBottom: '16px'
        }}>
          写一个回答
        </h3>
        <textarea
          value={newAnswerContent}
          onChange={(e) => setNewAnswerContent(e.target.value)}
          placeholder="分享你的知识和经验..."
          rows={5}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ffcc80',
            backgroundColor: '#fffaf0',
            fontSize: '14px',
            color: '#5d4037',
            outline: 'none',
            resize: 'vertical',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            marginBottom: '12px'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#e65100';
            e.target.style.boxShadow = '0px 4px 12px rgba(230, 81, 0, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#ffcc80';
            e.target.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.04)';
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSubmitAnswer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              borderRadius: '8px',
              backgroundColor: '#e65100',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'all 0.2s ease',
              boxShadow: '0px 2px 4px rgba(230, 81, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0px 4px 12px rgba(230, 81, 0, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.backgroundColor = '#bf360c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0px 2px 4px rgba(230, 81, 0, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = '#e65100';
            }}
          >
            <Send size={18} />
            发布回答
          </button>
        </div>
      </div>

      <div>
        <h2 style={{ 
          fontSize: '22px', 
          fontWeight: '700', 
          color: '#bf360c', 
          margin: 0,
          marginBottom: '20px'
        }}>
          {answers.length} 个回答
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedAnswers.map(answer => (
            <AnswerItem key={answer.id} answer={answer} questionId={question.id} />
          ))}
        </div>
        {answers.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            backgroundColor: '#fffaf0',
            borderRadius: '12px',
            color: '#a1887f'
          }}>
            <p style={{ fontSize: '16px', margin: 0 }}>暂无回答，成为第一个回答者吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};
