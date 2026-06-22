import type { Profile, Skill, Project, AppData } from './types';

export async function getProfile(): Promise<AppData> {
  const response = await fetch('/api/profile', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export async function updateProfile(
  profile: Omit<Profile, 'id'>
): Promise<{ success: boolean; profile: Profile }> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });
  return response.json();
}

export async function updateSkills(
  skills: Skill[]
): Promise<{ success: boolean; skills: Skill[] }> {
  const response = await fetch('/api/skills', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(skills),
  });
  return response.json();
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch('/api/projects', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export async function addProject(
  project: Omit<Project, 'id'>
): Promise<{ success: boolean; project: Project }> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  });
  return response.json();
}

export async function updateProject(
  id: string,
  project: Omit<Project, 'id'>
): Promise<{ success: boolean; project: Project }> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  });
  return response.json();
}

export async function deleteProject(
  id: string
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export async function getPublicProfile(id: string): Promise<AppData> {
  const response = await fetch(`/api/public/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}
