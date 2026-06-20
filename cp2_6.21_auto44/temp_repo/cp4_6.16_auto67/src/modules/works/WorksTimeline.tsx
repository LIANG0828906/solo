import { useState, useCallback } from 'react';
import { Music, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { TimelineNode } from '../../components/TimelineNode';
import { audioPlayer } from '../audio/AudioPlayer';
import { worksManager } from './WorksManager';
import { voteManager } from '../vote/VoteManager';
import { useAppStore } from '../../store/useAppStore';
import { COLORS } from '../../utils/constants';
import type { Work } from '../../types';

interface WorksTimelineProps {
  work: Work;
}

export function WorksTimeline({ work }: WorksTimelineProps) {
  const { audioState, expandedMilestoneId, setExpandedMilestone } = useAppStore();

  const sortedMilestones = [...work.milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const handleToggle = useCallback(
    (milestoneId: string) => {
      if (expandedMilestoneId === milestoneId) {
        setExpandedMilestone(null);
      } else {
        setExpandedMilestone(milestoneId);
      }
    },
    [expandedMilestoneId, setExpandedMilestone],
  );

  const handlePlayToggle = useCallback(async () => {
    if (audioState.currentWorkId !== work.id || !audioState.isPlaying) {
      const notes = worksManager.getAudioNotesForWork(work.id);
      if (audioState.currentWorkId !== work.id) {
        await audioPlayer.switchTrack(work.id, notes);
      } else {
        await audioPlayer.play();
      }
    } else {
      audioPlayer.pause();
    }
  }, [audioState.currentWorkId, audioState.isPlaying, work.id]);

  const handleSeek = useCallback(
    (progress: number) => {
      audioPlayer.seek(progress);
    },
    [],
  );

  const handleVote = useCallback(
    async (score: number, comment?: string) => {
      await useAppStore.getState().addVote(work.id, score, comment);
    },
    [work.id],
  );

  const voteStats = voteManager.getStatsForWork(work.id);
  const allVotes = voteManager.getVotesForWork(work.id);
  const recentComments = allVotes.slice(0, 5);

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-start gap-4">
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: work.coverColor }}
          >
            <span className="text-3xl font-bold text-white/90 drop-shadow-lg">
              {work.title.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-text-primary">{work.title}</h2>
              <span
                className="
                  px-3 py-1 rounded-full text-xs font-medium text-white
                "
                style={{
                  background:
                    work.status === 'published'
                      ? COLORS.publishedGradient
                      : COLORS.draftGradient,
                }}
              >
                {work.status === 'published' ? '已发布' : '草稿'}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                创作于 {format(new Date(work.createdAt), 'yyyy年MM月', { locale: zhCN })}
              </span>
              <span className="flex items-center gap-1">
                <Music className="w-4 h-4" />
                {work.milestones.length} 个里程碑
              </span>
            </div>

            {work.lyrics && (
              <p className="mt-3 text-sm text-text-secondary/80 whitespace-pre-line line-clamp-3">
                {work.lyrics}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-6">创作历程</h3>

        <div className="relative">
          {sortedMilestones.map((milestone, index) => (
            <TimelineNode
              key={milestone.id}
              milestone={milestone}
              index={index}
              isExpanded={expandedMilestoneId === milestone.id}
              isSelectedSong={true}
              audioState={audioState.currentWorkId === work.id ? audioState : {
                isPlaying: false,
                currentTime: 0,
                duration: work.audioDuration || 0,
                currentWorkId: null,
                progress: 0,
              }}
              voteStats={voteStats}
              recentComments={recentComments}
              onToggle={() => handleToggle(milestone.id)}
              onPlayToggle={handlePlayToggle}
              onSeek={handleSeek}
              onVote={handleVote}
              workTitle={work.title}
            />
          ))}
        </div>

        {sortedMilestones.length === 0 && (
          <div className="text-center py-20">
            <Music className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" />
            <p className="text-text-secondary">这首歌还没有里程碑记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
