import type {
  Family,
  Record,
  WeeklyReport,
  Comment,
  PaginatedResponse,
  LikeResponse,
  CreateFamilyRequest,
  JoinFamilyRequest,
  CreateRecordRequest,
  AddCommentRequest,
  LikeRequest,
} from '@/types';

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络请求失败，请检查网络连接');
  }
}

export async function createFamily(
  data: CreateFamilyRequest
): Promise<Family> {
  return request<Family>('/api/families', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function joinFamily(
  data: JoinFamilyRequest
): Promise<Family> {
  return request<Family>('/api/families/join', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getFamily(id: string): Promise<Family> {
  return request<Family>(`/api/families/${id}`);
}

export async function getFamilies(): Promise<Family[]> {
  return request<Family[]>('/api/families');
}

export async function getRecords(
  familyId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Record>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  return request<PaginatedResponse<Record>>(
    `/api/families/${familyId}/records?${params}`
  );
}

export async function createRecord(
  familyId: string,
  data: CreateRecordRequest
): Promise<Record> {
  const formData = new FormData();
  formData.append('content', data.content);
  formData.append('mood', data.mood);
  formData.append('memberId', data.memberId);
  formData.append('memberName', data.memberName);
  formData.append('memberAvatarColor', data.memberAvatarColor);
  if (data.image) {
    formData.append('image', data.image);
  }

  return request<Record>(`/api/families/${familyId}/records`, {
    method: 'POST',
    headers: {},
    body: formData,
  });
}

export async function likeRecord(
  recordId: string,
  data: LikeRequest
): Promise<LikeResponse> {
  return request<LikeResponse>(`/api/records/${recordId}/like`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addComment(
  recordId: string,
  data: AddCommentRequest
): Promise<Comment> {
  return request<Comment>(`/api/records/${recordId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getWeeklyReport(
  familyId: string
): Promise<WeeklyReport> {
  return request<WeeklyReport>(`/api/families/${familyId}/weekly`);
}

export async function getRandomRecord(
  familyId: string
): Promise<Record> {
  return request<Record>(`/api/families/${familyId}/random`);
}
