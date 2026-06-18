import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useGroupBuyStore } from '../modules/groupBuy/store/groupBuyStore';
import { useScheduleStore } from '../modules/schedule/store/scheduleStore';
import { GroupCard } from '../modules/groupBuy/components/GroupCard';

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { groupBuys } = useGroupBuyStore();
  const { getUserAssignments } = useScheduleStore();
  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'schedule'>('schedule');
  const userId = 'user-1';

  const createdGroups = groupBuys.filter((g) => g.creatorId === userId);
  const joinedGroups = groupBuys.filter(
    (g) => g.creatorId !== userId && g.currentMembers.some((m) => m.id === userId)
  );

  const assignments = getUserAssignments(userId).sort(
    (a, b) => new Date(a.slot.date).getTime() - new Date(b.slot.date).getTime()
  );

  const groupedAssignments = assignments.reduce((acc, item) => {
    const date = item.slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof assignments>);

  const dates = Object.keys(groupedAssignments).sort();

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>个人中心</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.tabs}>
          <div
            style={{
              ...styles.tab,
              ...(activeTab === 'schedule' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('schedule')}
          >
            取货时间线
          </div>
          <div
            style={{
              ...styles.tab,
              ...(activeTab === 'created' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('created')}
          >
            我发起的 ({createdGroups.length})
          </div>
          <div
            style={{
              ...styles.tab,
              ...(activeTab === 'joined' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('joined')}
          >
            我参与的 ({joinedGroups.length})
          </div>
        </div>

        <div style={styles.content}>
          {activeTab === 'schedule' && (
            <div style={styles.timeline}>
              {dates.length === 0 ? (
                <div style={styles.empty}>暂无取货安排</div>
              ) : (
                dates.map((date, dateIndex) => (
                  <div key={date} style={styles.timelineGroup}>
                    <div style={styles.timelineDate}>
                      <div style={styles.dateDot} />
                      <div style={styles.dateText}>
                        {dayjs(date).format('MM月DD日 dddd')}
                      </div>
                    </div>
                    <div style={styles.timelineItems}>
                      {groupedAssignments[date].map((item, index) => (
                        <div
                          key={item.slotId}
                          style={{
                            ...styles.timelineItem,
                            animationDelay: `${dateIndex * 100 + index * 50}ms`,
                          }}
                        >
                          <div style={styles.itemTime}>
                            {item.slot.startTime} - {item.slot.endTime}
                          </div>
                          <div style={styles.itemContent}>
                            <div style={styles.itemTitle}>{item.groupName}</div>
                            <div style={styles.itemMeta}>取货时段已确认</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'created' && (
            <div style={styles.groupsGrid}>
              {createdGroups.length === 0 ? (
                <div style={styles.empty}>暂无发起的拼团</div>
              ) : (
                createdGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))
              )}
            </div>
          )}

          {activeTab === 'joined' && (
            <div style={styles.groupsGrid}>
              {joinedGroups.length === 0 ? (
                <div style={styles.empty}>暂无参与的拼团</div>
              ) : (
                joinedGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFF8E7',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #E0D5C0',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#999',
    padding: 0,
    lineHeight: 1,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #E0D5C0',
  },
  tab: {
    flex: 1,
    padding: '14px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
  },
  tabActive: {
    color: '#FF7E67',
    fontWeight: 600,
  },
  content: {
    padding: '20px',
    flex: 1,
    overflowY: 'auto',
  },
  timeline: {
    position: 'relative',
  },
  timelineGroup: {
    marginBottom: '24px',
    position: 'relative',
  },
  timelineDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  dateDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#FF7E67',
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
  },
  dateText: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
  },
  timelineItems: {
    marginLeft: '6px',
    paddingLeft: '20px',
    borderLeft: '2px solid #E0D5C0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  timelineItem: {
    backgroundColor: '#FFF',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    animation: 'fadeInUp 400ms ease-out both',
  },
  itemTime: {
    backgroundColor: '#4A90D9',
    color: '#FFF',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '4px',
  },
  itemMeta: {
    fontSize: '12px',
    color: '#6BCB77',
  },
  groupsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
    fontSize: '14px',
  },
};
