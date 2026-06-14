import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Check, X as XIcon, QrCode, Clock, MapPin,
  Users, Hash, Search
} from 'lucide-react';
import { EventItem, Participant, CheckInRecord } from './types';
import { generateId } from './data';

interface CheckInPageProps {
  event: EventItem;
  participants: Participant[];
  checkInRecords: CheckInRecord[];
  onBack: () => void;
  onCheckIn: (
    record: CheckInRecord,
    event: EventItem,
    participant: Participant
  ) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

interface CheckInListItem {
  id: string;
  name: string;
  checkInCode: string;
  checkedIn: boolean;
  checkInTime?: number;
  isNew?: boolean;
}

const CheckInListItem = React.memo(({
  item,
  index,
}: {
  item: CheckInListItem;
  index: number;
}) => {
  return (
    <div
      className={item.isNew ? 'animate-slide-in-up' : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: item.checkedIn ? 'var(--color-success-light)' : 'var(--color-card)',
        borderRadius: 'var(--radius-md)',
        border: item.checkedIn
          ? '1px solid #A7F3D0'
          : '1px solid var(--color-border)',
        transition: 'all var(--transition)',
        animationDelay: `${index * 0.02}s`,
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: item.checkedIn
            ? 'linear-gradient(135deg, #10B981, #34D399)'
            : 'linear-gradient(135deg, #E5E7EB, #F3F4F6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: item.checkedIn ? '#fff' : 'var(--color-text-secondary)',
          fontWeight: '600',
          fontSize: '14px',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {item.name.charAt(0)}
        {item.checkedIn && (
          <div
            className="animate-bounce-check"
            style={{
              position: 'absolute',
              right: '-4px',
              bottom: '-4px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#fff',
              border: '2px solid var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={10} style={{ color: 'var(--color-success)' }} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '2px',
          }}
        >
          <span
            style={{
              fontWeight: item.checkedIn ? '600' : '500',
              fontSize: '14px',
              color: 'var(--color-text)',
            }}
            className={item.isNew && item.checkedIn ? 'animate-pulse-success' : ''}
          >
            {item.name}
          </span>
          {item.checkedIn && (
            <span
              className="animate-bounce-check"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--color-success)',
                color: '#fff',
              }}
            >
              <Check size={12} />
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Hash size={10} />
          <span>签到码: {item.checkInCode}</span>
          {item.checkInTime && (
            <>
              <span>·</span>
              <Clock size={10} />
              <span>
                {new Date(item.checkInTime).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

CheckInListItem.displayName = 'CheckInListItem';

const RollingNumber = React.memo(({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const startTime = Date.now();
      const startValue = displayValue;
      const diff = value - startValue;
      const duration = 400;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startValue + diff * easeOut);
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value, displayValue]);

  return (
    <span
      style={{
        display: 'inline-block',
        fontVariantNumeric: 'tabular-nums',
        transition: 'transform 0.2s ease',
        transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      {displayValue}
    </span>
  );
});

RollingNumber.displayName = 'RollingNumber';

const CheckInPage: React.FC<CheckInPageProps> = ({
  event,
  participants,
  checkInRecords,
  onBack,
  onCheckIn,
  onShowToast,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayPage, setDisplayPage] = useState(1);
  const [newlyCheckedInIds, setNewlyCheckedInIds] = useState<Set<string>>(new Set());

  const PAGE_SIZE = 20;

  const participantMap = useMemo(() => {
    const map = new Map<string, Participant>();
    participants.forEach(p => map.set(p.id, p));
    return map;
  }, [participants]);

  const codeToParticipant = useMemo(() => {
    const map = new Map<string, Participant>();
    participants.forEach(p => map.set(p.checkInCode, p));
    return map;
  }, [participants]);

  const eventRecords = useMemo(() =>
    checkInRecords.filter(r => r.eventId === event.id),
    [checkInRecords, event.id]
  );

  const checkedInMap = useMemo(() => {
    const map = new Map<string, number>();
    eventRecords.forEach(r => map.set(r.participantId, r.timestamp));
    return map;
  }, [eventRecords]);

  const checkInList: CheckInListItem[] = useMemo(() => {
    const allParticipants = event.participantIds.length > 0
      ? event.participantIds
        .map(id => participantMap.get(id))
        .filter((p): p is Participant => p !== undefined)
      : participants;

    return allParticipants.map(p => ({
      id: p.id,
      name: p.name,
      checkInCode: p.checkInCode,
      checkedIn: checkedInMap.has(p.id),
      checkInTime: checkedInMap.get(p.id),
      isNew: newlyCheckedInIds.has(p.id),
    }));
  }, [event.participantIds, participantMap, participants, checkedInMap, newlyCheckedInIds]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return checkInList;
    const q = searchQuery.toLowerCase();
    return checkInList.filter(
      item => item.name.includes(q) || item.checkInCode.includes(q)
    );
  }, [checkInList, searchQuery]);

  const paginatedList = useMemo(() => {
    if (filteredList.length <= 100) return filteredList;
    const start = (displayPage - 1) * PAGE_SIZE;
    return filteredList.slice(start, start + PAGE_SIZE);
  }, [filteredList, displayPage]);

  const totalPages = Math.ceil(filteredList.length / PAGE_SIZE);
  const showPagination = filteredList.length > 100;

  const checkedInCount = checkInList.filter(i => i.checkedIn).length;
  const totalCount = checkInList.length;

  useEffect(() => {
    setDisplayPage(1);
  }, [searchQuery]);

  const triggerError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setIsShaking(true);
    onShowToast(msg, 'error');
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
    setTimeout(() => {
      setErrorMsg('');
    }, 2500);
  }, [onShowToast]);

  const triggerSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    onShowToast(msg, 'success');
    setTimeout(() => {
      setSuccessMsg('');
    }, 2500);
  }, [onShowToast]);

  const doCheckIn = useCallback((participant: Participant) => {
    if (checkedInMap.has(participant.id)) {
      triggerError(`${participant.name} 已经签到过了`);
      return false;
    }

    const record: CheckInRecord = {
      id: generateId(),
      eventId: event.id,
      participantId: participant.id,
      participantName: participant.name,
      timestamp: Date.now(),
    };

    onCheckIn(record, event, participant);

    setNewlyCheckedInIds(prev => new Set(prev).add(participant.id));
    setTimeout(() => {
      setNewlyCheckedInIds(prev => {
        const next = new Set(prev);
        next.delete(participant.id);
        return next;
      });
    }, 1000);

    triggerSuccess(`${participant.name} 签到成功！积分+10`);
    return true;
  }, [checkedInMap, event, onCheckIn, triggerError, triggerSuccess]);

  const handleCheckIn = useCallback(() => {
    const code = inputCode.trim();
    if (!code) {
      triggerError('请输入签到码');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      triggerError('签到码必须是6位数字');
      return;
    }

    const participant = codeToParticipant.get(code);
    if (!participant) {
      triggerError('无效的签到码');
      return;
    }

    if (event.participantIds.length > 0 && !event.participantIds.includes(participant.id)) {
      triggerError('该参与者未报名此活动');
      return;
    }

    const success = doCheckIn(participant);
    if (success) {
      setInputCode('');
    }
  }, [inputCode, codeToParticipant, event.participantIds, doCheckIn, triggerError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheckIn();
    }
  };

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-card)',
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-card)'; }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: 'var(--color-text)',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.name}
          </h1>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} />
              {event.time}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} />
              {event.location}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366F1 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 24px',
          color: '#fff',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-10%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px' }}>
                实时签到人数
              </div>
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: '800',
                  lineHeight: 1,
                  letterSpacing: '-2px',
                }}
              >
                <RollingNumber value={checkedInCount} />
                <span style={{ fontSize: '24px', opacity: 0.6, marginLeft: '8px' }}>
                  / {totalCount}
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '8px',
              }}
            >
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                活动签到码: <strong style={{ fontSize: '18px', letterSpacing: '2px' }}>
                  {event.checkInCode}
                </strong>
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.15)',
                  fontSize: '12px',
                  opacity: 0.9,
                }}
              >
                <Users size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                签到率 {totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0}%
              </div>
            </div>
          </div>

          <div
            style={{
              height: '8px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${totalCount > 0 ? (checkedInCount / totalCount) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #34D399, #6EE7B7)',
                borderRadius: '4px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5fr',
          gap: '24px',
        }}
      >
        <div
          className={isShaking ? 'animate-shake' : ''}
          style={{
            background: 'var(--color-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            boxShadow: 'var(--shadow-md)',
            alignSelf: 'flex-start',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <QrCode size={22} style={{ color: 'var(--color-primary)' }} />
            签到核销
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
                color: 'var(--color-text-secondary)',
              }}
            >
              输入6位签到码
            </label>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setErrorMsg('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="请输入或扫描6位签到码"
              maxLength={6}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '28px',
                fontWeight: '700',
                letterSpacing: '8px',
                textAlign: 'center',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${errorMsg
                  ? 'var(--color-error)'
                  : successMsg
                  ? 'var(--color-success)'
                  : 'var(--color-border)'}`,
                background: errorMsg
                  ? 'var(--color-error-light)'
                  : successMsg
                  ? 'var(--color-success-light)'
                  : 'var(--color-bg)',
                transition: 'all var(--transition)',
                fontFamily: '"SF Mono", "Consolas", monospace',
              }}
              onFocus={(e) => {
                if (!errorMsg && !successMsg) {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {errorMsg && (
            <div
              className="animate-fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-error-light)',
                color: 'var(--color-error)',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '16px',
              }}
            >
              <XIcon size={16} />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              className="animate-bounce-check"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-success-light)',
                color: 'var(--color-success)',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '16px',
              }}
            >
              <Check size={16} />
              {successMsg}
            </div>
          )}

          <button
            onClick={handleCheckIn}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366F1 100%)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-md)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            <Check size={20} />
            确认签到
          </button>

          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.8,
            }}
          >
            <div style={{ fontWeight: '500', color: 'var(--color-text)', marginBottom: '6px' }}>
              💡 使用提示
            </div>
            <div>• 输入参与者的6位签到码后按回车或点击按钮</div>
            <div>• 签到成功后参与者自动获得10积分</div>
            <div>• 右侧列表可实时查看签到状态</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '600px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Users size={22} style={{ color: 'var(--color-secondary)' }} />
              签到列表
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '400',
                  color: 'var(--color-text-secondary)',
                }}
              >
                ({filteredList.length})
              </span>
            </h2>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索姓名或签到码"
                style={{
                  padding: '8px 12px 8px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  width: '200px',
                  background: 'var(--color-bg)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.background = '#fff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.background = 'var(--color-bg)';
                }}
              />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {paginatedList.length === 0 ? (
              <div
                style={{
                  padding: '48px 16px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '14px',
                }}
              >
                暂无匹配的参与者
              </div>
            ) : (
              paginatedList.map((item, idx) => (
                <CheckInListItem key={item.id} item={item} index={idx} />
              ))
            )}
          </div>

          {showPagination && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                onClick={() => setDisplayPage(p => Math.max(1, p - 1))}
                disabled={displayPage === 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: displayPage === 1 ? 'var(--color-bg)' : 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  color: displayPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                  cursor: displayPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                上一页
              </button>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                第 {displayPage} / {totalPages} 页
              </span>
              <button
                onClick={() => setDisplayPage(p => Math.min(totalPages, p + 1))}
                disabled={displayPage === totalPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: displayPage === totalPages ? 'var(--color-bg)' : 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  color: displayPage === totalPages ? 'var(--color-text-muted)' : 'var(--color-text)',
                  cursor: displayPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .animate-shake {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1.5fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckInPage;
