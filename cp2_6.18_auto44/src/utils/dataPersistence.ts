const STORAGE_KEYS = {
  PROJECTS: 'collabtask_projects',
  TASKS: 'collabtask_tasks',
  MEMBERS: 'collabtask_members',
  CURRENT_PROJECT_ID: 'collabtask_currentProjectId',
  ACTIVITY_LOGS: 'collabtask_activityLogs',
};

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
}

export function clearStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

export { STORAGE_KEYS };
