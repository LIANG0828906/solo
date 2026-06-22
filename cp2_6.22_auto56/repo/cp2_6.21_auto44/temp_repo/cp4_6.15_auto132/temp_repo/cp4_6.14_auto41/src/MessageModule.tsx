import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiProxy, Message, Bid, Contract } from './ApiProxy';

interface ChatSession {
  bidId: string;
  contractorName: string;
  projectId: string;
  projectName: string;
  lastMessageTime: string | null;
  lastMessage: string | null;
  price: number;
  duration: number;
}

const btnBase = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.1s ease',
} as const;

export default function MessageModule() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedPrice, setConfirmedPrice] = useState(0);
  const [confirmedDuration, setConfirmedDuration] = useState(0);
  const [shakeChat, setShakeChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initSessions();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const state = location.state as { bidId?: string; contractorName?: string } | null;
    if (state?.bidId && sessions.length > 0) {
      const existing = sessions.find((s) => s.bidId === state.bidId);
      if (existing) {
        setSelectedSession(existing);
        fetchMessages(existing.bidId, existing.contractorName, existing.price, existing.duration);
      }
    }
  }, [sessions, location.state]);

  const initSessions = async () => {
    setLoading(true);
    try {
      const allBids = await ApiProxy.getBids();
      const shortlistedBids = allBids.filter((b) => b.status === 'shortlisted');
      const allProjects = await ApiProxy.getProjects();

      const sessionPromises = shortlistedBids.map(async (bid) => {
        const project = allProjects.find((p) => p.id === bid.projectId);
        const msgs = await ApiProxy.getMessages(bid.id);
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        return {
          bidId: bid.id,
          contractorName: bid.contractorName,
          projectId: bid.projectId,
          projectName: project?.name || '未知项目',
          lastMessageTime: lastMsg?.timestamp || null,
          lastMessage: lastMsg?.content || null,
          price: bid.price,
          duration: bid.duration,
        };
      });

      const sessionData = await Promise.all(sessionPromises);
      sessionData.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
      setSessions(sessionData);

      if (sessionData.length > 0 && !location.state) {
        setSelectedSession(sessionData[0]);
        fetchMessages(sessionData[0].bidId, sessionData[0].contractorName, sessionData[0].price, sessionData[0].duration);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (bidId: string, contractorName: string, price: number, duration: number, appendMode = false) => {
    try {
      const data = await ApiProxy.getMessages(bidId);
      if (!appendMode) {
        setMessages(data);
      } else {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = data.filter((m) => !existingIds.has(m.id));
          if (newMsgs.length > 0) {
            setShakeChat(true);
            setTimeout(() => setShakeChat(false), 300);
          }
          return [...prev, ...newMsgs];
        });
      }
      setConfirmedPrice(price);
      setConfirmedDuration(duration);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedSession) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(selectedSession.bidId, selectedSession.contractorName, selectedSession.price, selectedSession.duration, true);
      }, 2000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedSession]);

  const handleSend = async () => {
    if (!selectedSession || !newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage('');
    try {
      await ApiProxy.sendMessage({
        bidId: selectedSession.bidId,
        senderId: 'publisher-1',
        senderName: '张经理',
        senderRole: 'publisher',
        content,
      });
      fetchMessages(selectedSession.bidId, selectedSession.contractorName, selectedSession.price, selectedSession.duration, true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session);
    setMessages([]);
    fetchMessages(session.bidId, session.contractorName, session.price, session.duration);
  };

  const handleGenerateContract = async () => {
    if (!selectedSession) return;
    setShowConfirmModal(false);
    try {
      const project = sessions.find((s) => s.bidId === selectedSession.bidId);
      const contract: Omit<Contract, 'id' | 'contractNo' | 'status' | 'publisherSigned' | 'contractorSigned' | 'signedAt'> = {
        projectId: selectedSession.projectId,
        projectName: selectedSession.projectName,
        bidId: selectedSession.bidId,
        publisherName: '张经理',
        contractorName: selectedSession.contractorName,
        finalPrice: confirmedPrice,
        finalDuration: confirmedDuration,
        description: `项目合作合同：${selectedSession.projectName}，双方友好协商达成一致。`,
      };
      await ApiProxy.createContract(contract);
      alert('合同已生成，请前往合同管理页面查看并签署');
      navigate('/contracts');
    } catch (e) {
      console.error(e);
      alert('生成合同失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', color: '#1e40af', marginBottom: '4px' }}>在线洽谈</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>与入围承包方进行一对一沟通</p>
      </div>

      <div style={{
        display: 'flex',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        height: 'calc(100vh - 200px)',
        minHeight: '500px',
      }}>
        <div style={{
          width: '280px',
          minWidth: '280px',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fafafa',
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            fontWeight: 600,
            color: '#1f2937',
            fontSize: '14px',
          }}>
            洽谈列表 ({sessions.length})
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>加载中...</div>
            )}
            {!loading && sessions.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                暂无进行中的洽谈<br />
                <span style={{ fontSize: '11px', marginTop: '8px', display: 'block' }}>请先在投标列表中标记入围</span>
              </div>
            )}
            {sessions.map((s) => (
              <div
                key={s.bidId}
                onClick={() => handleSelectSession(s)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: selectedSession?.bidId === s.bidId ? '#eff6ff' : 'transparent',
                  borderLeft: selectedSession?.bidId === s.bidId ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (selectedSession?.bidId !== s.bidId) e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  if (selectedSession?.bidId !== s.bidId) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: '#dbeafe', color: '#1e40af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 600, flexShrink: 0,
                  }}>{s.contractorName[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 600, color: '#1f2937',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{s.contractorName}</div>
                    <div style={{
                      fontSize: '11px', color: '#9ca3af',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{s.projectName}</div>
                  </div>
                </div>
                <div style={{
                  fontSize: '12px', color: '#6b7280',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  marginBottom: '4px',
                  paddingLeft: '46px',
                }}>
                  {s.lastMessage || '暂无消息记录'}
                </div>
                {s.lastMessageTime && (
                  <div style={{
                    fontSize: '10px', color: '#9ca3af',
                    textAlign: 'right',
                    paddingLeft: '46px',
                  }}>
                    {new Date(s.lastMessageTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!selectedSession ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9ca3af', fontSize: '14px',
            }}>
              请选择左侧洽谈对象开始沟通
            </div>
          ) : (
            <>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fafafa',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    backgroundColor: '#dbeafe', color: '#1e40af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 600,
                  }}>{selectedSession.contractorName[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '15px' }}>{selectedSession.contractorName}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {selectedSession.projectName} · 报价 {selectedSession.price}万 · 工期 {selectedSession.duration}天
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setConfirmedPrice(selectedSession.price); setConfirmedDuration(selectedSession.duration); setShowConfirmModal(true); }}
                  style={{ ...btnBase, backgroundColor: '#1e40af', color: 'white' }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  📄 生成合同
                </button>
              </div>

              <div
                className={shakeChat ? 'shake' : ''}
                style={{
                  flex: 1,
                  padding: '20px',
                  overflowY: 'auto',
                  backgroundColor: '#f9fafb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {messages.length === 0 && (
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9ca3af', fontSize: '13px',
                  }}>
                    还没有消息，开始沟通吧
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.senderRole === 'publisher';
                  return (
                    <div key={msg.id} style={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '70%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        gap: '4px',
                      }}>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          backgroundColor: isMine ? '#3b82f6' : '#e5e7eb',
                          color: isMine ? 'white' : '#1f2937',
                          fontSize: '14px',
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                        }}>
                          {msg.content}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11px',
                          color: '#9ca3af',
                          padding: '0 4px',
                        }}>
                          <span>{new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMine && <span>✓ 已发送</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '12px',
                backgroundColor: 'white',
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="输入消息，按Enter发送..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  style={{
                    ...btnBase,
                    backgroundColor: newMessage.trim() ? '#3b82f6' : '#d1d5db',
                    color: 'white',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                  }}
                  onMouseOver={(e) => { if (newMessage.trim()) e.currentTarget.style.opacity = '0.9'; }}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseDown={(e) => { if (newMessage.trim()) e.currentTarget.style.transform = 'scale(0.95)'; }}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  发送
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showConfirmModal && selectedSession && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowConfirmModal(false)}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '28px',
            width: '480px', maxWidth: '90vw',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', color: '#1e40af', marginBottom: '8px' }}>📄 确认合同信息</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>请确认最终谈妥的报价和工期</p>
            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280', fontSize: '13px' }}>项目名称</span>
                <span style={{ color: '#1f2937', fontSize: '13px', fontWeight: 500 }}>{selectedSession.projectName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ color: '#6b7280', fontSize: '13px' }}>承包方</span>
                <span style={{ color: '#1f2937', fontSize: '13px', fontWeight: 500 }}>{selectedSession.contractorName}</span>
              </div>
              <div style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '13px', marginBottom: '6px' }}>最终报价(万元)</label>
                <input type="number" value={confirmedPrice || ''}
                  onChange={(e) => setConfirmedPrice(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
              </div>
              <div style={{ padding: '8px 0' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '13px', marginBottom: '6px' }}>最终工期(天)</label>
                <input type="number" value={confirmedDuration || ''}
                  onChange={(e) => setConfirmedDuration(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowConfirmModal(false)}
                style={{ ...btnBase, backgroundColor: '#f3f4f6', color: '#4b5563' }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}>取消</button>
              <button onClick={handleGenerateContract}
                style={{ ...btnBase, backgroundColor: '#1e40af', color: 'white' }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}>确认生成</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
