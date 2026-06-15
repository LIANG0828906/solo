import { feedbackRepository } from '../repositories/feedbackRepository.js';
import { surveyRepository } from '../repositories/surveyRepository.js';
import type { Feedback, Rating, CreateFeedbackRequest } from '../types.js';

interface FeedbackWithEmoji extends Feedback {
  ratings: Array<Rating & { emoji: string }>;
}

export const feedbackService = {
  createFeedback(data: CreateFeedbackRequest): FeedbackWithEmoji {
    const survey = surveyRepository.findById(data.surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    if (!data.ratings || data.ratings.length === 0) {
      throw new Error('At least one rating is required');
    }

    const dimensions = surveyRepository.getDimensionsBySurveyId(data.surveyId);
    const dimensionMap = new Map<string, { id: string; emoji: string; label: string }>(
      dimensions.map(d => [d.id, d])
    );

    for (const rating of data.ratings) {
      if (!dimensionMap.has(rating.dimensionId)) {
        throw new Error(`Invalid dimension id: ${rating.dimensionId}`);
      }
      if (rating.score < 1 || rating.score > 5) {
        throw new Error('Score must be between 1 and 5');
      }
    }

    const feedback = feedbackRepository.create(data.surveyId, data.text);

    const ratings: Array<Rating & { emoji: string }> = data.ratings.map(ratingData => {
      const rating = feedbackRepository.createRating(
        feedback.id,
        ratingData.dimensionId,
        ratingData.score
      );
      const dimension = dimensionMap.get(ratingData.dimensionId)!;
      return { ...rating, emoji: dimension.emoji };
    });

    return { ...feedback, ratings };
  },

  getFeedbackById(id: string): (Feedback & { ratings: Rating[] }) | null {
    const feedback = feedbackRepository.findById(id);
    if (!feedback) return null;

    const ratings = feedbackRepository.getRatingsByFeedbackId(id);
    return { ...feedback, ratings };
  },

  getFeedbacksBySurveyId(surveyId: string, limit = 100): Array<Feedback & { ratings: Rating[] }> {
    const feedbacks = feedbackRepository.findBySurveyId(surveyId, limit);
    return feedbacks.map(feedback => {
      const ratings = feedbackRepository.getRatingsByFeedbackId(feedback.id);
      return { ...feedback, ratings };
    });
  },
};
