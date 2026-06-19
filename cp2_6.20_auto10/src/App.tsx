import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store';
import Sidebar from '@/components/Sidebar';
import MeetingView from '@/components/MeetingView';
import MeetingList from '@/components/MeetingList';
import TaskBoard from '@/components/TaskBoard';
import CreateMeetingModal from '@/components/CreateMeetingModal';
import { meetingWS } from '@/api';
import type { CommentMessageData, VoteMessageData, StatusChangeMessageData, AgendaOrderMessageData } from '@/types';
import { Menu, ListTodo } from 'lucide-react';

function AppContent() {
  const {
    selectedMeetingId,
    selectMeeting,
    createModalOpen,
    setCreateModalOpen,
    sidebarOpen,
    toggleSidebar,
    addComment,
    castVote,
    updateAgendaStatus,
    updateAgendaOrder,
  } = useAppStore();

  const navigate = useNavigate();

  useEffect(() => {
    if (selectedMeetingId) {
      meetingWS.connect(selectedMeetingId);

      const unsubComment = meetingWS.on('comment', (data) => {
        const msg = data as CommentMessageData;
        if (msg.comment) {
          addComment(selectedMeetingId, msg.agendaItemId, msg.comment.content);
        }
      });

      const unsubVote = meetingWS.on('vote', (data) => {
        const msg = data as VoteMessageData;
        if (msg.vote) {
          castVote(selectedMeetingId, msg.agendaItemId, msg.vote.type as 'agree' | 'disagree' | 'abstain');
        }
      });

      const unsubStatus = meetingWS.on('status_change', (data) => {
        const msg = data as StatusChangeMessageData;
        if (msg.status) {
          updateAgendaStatus(selectedMeetingId, msg.agendaItemId, msg.status);
        }
      });

      const unsubOrder = meetingWS.on('agenda_order', (data) => {
        const msg = data as AgendaOrderMessageData;
        if (msg.itemIds) {
          updateAgendaOrder(selectedMeetingId, msg.itemIds);
        }
      });

      return () => {
        meetingWS.disconnect();
        unsubComment();
        unsubVote();
        unsubStatus();
        unsubOrder();
      };
    } else {
      meetingWS.disconnect();
    }
  }, [selectedMeetingId]);

  const handleSelectMeeting = useCallback((id: string) => {
    selectMeeting(id);
    navigate(`/meeting/${id}`);
  }, [selectMeeting, navigate]);

  const handleBack = useCallback(() => {
    selectMeeting(null);
    navigate('/');
  }, [selectMeeting, navigate]);

  const handleOpenTaskBoard = useCallback(() => {
    navigate('/tasks');
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex bg-dark-800 text-dark-100 overflow-hidden">
      <Sidebar onSelectMeeting={handleSelectMeeting} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-10 p-2 rounded-lg glass-card hover:scale-105 transition-all"
          >
            <Menu size={20} className="text-dark-300" />
          </button>
        )}

        <Routes>
          <Route path="/" element={<MeetingList onOpenTaskBoard={handleOpenTaskBoard} />} />
          <Route path="/meeting/:meetingId" element={<MeetingRoute onBack={handleBack} onOpenTaskBoard={handleOpenTaskBoard} />} />
          <Route path="/tasks" element={<TaskBoardRoute onBack={handleBack} />} />
        </Routes>
      </main>

      {createModalOpen && (
        <CreateMeetingModal onClose={() => setCreateModalOpen(false)} />
      )}
    </div>
  );
}

function MeetingRoute({ onBack, onOpenTaskBoard }: { onBack: () => void; onOpenTaskBoard: () => void }) {
  const { meetingId } = useParams<{ meetingId: string }>();
  if (!meetingId) return null;
  return <MeetingView meetingId={meetingId} onBack={onBack} onOpenTaskBoard={onOpenTaskBoard} />;
}

function TaskBoardRoute({ onBack }: { onBack: () => void }) {
  return <TaskBoard onBack={onBack} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
