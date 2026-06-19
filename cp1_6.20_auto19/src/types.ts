export interface Profile {
  id: string;
  avatar: string;
  name: string;
  bio: string;
  website: string;
}

export interface Skill {
  id: string;
  name: string;
  mastery: number;
  children?: Skill[];
}

export interface Project {
  id: string;
  title: string;
  year: number;
  shortDescription: string;
  fullDescription: string;
  tags: string[];
}

export interface AppData {
  profile: Profile;
  skills: Skill[];
  projects: Project[];
}
