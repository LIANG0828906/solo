import axios from 'axios';
import type {
  Document,
  Comment,
  CommentReply,
  Version,
  DiffResult,
  CreateCommentData,
} from './types';

const api = axios.create({
  baseURL: '/api',
});

export const getDocument = async (): Promise<Document> => {
  const response = await api.get<Document>('/document');
  return response.data;
};

export const updateDocument = async (
  content: string,
  plainText: string,
  operator: string
): Promise<Document> => {
  const response = await api.put<Document>('/document', {
    content,
    plainText,
    operator,
  });
  return response.data;
};

export const getComments = async (): Promise<Comment[]> => {
  const response = await api.get<Comment[]>('/comments');
  return response.data;
};

export const createComment = async (
  data: CreateCommentData
): Promise<Comment> => {
  const response = await api.post<Comment>('/comments', data);
  return response.data;
};

export const addReply = async (
  commentId: string,
  content: string,
  author: string
): Promise<CommentReply> => {
  const response = await api.post<CommentReply>(
    `/comments/${commentId}/replies`,
    {
      content,
      author,
    }
  );
  return response.data;
};

export const resolveComment = async (
  commentId: string,
  operator: string
): Promise<Comment> => {
  const response = await api.put<Comment>(`/comments/${commentId}/resolve`, {
    operator,
  });
  return response.data;
};

export const getVersions = async (): Promise<Version[]> => {
  const response = await api.get<Version[]>('/versions');
  return response.data;
};

export const saveVersion = async (
  content: string,
  createdBy: string,
  description?: string
): Promise<Version> => {
  const response = await api.post<Version>('/versions', {
    content,
    createdBy,
    description,
  });
  return response.data;
};

export const getVersion = async (id: string): Promise<Version> => {
  const response = await api.get<Version>(`/versions/${id}`);
  return response.data;
};

export const getDiff = async (
  baseId: string,
  targetId: string
): Promise<DiffResult> => {
  const response = await api.get<DiffResult>('/versions/diff', {
    params: {
      baseId,
      targetId,
    },
  });
  return response.data;
};
