import axios from 'axios';

export interface FosterFamily {
  id: string;
  name: string;
  avatar: string;
  description: string;
  petTypes: string[];
  dailyRate: number;
  photos: string[];
  rating: number;
  fosterCount: number;
  services: string[];
  walkDuration: string;
  verified: boolean;
}

export interface ScheduleTask {
  id: string;
  fosterFamilyId: string;
  petName: string;
  date: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  type: 'feed' | 'walk' | 'medicine' | 'other';
  description: string;
}

export interface Message {
  id: string;
  fosterId: string;
  senderRole: 'owner' | 'foster';
  content: string;
  photos: string[];
  timestamp: string;
  read: boolean;
}

export interface FosterApplication {
  id: string;
  familyId: string;
  ownerName: string;
  petName: string;
  petType: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export async function getFosterList(): Promise<FosterFamily[]> {
  const { data } = await api.get('/foster');
  return data;
}

export async function getFosterDetail(id: string): Promise<FosterFamily> {
  const { data } = await api.get(`/foster/${id}`);
  return data;
}

export async function submitApplication(payload: {
  familyId: string;
  ownerName: string;
  petName: string;
  petType: string;
  startDate: string;
  endDate: string;
}): Promise<{ success: boolean; application: FosterApplication }> {
  const { data } = await api.post('/foster/apply', payload);
  return data;
}

export async function getSchedule(
  fosterFamilyId: string,
  weekStart: string
): Promise<ScheduleTask[]> {
  const { data } = await api.get('/schedule', {
    params: { fosterFamilyId, weekStart },
  });
  return data;
}

export async function createTask(task: Omit<ScheduleTask, 'id'>): Promise<{ success: boolean; task: ScheduleTask }> {
  const { data } = await api.post('/schedule', task);
  return data;
}

export async function updateTask(
  id: string,
  updates: Partial<ScheduleTask>
): Promise<{ success: boolean; task: ScheduleTask }> {
  const { data } = await api.put(`/schedule/${id}`, updates);
  return data;
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete(`/schedule/${id}`);
  return data;
}

export async function getMessages(fosterId: string): Promise<Message[]> {
  const { data } = await api.get('/message', { params: { fosterId } });
  return data;
}

export async function sendMessage(payload: {
  fosterId: string;
  senderRole: 'owner' | 'foster';
  content: string;
  photos?: string[];
}): Promise<{ success: boolean; message: Message }> {
  const { data } = await api.post('/message', payload);
  return data;
}

export async function markMessageRead(id: string): Promise<{ success: boolean }> {
  const { data } = await api.put(`/message/${id}/read`);
  return data;
}

export async function uploadPhotos(
  files: File[],
  onProgress?: (fileName: string, percent: number) => void
): Promise<{ success: boolean; photos: string[] }> {
  const allPhotos: string[] = [];

  for (const file of files) {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('photos', file);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && onProgress) {
          const percent = Math.round((evt.loaded * 100) / evt.total);
          onProgress(file.name, percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.photos && res.photos.length > 0) {
              allPhotos.push(...res.photos);
            }
            if (onProgress) onProgress(file.name, 100);
            resolve();
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.open('POST', '/api/message/upload');
      xhr.send(formData);
    });
  }

  return { success: true, photos: allPhotos };
}
