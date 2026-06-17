import { feedbackMap, defaultFeedback } from '@/data/feedbackPool';
import type { FeedbackEntry } from '@/data/feedbackPool';
import type { Option } from '@/stores/selectionStore';

export function generateFeedback(lockedOption: Option): FeedbackEntry {
  const match = feedbackMap[lockedOption.title];
  if (match) return match;

  for (const key of Object.keys(feedbackMap)) {
    if (lockedOption.title.includes(key) || key.includes(lockedOption.title)) {
      return feedbackMap[key];
    }
  }

  if (lockedOption.description) {
    for (const key of Object.keys(feedbackMap)) {
      if (lockedOption.description.includes(key)) {
        return feedbackMap[key];
      }
    }
  }

  return defaultFeedback;
}
