export interface CoursePackage {
  id: string;
  name: string;
  hours: number;
}

export interface StudentCoursePackage {
  packageId: string;
  packageName: string;
  remainingHours: number;
  totalHours: number;
}

export interface ConsumeRecord {
  id: string;
  studentId: string;
  packageId: string;
  packageName: string;
  hours: number;
  note: string;
  timestamp: string;
}

export interface RenewRecord {
  id: string;
  studentId: string;
  packageId: string;
  packageName: string;
  addedHours: number;
  timestamp: string;
}

export interface TransferRecord {
  id: string;
  studentId: string;
  fromPackageId: string;
  fromPackageName: string;
  toPackageId: string;
  toPackageName: string;
  hours: number;
  timestamp: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  packages: StudentCoursePackage[];
  status: 'active' | 'inactive';
  createdAt: string;
  lastConsumeTime: string | null;
}

export type SortOrder = 'desc' | 'asc' | null;
