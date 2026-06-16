import { v4 as uuidv4 } from 'uuid';
import type { Review, User } from '../../types';
import {
  getAllReviews,
  saveReviews,
  getAllUsers,
  saveUsers,
} from '../../utils/storage';

export const ReviewModule = {
  async createReview(
    data: Omit<Review, 'id' | 'createdAt'>
  ): Promise<Review> {
    const reviews = await getAllReviews();

    const existingReview = reviews.find(
      (r) =>
        r.exchangeRequestId === data.exchangeRequestId &&
        r.reviewerId === data.reviewerId
    );
    if (existingReview) {
      return existingReview;
    }

    const newReview: Review = {
      id: uuidv4(),
      exchangeRequestId: data.exchangeRequestId,
      reviewerId: data.reviewerId,
      revieweeId: data.revieweeId,
      rating: data.rating,
      content: data.content,
      createdAt: Date.now(),
    };
    reviews.push(newReview);
    await saveReviews(reviews);

    await this.updateUserAverageRating(data.revieweeId);

    return newReview;
  },

  async getReviewById(reviewId: string): Promise<Review | null> {
    const reviews = await getAllReviews();
    return reviews.find((r) => r.id === reviewId) || null;
  },

  async getUserReviews(userId: string): Promise<Review[]> {
    const reviews = await getAllReviews();
    return reviews
      .filter((r) => r.revieweeId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async getExchangeReviews(exchangeRequestId: string): Promise<Review[]> {
    const reviews = await getAllReviews();
    return reviews.filter((r) => r.exchangeRequestId === exchangeRequestId);
  },

  async hasUserReviewed(
    exchangeRequestId: string,
    reviewerId: string
  ): Promise<boolean> {
    const reviews = await getAllReviews();
    return reviews.some(
      (r) =>
        r.exchangeRequestId === exchangeRequestId &&
        r.reviewerId === reviewerId
    );
  },

  async calculateAverageRating(userId: string): Promise<number> {
    const reviews = await getAllReviews();
    const userReviews = reviews.filter((r) => r.revieweeId === userId);
    if (userReviews.length === 0) return 0;
    const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / userReviews.length) * 10) / 10;
  },

  async updateUserAverageRating(userId: string): Promise<void> {
    const users = await getAllUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return;

    const reviews = await getAllReviews();
    const userReviews = reviews.filter((r) => r.revieweeId === userId);
    const averageRating =
      userReviews.length > 0
        ? Math.round(
            (userReviews.reduce((acc, r) => acc + r.rating, 0) /
              userReviews.length) *
              10
          ) / 10
        : 0;

    users[index] = {
      ...users[index],
      averageRating,
      reviewCount: userReviews.length,
    };
    await saveUsers(users);
  },
};
