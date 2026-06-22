import { v4 as uuidv4 } from 'uuid';
import { formatISO } from 'date-fns';
import * as db from '../utils/db';
import type { Comment } from '../types';

function generateId(): string {
  return uuidv4();
}

function getCurrentTimestamp(): string {
  return formatISO(new Date());
}

async function addComment(
  recipeId: string,
  userId: string,
  userName: string,
  userAvatarColor: string,
  content: string
): Promise<Comment> {
  try {
    const comment: Comment = {
      id: generateId(),
      recipeId,
      userId,
      userName,
      userAvatarColor,
      content,
      createdAt: getCurrentTimestamp(),
    };

    await db.add('comments', comment);
    return comment;
  } catch (error) {
    console.error('Failed to add comment:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add comment');
  }
}

async function deleteComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const comment = await db.get<Comment>('comments', commentId);
    if (!comment) {
      return false;
    }
    if (comment.userId !== userId) {
      return false;
    }
    await db.remove('comments', commentId);
    return true;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete comment');
  }
}

async function getCommentsByRecipe(recipeId: string): Promise<Comment[]> {
  try {
    const comments = await db.getByIndex<Comment>('comments', 'recipeId', recipeId);
    return comments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Failed to get comments by recipe:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get comments by recipe');
  }
}

async function getCommentCount(recipeId: string): Promise<number> {
  try {
    const comments = await db.getByIndex<Comment>('comments', 'recipeId', recipeId);
    return comments.length;
  } catch (error) {
    console.error('Failed to get comment count:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get comment count');
  }
}

export const commentSystem = {
  addComment,
  deleteComment,
  getCommentsByRecipe,
  getCommentCount,
};
