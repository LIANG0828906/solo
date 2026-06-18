import type {
  Meeting,
  Todo,
  CreateMeetingRequest,
  UpdateNotesRequest,
  UpdateTodoRequest,
  QueuedRequest,
  NetworkStatus,
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';
const REQUEST_TIMEOUT = 200;
const MAX_RETRY_COUNT = 5;

class ApiClient {
  private queue: QueuedRequest[] = [];
  private networkStatus: NetworkStatus = 'online';
  private isProcessingQueue = false;
  private queueListeners: Set<(queue: QueuedRequest[]) => void> = new Set();
  private networkListeners: Set<(status: NetworkStatus) => void> = new Set();

  constructor() {
    this.initializeNetworkListeners();
    this.loadQueueFromStorage();
  }

  private initializeNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      this.networkStatus = navigator.onLine ? 'online' : 'offline';

      window.addEventListener('online', () => {
        this.networkStatus = 'online';
        this.notifyNetworkListeners('online');
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.networkStatus = 'offline';
        this.notifyNetworkListeners('offline');
      });
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem('api_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveQueueToStorage(): void {
    try {
      localStorage.setItem('api_queue', JSON.stringify(this.queue));
    } catch {
      console.warn('Failed to save queue to localStorage');
    }
  }

  private enqueueRequest(url: string, options: RequestInit): void {
    const request: QueuedRequest = {
      id: this.generateRequestId(),
      url,
      options,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(request);
    this.saveQueueToStorage();
    this.notifyQueueListeners();
  }

  private removeFromQueue(requestId: string): void {
    this.queue = this.queue.filter((req) => req.id !== requestId);
    this.saveQueueToStorage();
    this.notifyQueueListeners();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.networkStatus !== 'online') {
      return;
    }

    this.isProcessingQueue = true;

    while (this.queue.length > 0 && this.networkStatus === 'online') {
      const request = this.queue[0];

      try {
        await this.fetchWithTimeout(request.url, request.options, false);
        this.removeFromQueue(request.id);
      } catch (_error) {
        request.retryCount++;

        if (request.retryCount >= MAX_RETRY_COUNT) {
          console.error(`Request ${request.id} failed after ${MAX_RETRY_COUNT} retries, removing from queue`);
          this.removeFromQueue(request.id);
        } else {
          this.saveQueueToStorage();
          break;
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    shouldQueue: boolean = true
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        if (shouldQueue) {
          this.enqueueRequest(url, options);
          throw new Error('Request timed out, added to queue for retry');
        }
        throw new Error('Request timed out');
      }

      if (shouldQueue && this.networkStatus === 'offline') {
        this.enqueueRequest(url, options);
        throw new Error('Network offline, added to queue for retry');
      }

      if (shouldQueue) {
        this.enqueueRequest(url, options);
      }

      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    shouldQueue: boolean = true
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await this.fetchWithTimeout(url, mergedOptions, shouldQueue);
    return response.json() as Promise<T>;
  }

  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  public getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  public subscribeToQueue(callback: (queue: QueuedRequest[]) => void): () => void {
    this.queueListeners.add(callback);
    return () => this.queueListeners.delete(callback);
  }

  public subscribeToNetwork(callback: (status: NetworkStatus) => void): () => void {
    this.networkListeners.add(callback);
    return () => this.networkListeners.delete(callback);
  }

  private notifyQueueListeners(): void {
    this.queueListeners.forEach((callback) => callback([...this.queue]));
  }

  private notifyNetworkListeners(status: NetworkStatus): void {
    this.networkListeners.forEach((callback) => callback(status));
  }

  public async createMeeting(data: CreateMeetingRequest): Promise<Meeting> {
    return this.request<Meeting>('/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getMeetings(): Promise<Meeting[]> {
    return this.request<Meeting[]>('/meetings', {
      method: 'GET',
    }, false);
  }

  public async getMeeting(id: string): Promise<Meeting> {
    if (!id) {
      throw new Error('Meeting ID is required');
    }
    return this.request<Meeting>(`/meetings/${id}`, {
      method: 'GET',
    }, false);
  }

  public async updateNotes(id: string, notes: string): Promise<Meeting> {
    if (!id) {
      throw new Error('Meeting ID is required');
    }

    const data: UpdateNotesRequest = { notes };
    return this.request<Meeting>(`/meetings/${id}/notes`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async downloadPdf(id: string): Promise<void> {
    if (!id) {
      throw new Error('Meeting ID is required');
    }

    const url = `${API_BASE_URL}/meetings/${id}/pdf`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
      }, false);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `meeting-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  }

  public async getTodos(): Promise<Todo[]> {
    return this.request<Todo[]>('/todos', {
      method: 'GET',
    }, false);
  }

  public async getMeetingTodos(id: string): Promise<Todo[]> {
    if (!id) {
      throw new Error('Meeting ID is required');
    }
    return this.request<Todo[]>(`/meetings/${id}/todos`, {
      method: 'GET',
    }, false);
  }

  public async updateTodo(id: string, data: UpdateTodoRequest): Promise<Todo> {
    if (!id) {
      throw new Error('Todo ID is required');
    }

    return this.request<Todo>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public clearQueue(): void {
    this.queue = [];
    this.saveQueueToStorage();
    this.notifyQueueListeners();
  }

  public retryQueue(): void {
    if (this.networkStatus === 'online') {
      this.processQueue();
    }
  }
}

export const apiClient = new ApiClient();

export const createMeeting = (data: CreateMeetingRequest): Promise<Meeting> =>
  apiClient.createMeeting(data);

export const getMeetings = (): Promise<Meeting[]> =>
  apiClient.getMeetings();

export const getMeeting = (id: string): Promise<Meeting> =>
  apiClient.getMeeting(id);

export const updateNotes = (id: string, notes: string): Promise<Meeting> =>
  apiClient.updateNotes(id, notes);

export const downloadPdf = (id: string): Promise<void> =>
  apiClient.downloadPdf(id);

export const getTodos = (): Promise<Todo[]> =>
  apiClient.getTodos();

export const getMeetingTodos = (id: string): Promise<Todo[]> =>
  apiClient.getMeetingTodos(id);

export const updateTodo = (id: string, data: UpdateTodoRequest): Promise<Todo> =>
  apiClient.updateTodo(id, data);
