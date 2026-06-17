import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePollStore } from '../store/usePollStore';
import PollCard from '../components/PollCard';
import type { PreferenceType } from '../types';

const AVATAR_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

function CreatePollForm({ onSuccess }: { onSuccess: (shortId: string) => void }) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [options, setOptions] = useState([{ date: '', startTime: '', endTime: '' }]);
  const [memberNames, setMemberNames] = useState<string[]>(['']);
  const createPoll = usePollStore((s) => s.createPoll);

  const addOption = () => {
    setOptions([...options, { date: '', startTime: '', endTime: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: string, value: string) => {
    const newOptions = [...options];
    (newOptions[index] as Record<string, string>)[field] = value;
    setOptions(newOptions);
  };

  const addMember = () => {
    setMemberNames([...memberNames, '']);
  };

  const removeMember = (index: number) => {
    if (memberNames.length > 1) {
      setMemberNames(memberNames.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || !creatorName) return;
    if (options.some((o) => !o.date || !o.startTime || !o.endTime)) return;
    if (memberNames.some((n) => !n.trim())) return;

    const allMembers = [creatorName, ...memberNames.filter((n) => n.trim())];
    const poll = await createPoll({
      title,
      options,
      deadline,
      creatorName,
      members: allMembers.map((name, i) => ({
        name: name.trim(),
        avatar: AVATAR_COLORS[i % AVATAR_COLORS.length],
      })),
    });

    if (poll) {
      onSuccess(poll.shortId);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #4b5563',
    background: '#1f1f30',
    color: '#f3f4f6',
    fontSize: 'clamp(13px, 1.3vw, 15px)',
    outline: 'none',
    transition: 'all 0.3s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: 'clamp(12px, 1.2vw, 14px)',
    color: '#9ca3af',
    fontWeight: 500,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#2a2a40',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <h2
        style={{
          fontSize: 'clamp(18px, 2vw, 22px)',
          fontWeight: 600,
          color: '#f3f4f6',
        }}
      >
        创建投票
      </h2>

      <div>
        <label style={labelStyle}>投票标题</label>
        <input
          style={inputStyle}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：下周项目周会"
          required
        />
      </div>

      <div>
        <label style={labelStyle}>创建者姓名</label>
        <input
          style={inputStyle}
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
          placeholder="你的名字"
          required
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>时间选项</label>
          <button
            type="button"
            onClick={addOption}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#8b5cf6',
              fontSize: 'clamp(12px, 1.2vw, 14px)',
            }}
          >
            + 添加
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map((opt, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <input
                type="date"
                style={inputStyle}
                value={opt.date}
                onChange={(e) => updateOption(idx, 'date', e.target.value)}
                required
              />
              <input
                type="time"
                style={inputStyle}
                value={opt.startTime}
                onChange={(e) => updateOption(idx, 'startTime', e.target.value)}
                required
              />
              <input
                type="time"
                style={inputStyle}
                value={opt.endTime}
                onChange={(e) => updateOption(idx, 'endTime', e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => removeOption(idx)}
                disabled={options.length <= 1}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(220, 38, 38, 0.2)',
                  color: '#dc2626',
                  fontSize: 'clamp(13px, 1.3vw, 15px)',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>截止时间</label>
        <input
          type="datetime-local"
          style={inputStyle}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>参与成员</label>
          <button
            type="button"
            onClick={addMember}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#8b5cf6',
              fontSize: 'clamp(12px, 1.2vw, 14px)',
            }}
          >
            + 添加
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {memberNames.map((name, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={name}
                onChange={(e) => {
                  const newNames = [...memberNames];
                  newNames[idx] = e.target.value;
                  setMemberNames(newNames);
                }}
                placeholder={`成员 ${idx + 2} 姓名`}
                required
              />
              <button
                type="button"
                onClick={() => removeMember(idx)}
                disabled={memberNames.length <= 1}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(220, 38, 38, 0.2)',
                  color: '#dc2626',
                  fontSize: 'clamp(13px, 1.3vw, 15px)',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        style={{
          padding: '12px 24px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 'clamp(14px, 1.4vw, 16px)',
        }}
      >
        创建投票
      </button>
    </form>
  );
}

function VotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { polls, currentPoll, fetchPolls, fetchPoll, submitVote, loading, error } = usePollStore();
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  const loadPolls = useCallback(() => {
    if (id) {
      fetchPoll(id);
    } else {
      fetchPolls();
    }
  }, [id, fetchPoll, fetchPolls]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(loadPolls, 5000);
    return () => clearInterval(interval);
  }, [id, loadPolls]);

  const handleCreateSuccess = (shortId: string) => {
    navigate(`/poll/${shortId}`);
  };

  const handleVote = async (preferences: Record<string, PreferenceType>) => {
    if (!currentPoll || !selectedMember) return;
    await submitVote(currentPoll.shortId, {
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      avatar: selectedMember.avatar,
      preferences,
    });
    setSelectedMember(null);
  };

  const copyShareLink = async () => {
    if (!currentPoll) return;
    const link = `${window.location.origin}/poll/${currentPoll.shortId}`;
    await navigator.clipboard.writeText(link);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 500);
  };

  if (id && currentPoll) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(20px, 2.5vw, 28px)',
              fontWeight: 700,
              color: '#f3f4f6',
            }}
          >
            {currentPoll.title}
          </h2>
          <button
            onClick={copyShareLink}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: shareLinkCopied ? '#16a34a' : 'rgba(99, 102, 241, 0.2)',
              color: shareLinkCopied ? '#fff' : '#6366f1',
              fontSize: 'clamp(13px, 1.3vw, 15px)',
              fontWeight: 500,
              transition: 'all 0.3s ease',
            }}
          >
            {shareLinkCopied ? '已复制!' : '复制分享链接'}
          </button>
        </div>

        {!selectedMember && (
          <div
            style={{
              background: '#2a2a40',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(13px, 1.3vw, 15px)',
                color: '#9ca3af',
                marginBottom: '12px',
              }}
            >
              请选择你的身份进行投票：
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {currentPoll.members.map((member) => {
                const voted = currentPoll.votes.some((v) => v.memberId === member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: voted ? 'rgba(22, 163, 74, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                      border: `1px solid ${voted ? '#16a34a' : '#8b5cf6'}`,
                      color: '#f3f4f6',
                      fontSize: 'clamp(12px, 1.2vw, 14px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: member.avatar,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      {member.name.charAt(0)}
                    </span>
                    {member.name}
                    {voted && <span style={{ color: '#16a34a' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <PollCard
          poll={currentPoll}
          showVoting={!!selectedMember}
          onVote={handleVote}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '400px 1fr',
          gap: '32px',
        }}
      >
        <div>
          <CreatePollForm onSuccess={handleCreateSuccess} />
          {error && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: '#f87171',
                fontSize: 'clamp(13px, 1.3vw, 15px)',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            background: '#2a2a40',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: '16px',
            }}
          >
            📅
          </div>
          <h3
            style={{
              fontSize: 'clamp(18px, 2vw, 22px)',
              fontWeight: 600,
              color: '#f3f4f6',
              marginBottom: '8px',
            }}
          >
            快速排期，高效协作
          </h3>
          <p
            style={{
              fontSize: 'clamp(13px, 1.3vw, 15px)',
              color: '#9ca3af',
              maxWidth: '320px',
              lineHeight: 1.6,
            }}
          >
            创建投票收集团队偏好，智能算法自动计算最优日程，让会议安排不再纠结。
          </p>
        </div>
      </div>

      <div>
        <h2
          style={{
            fontSize: 'clamp(20px, 2.5vw, 26px)',
            fontWeight: 700,
            color: '#f3f4f6',
            marginBottom: '20px',
          }}
        >
          进行中的投票
        </h2>
        {loading && polls.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>加载中...</p>
        ) : polls.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>暂无投票，创建第一个开始吧！</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 400px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default VotePage;
