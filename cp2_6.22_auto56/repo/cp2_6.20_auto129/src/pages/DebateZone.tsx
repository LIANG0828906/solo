import React, { useEffect, useState, useRef } from 'react';
import { Card, Avatar, Button, Spin, Empty, Input, Tag } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  LikeOutlined,
  DislikeOutlined
} from '@ant-design/icons';
import { useDebateStore } from '../stores/debateStore';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import './DebateZone.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { TextArea } = Input;

const DebateZone: React.FC = () => {
  const { debates, currentDebate, isLoading, activeSide, fetchDebates, fetchDebateById, sendMessage, setActiveSide } = useDebateStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchDebateById(id);
    } else {
      fetchDebates();
    }
  }, [id, fetchDebates, fetchDebateById]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentDebate?.proMessages, currentDebate?.conMessages]);

  const handleSendMessage = () => {
    if (!message.trim() || !activeSide || !currentDebate) return;
    sendMessage(currentDebate.id, activeSide, message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading && debates.length === 0 && !currentDebate) {
    return (
      <div className="debate-zone">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (id && currentDebate) {
    const allMessages = [
      ...currentDebate.proMessages.map((m) => ({ ...m, side: 'pro' as const })),
      ...currentDebate.conMessages.map((m) => ({ ...m, side: 'con' as const }))
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return (
      <div className="debate-zone">
        <div className="debate-detail-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/debate')}
            className="back-btn"
          >
            返回辩论列表
          </Button>
          <h1 className="debate-detail-title">{currentDebate.title}</h1>
          <div className="debate-meta">
            <Tag icon={<UserOutlined />} color="blue">
              {currentDebate.initiator?.nickname}
            </Tag>
            <Tag icon={<TeamOutlined />} color="green">
              {currentDebate.participantCount} 人参与
            </Tag>
            <Tag icon={<ClockCircleOutlined />} color="orange">
              {dayjs(currentDebate.lastReplyAt).fromNow()}
            </Tag>
          </div>
        </div>

        <div className="debate-arena">
          <div className="debate-side pro-side">
            <div className="side-header pro-header">
              <LikeOutlined className="side-icon" />
              <span>正方观点</span>
              <Button
                type={activeSide === 'pro' ? 'primary' : 'default'}
                size="small"
                onClick={() => setActiveSide(activeSide === 'pro' ? null : 'pro')}
                className="join-btn"
              >
                {activeSide === 'pro' ? '已加入' : '加入正方'}
              </Button>
            </div>
            <div className="messages-container">
              {currentDebate.proMessages.map((msg) => (
                <div key={msg.id} className="message-bubble pro-bubble message-enter">
                  <Avatar src={msg.user?.avatar} size={32}>
                    {msg.user?.nickname?.charAt(0)}
                  </Avatar>
                  <div className="message-content">
                    <div className="message-username">{msg.user?.nickname}</div>
                    <div className="message-text">{msg.content}</div>
                    <div className="message-time">{dayjs(msg.createdAt).format('HH:mm')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="debate-divider">
            <div className="vs-text">VS</div>
          </div>

          <div className="debate-side con-side">
            <div className="side-header con-header">
              <DislikeOutlined className="side-icon" />
              <span>反方观点</span>
              <Button
                type={activeSide === 'con' ? 'primary' : 'default'}
                size="small"
                danger
                onClick={() => setActiveSide(activeSide === 'con' ? null : 'con')}
                className="join-btn"
              >
                {activeSide === 'con' ? '已加入' : '加入反方'}
              </Button>
            </div>
            <div className="messages-container">
              {currentDebate.conMessages.map((msg) => (
                <div key={msg.id} className="message-bubble con-bubble message-enter">
                  <Avatar src={msg.user?.avatar} size={32}>
                    {msg.user?.nickname?.charAt(0)}
                  </Avatar>
                  <div className="message-content">
                    <div className="message-username">{msg.user?.nickname}</div>
                    <div className="message-text">{msg.content}</div>
                    <div className="message-time">{dayjs(msg.createdAt).format('HH:mm')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div ref={messagesEndRef} />

        <div className="debate-input-area">
          <TextArea
            placeholder={activeSide ? `以${activeSide === 'pro' ? '正方' : '反方'}身份发言，支持 @ 提及用户...` : '请先选择加入正方或反方'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!activeSide}
            autoSize={{ minRows: 2, maxRows: 4 }}
            className="debate-input"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!activeSide || !message.trim()}
            className="send-btn"
          >
            发送
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="debate-zone">
      <div className="debate-header">
        <h1 className="debate-title">辩论区</h1>
      </div>

      {debates.length === 0 ? (
        <Empty description="暂无辩论话题" />
      ) : (
        <div className="debate-list">
          {debates.map((debate) => (
            <Card
              key={debate.id}
              hoverable
              className="debate-card"
              onClick={() => navigate(`/debate/${debate.id}`)}
              styles={{ body: { padding: '24px' } }}
            >
              <div className="debate-card-header">
                <h3 className="debate-card-title">{debate.title}</h3>
              </div>
              <div className="debate-card-footer">
                <div className="debate-card-info">
                  <Avatar src={debate.initiator?.avatar} size={24}>
                    {debate.initiator?.nickname?.charAt(0)}
                  </Avatar>
                  <span className="initiator-name">{debate.initiator?.nickname}</span>
                </div>
                <div className="debate-card-stats">
                  <span className="stat-item">
                    <TeamOutlined /> {debate.participantCount} 人参与
                  </span>
                  <span className="stat-item">
                    <ClockCircleOutlined /> {dayjs(debate.lastReplyAt).fromNow()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebateZone;
