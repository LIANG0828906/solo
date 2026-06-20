export async function get<T>(key: string): Promise<T | null> {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to get item from localStorage (key: ${key}):`, error);
    return null;
  }
}

export async function set<T>(key: string, value: T): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Failed to set item in localStorage (key: ${key}):`, error);
    throw error;
  }
}

export async function remove(key: string): Promise<void> {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove item from localStorage (key: ${key}):`, error);
    throw error;
  }
}
