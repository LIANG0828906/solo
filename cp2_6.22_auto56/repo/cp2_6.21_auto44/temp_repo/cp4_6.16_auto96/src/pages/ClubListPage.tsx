import { useState } from 'react';
import { Plus, LogIn, BookOpen, Sparkles } from 'lucide-react';
import ClubCard from '@/components/ClubCard/ClubCard';
import CreateClubModal from '@/components/CreateClubModal/CreateClubModal';
import JoinClubModal from '@/components/JoinClubModal/JoinClubModal';
import { useAppStore } from '@/store/useAppStore';
import { ClubManager } from '@/modules/club/ClubManager';
import './ClubListPage.css';

export default function ClubListPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const clubs = useAppStore(state => state.clubs);
  const currentMemberMap = useAppStore(state => state.currentMemberMap);

  const userClubs = clubs.filter(club => currentMemberMap[club.id]);

  const handleClubClick = (clubId: string) => {
    console.log('Navigate to club:', clubId);
  };

  return (
    <div className="club-list-page">
      <header className="page-header">
        <div className="page-title">
          <div className="page-title-icon">
            <BookOpen size={28} />
          </div>
          <div>
            <h1>我的读书会</h1>
            <p className="page-subtitle">和志同道合的人一起读书</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowJoinModal(true)}
          >
            <LogIn size={18} />
            <span>加入俱乐部</span>
          </button>
          <button
            className="btn-primary-action"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            <span>创建俱乐部</span>
          </button>
        </div>
      </header>

      {userClubs.length > 0 ? (
        <div className="club-grid">
          {userClubs.map((club, index) => (
            <div
              key={club.id}
              style={{ animationDelay: `${index * 60}ms` }}
              className="club-card-wrapper"
            >
              <ClubCard club={club} onClick={() => handleClubClick(club.id)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Sparkles size={48} />
          </div>
          <h2>还没有加入任何俱乐部</h2>
          <p>创建一个属于你的读书俱乐部，或者加入朋友的俱乐部</p>
          <div className="empty-state-actions">
            <button
              className="btn-secondary"
              onClick={() => setShowJoinModal(true)}
            >
              <LogIn size={18} />
              <span>加入俱乐部</span>
            </button>
            <button
              className="btn-primary-action"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              <span>创建俱乐部</span>
            </button>
          </div>
        </div>
      )}

      <CreateClubModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <JoinClubModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
}
