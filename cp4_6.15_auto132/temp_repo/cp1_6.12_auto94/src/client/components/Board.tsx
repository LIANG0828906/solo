import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card as CardType, Group, User } from '../../shared/types';
import Card from './Card';
import { ideasApi, voteApi } from '../services/api';
import { initSocket, joinTeam, leaveTeam, registerSocketHandlers, unregisterSocketHandlers } from '../services/socket';

interface BoardProps {
  teamName: string;
  user: User;
}

const Board: React.FC<BoardProps> = ({ teamName, user }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const groupAreaRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [votingActive, setVotingActive] = useState(false);
  const [votingRound, setVotingRound] = useState(0);
  const [sortedCards, setSortedCards] = useState<CardType[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardContent, setNewCardContent] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [votesRemaining, setVotesRemaining] = useState(user.votesRemaining);

  const [draggingCard, setDraggingCard] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const lastSyncTime = useRef<number>(0);
  const pendingPosition = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    initSocket();
    joinTeam(teamName, user.nickname, user.color, user.id);

    loadInitialData();

    const handlers = {
      onCardCreated: (card: CardType) => {
        setCards((prev) => [...prev, card]);
      },
      onCardPositionUpdated: (data: { id: string; x: number; y: number }) => {
        if (data.id !== draggingCard) {
          setCards((prev) =>
            prev.map((c) => (c.id === data.id ? { ...c, x: data.x, y: data.y } : c))
          );
        }
      },
      onCardGroupUpdated: (data: { id: string; groupId: string | null }) => {
        setCards((prev) =>
          prev.map((c) => (c.id === data.id ? { ...c, groupId: data.groupId } : c))
        );
      },
      onCardDeleted: (id: string) => {
        setCards((prev) => prev.filter((c) => c.id !== id));
      },
      onVoteUpdated: (data: { cardId: string; votes: number; userId: string; votesRemaining: number }) => {
        setCards((prev) =>
          prev.map((c) => {
            if (c.id === data.cardId) {
              const votedBy = c.votedBy.includes(data.userId)
                ? c.votedBy
                : [...c.votedBy, data.userId];
              return { ...c, votes: data.votes, votedBy };
            }
            return c;
          })
        );
        if (data.userId === user.id) {
          setVotesRemaining(data.votesRemaining);
        }
      },
      onVotingStarted: (data: { votingActive: boolean; votingRound: number; users: { id: string; votesRemaining: number }[] }) => {
        setVotingActive(data.votingActive);
        setVotingRound(data.votingRound);
        const currentUser = data.users.find((u) => u.id === user.id);
        if (currentUser) {
          setVotesRemaining(currentUser.votesRemaining);
        }
        setShowResults(false);
      },
      onVotingEnded: (data: { votingActive: boolean; sortedCards: CardType[] }) => {
        setVotingActive(data.votingActive);
        setSortedCards(data.sortedCards);
        setShowResults(true);
      },
      onUserJoined: (newUser: User) => {
        setUsers((prev) => {
          if (prev.find((u) => u.id === newUser.id)) return prev;
          return [...prev, newUser];
        });
      },
      onUserLeft: (userId: string) => {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      },
      onGroupCreated: (group: Group) => {
        setGroups((prev) => [...prev, group]);
      },
      onGroupUpdated: (group: Group) => {
        setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
      },
      onGroupDeleted: (id: string) => {
        setGroups((prev) => prev.filter((g) => g.id !== id));
      },
      onTeamState: (state: { cards: CardType[]; groups: Group[]; users: User[]; votingActive: boolean; votingRound: number }) => {
        setCards(state.cards);
        setGroups(state.groups);
        setUsers(state.users);
        setVotingActive(state.votingActive);
        setVotingRound(state.votingRound);
        const currentUser = state.users.find((u) => u.id === user.id);
        if (currentUser) {
          setVotesRemaining(currentUser.votesRemaining);
        }
      },
    };

    registerSocketHandlers(handlers);

    return () => {
      unregisterSocketHandlers(handlers);
      leaveTeam(teamName, user.id);
    };
  }, [teamName, user.id, user.nickname, user.color, draggingCard]);

  const loadInitialData = async () => {
    try {
      const data = await ideasApi.getCards(teamName);
      setCards(data.cards);
      setGroups(data.groups);
      setVotingActive(data.votingActive);
      setVotingRound(data.votingRound);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleAddCard = () => {
    setIsAddingCard(true);
    setNewCardContent('');
  };

  const handleSaveCard = async () => {
    if (!newCardContent.trim()) return;

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    const x = boardRect.width / 2 - 100;
    const y = boardRect.height / 2 - 60;

    try {
      await ideasApi.createCard({
        content: newCardContent.trim(),
        author: user.nickname,
        authorColor: user.color,
        teamName,
        x,
        y,
      });
    } catch (error) {
      console.error('Failed to create card:', error);
    }

    setIsAddingCard(false);
    setNewCardContent('');
  };

  const handleDragStart = useCallback((e: React.MouseEvent, cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    setDraggingCard(cardId);

    dragOffset.current = {
      x: e.clientX - card.x,
      y: e.clientY - card.y,
    };
  }, [cards]);

  useEffect(() => {
    if (!draggingCard) return;

    const handleMouseMove = (e: MouseEvent) => {
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (!boardRect) return;

      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      newX = Math.max(0, Math.min(newX, boardRect.width - 200));
      newY = Math.max(0, Math.min(newY, boardRect.height - 120));

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      pendingPosition.current = { x: newX, y: newY };

      rafId.current = requestAnimationFrame(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === draggingCard
              ? { ...c, x: pendingPosition.current!.x, y: pendingPosition.current!.y }
              : c
          )
        );
        rafId.current = null;
      });

      const now = Date.now();
      if (now - lastSyncTime.current > 50) {
        lastSyncTime.current = now;
        ideasApi.updatePosition(draggingCard, newX, newY, teamName).catch(() => {});
      }
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (!draggingCard) return;

      setDraggingCard(null);

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      const groupRect = groupAreaRef.current?.getBoundingClientRect();
      const boardRect = boardRef.current?.getBoundingClientRect();

      if (groupRect && boardRect) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        if (
          mouseX >= groupRect.left &&
          mouseX <= groupRect.right &&
          mouseY >= groupRect.top &&
          mouseY <= groupRect.bottom
        ) {
          const defaultGroup = groups[0];
          if (defaultGroup) {
            try {
              await ideasApi.updateGroup(draggingCard, defaultGroup.id, teamName);
            } catch (error) {
              console.error('Failed to update group:', error);
            }
          }
        } else {
          const card = cards.find((c) => c.id === draggingCard);
          if (card?.groupId) {
            try {
              await ideasApi.updateGroup(draggingCard, null, teamName);
            } catch (error) {
              console.error('Failed to remove from group:', error);
            }
          }
        }
      }

      if (pendingPosition.current) {
        try {
          await ideasApi.updatePosition(
            draggingCard,
            pendingPosition.current.x,
            pendingPosition.current.y,
            teamName
          );
        } catch (error) {
          console.error('Failed to sync position:', error);
        }
        pendingPosition.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [draggingCard, teamName, groups, cards]);

  const handleVote = async (cardId: string) => {
    if (!votingActive || votesRemaining <= 0) return;

    try {
      await voteApi.vote(cardId, user.id, teamName);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleStartVoting = async () => {
    try {
      await voteApi.startVoting(teamName);
    } catch (error) {
      console.error('Failed to start voting:', error);
    }
  };

  const handleEndVoting = async () => {
    try {
      await voteApi.endVoting(teamName);
    } catch (error) {
      console.error('Failed to end voting:', error);
    }
  };

  const handleGroupDoubleClick = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const handleGroupNameSave = async (groupId: string) => {
    if (!editingGroupName.trim()) {
      setEditingGroupId(null);
      return;
    }

    try {
      await ideasApi.updateGroup(groupId, teamName, editingGroupName.trim());
    } catch (error) {
      console.error('Failed to update group name:', error);
    }

    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const getGroupCards = (groupId: string) => {
    return cards.filter((c) => c.groupId === groupId);
  };

  const boardCards = cards.filter((c) => !c.groupId);

  const isHost = true;

  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-title">🎨 头脑风暴白板</span>
          <span className="navbar-team">团队: {teamName}</span>
          {votingActive && (
            <span className="vote-points">第 {votingRound} 轮投票中</span>
          )}
        </div>
        <div className="navbar-right">
          <span className="vote-points">❤️ {votesRemaining} 积分</span>
          <div className="user-info">
            <div className="user-avatar" style={{ backgroundColor: user.color }}>
              {user.nickname.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '14px' }}>{user.nickname}</span>
          </div>
          {isHost && (
            <>
              {!votingActive ? (
                <button className="btn btn-success" onClick={handleStartVoting}>
                  开始投票
                </button>
              ) : (
                <button className="btn btn-danger" onClick={handleEndVoting}>
                  结束投票
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      <div className="main-content">
        {showResults && sortedCards.length > 0 && (
          <div className="sorting-panel">
            <h3 className="sorting-panel-title">🏆 投票结果</h3>
            <div className="sorting-list">
              {sortedCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`sorting-item rank-${index + 1}`}
                  onClick={() => setSelectedCard(card)}
                >
                  <div className="sorting-rank">{index + 1}</div>
                  <div className="sorting-item-author" style={{ color: card.authorColor }}>
                    {card.author}
                  </div>
                  <div className="sorting-item-content">{card.content}</div>
                  <div className="sorting-item-votes">👍 {card.votes} 票</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="board-container">
          <div className="board" ref={boardRef}>
            <button className="add-card-btn" onClick={handleAddCard}>
              ➕ 添加想法
            </button>

            {boardCards.map((card) => (
              <Card
                key={card.id}
                card={card}
                onDragStart={handleDragStart}
                onVote={handleVote}
                onClick={setSelectedCard}
                votedByCurrentUser={card.votedBy.includes(user.id)}
                votesRemaining={votesRemaining}
                votingActive={votingActive}
                isDragging={draggingCard === card.id}
              />
            ))}
          </div>
        </div>

        <div className="group-area" ref={groupAreaRef}>
          <h3 className="group-area-title">📁 分组区</h3>
          {groups.map((group) => (
            <div key={group.id} className="group">
              <div className="group-header">
                {editingGroupId === group.id ? (
                  <input
                    className="group-name-input"
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    onBlur={() => handleGroupNameSave(group.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGroupNameSave(group.id);
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    className="group-name"
                    onDoubleClick={() => handleGroupDoubleClick(group)}
                    title="双击编辑组名"
                  >
                    {group.name}
                  </span>
                )}
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {getGroupCards(group.id).length} 张
                </span>
              </div>
              <div className="group-cards">
                {getGroupCards(group.id).map((card) => (
                  <div
                    key={card.id}
                    className="group-card"
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="group-card-author" style={{ color: card.authorColor }}>
                      {card.author}
                    </div>
                    <div className="group-card-content">{card.content}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          className="mobile-drawer-toggle"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
        >
          📁
        </button>
        <div className={`mobile-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
          <div className="group-area" ref={groupAreaRef}>
            <h3 className="group-area-title">📁 分组区</h3>
            {groups.map((group) => (
              <div key={group.id} className="group">
                <div className="group-header">
                  {editingGroupId === group.id ? (
                    <input
                      className="group-name-input"
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      onBlur={() => handleGroupNameSave(group.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGroupNameSave(group.id);
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="group-name"
                      onDoubleClick={() => handleGroupDoubleClick(group)}
                    >
                      {group.name}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {getGroupCards(group.id).length} 张
                  </span>
                </div>
                <div className="group-cards">
                  {getGroupCards(group.id).map((card) => (
                    <div
                      key={card.id}
                      className="group-card"
                      onClick={() => setSelectedCard(card)}
                    >
                      <div className="group-card-author" style={{ color: card.authorColor }}>
                        {card.author}
                      </div>
                      <div className="group-card-content">{card.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isAddingCard && (
        <div className="modal-overlay" onClick={() => setIsAddingCard(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">添加想法</h3>
            <div className="form-group">
              <label>想法内容（最多200字）</label>
              <textarea
                value={newCardContent}
                onChange={(e) => setNewCardContent(e.target.value.slice(0, 200))}
                placeholder="写下你的想法..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #3a3a5c',
                  borderRadius: '8px',
                  background: '#1a1a2e',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
                autoFocus
              />
              <div style={{ textAlign: 'right', color: '#666', fontSize: '12px', marginTop: '4px' }}>
                {newCardContent.length}/200
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setIsAddingCard(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveCard} disabled={!newCardContent.trim()}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCard && (
        <div className="modal-overlay card-detail-modal" onClick={() => setSelectedCard(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">卡片详情</h3>
            <div className="card-detail-author" style={{ color: selectedCard.authorColor }}>
              作者: {selectedCard.author}
            </div>
            <div className="card-detail-content">{selectedCard.content}</div>
            <div style={{ marginTop: '16px', textAlign: 'right', color: '#5c7cfa', fontWeight: 600 }}>
              👍 {selectedCard.votes} 票
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setSelectedCard(null)}>
                关闭
              </button>
              {votingActive && !selectedCard.votedBy.includes(user.id) && votesRemaining > 0 && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleVote(selectedCard.id);
                    setSelectedCard(null);
                  }}
                >
                  点赞
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
