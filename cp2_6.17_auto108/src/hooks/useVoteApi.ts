import { useMemo } from 'react';
import { useVoteStore } from '../store/voteStore';
import type { CreateVoteForm, VoteTopic } from '../types';

export function useVoteApi() {
  const {
    topics,
    currentUserId,
    voteRecords,
    createTopic,
    submitVote,
    getTopicById,
    hasUserVoted,
    updateTopicStatuses,
  } = useVoteStore();

  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'ongoing' ? -1 : 1;
      }
      return b.createdAt - a.createdAt;
    });
  }, [topics]);

  const getTopicWithMeta = (id: string) => {
    const topic = getTopicById(id);
    if (!topic) return null;
    return {
      ...topic,
      userVoted: hasUserVoted(id),
      userOptionId: voteRecords.find((r) => r.topicId === id)?.optionId,
    };
  };

  return {
    topics: sortedTopics,
    currentUserId,
    voteRecords,
    createTopic: (form: CreateVoteForm): VoteTopic => createTopic(form),
    submitVote: (topicId: string, optionId: string): void =>
      submitVote(topicId, optionId),
    getTopicById,
    getTopicWithMeta,
    hasUserVoted,
    updateTopicStatuses,
  };
}
