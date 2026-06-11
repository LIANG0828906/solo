export interface LessonContent {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: LessonContent;
}

export interface Chapter {
  id: string;
  title: string;
  expanded: boolean;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
  createdAt: number;
  updatedAt: number;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  timestamp: number;
}

export interface CourseProgress {
  courseId: string;
  lessons: LessonProgress[];
  lastStudyTime: number;
  completed: boolean;
}
