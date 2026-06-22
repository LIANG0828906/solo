export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

export enum VaccineStatus {
  FULLY_VACCINATED = 'fully_vaccinated',
  PARTIALLY_VACCINATED = 'partially_vaccinated',
  NOT_VACCINATED = 'not_vaccinated',
}

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum Stage {
  SUBMISSION = 0,
  REVIEW = 1,
  HOME_VISIT = 2,
  CONTRACT = 3,
  COMPLETION = 4,
}

export const STAGE_NAMES: Record<Stage, string> = {
  [Stage.SUBMISSION]: '提交申请',
  [Stage.REVIEW]: '资质审核',
  [Stage.HOME_VISIT]: '家访预约',
  [Stage.CONTRACT]: '领养签约',
  [Stage.COMPLETION]: '完成领养',
};

export const PERSONALITY_TAGS = [
  '温顺',
  '活泼',
  '粘人',
  '独立',
  '安静',
  '友好',
  '好奇',
  '勇敢',
] as const;

export const BREEDS = [
  '中华田园犬',
  '金毛寻回犬',
  '拉布拉多',
  '柯基',
  '柴犬',
  '哈士奇',
  '萨摩耶',
  '布偶猫',
  '英国短毛猫',
  '美国短毛猫',
  '橘猫',
  '狸花猫',
] as const;

export interface Pet {
  id: string;
  name: string;
  breed: string;
  ageYears: number;
  ageMonths: number;
  gender: Gender;
  weight: number;
  neutered: boolean;
  vaccineStatus: VaccineStatus;
  personalityTags: string[];
  photos: string[];
  description: string;
  status: 'available' | 'adopted' | 'pending';
  createdAt: string;
}

export interface AdoptionApplication {
  id: string;
  petId: string;
  applicantName: string;
  contact: string;
  housingType: string;
  hasOtherPets: boolean;
  reason: string;
  status: ApplicationStatus;
  feedback: string;
  createdAt: string;
}

export interface StageInfo {
  stage: Stage;
  expectedDate: string | null;
  actualDate: string | null;
  notes: string;
}

export interface AdoptionProgress {
  id: string;
  applicationId: string;
  stages: StageInfo[];
  currentStage: Stage;
}

export interface FilterOptions {
  breeds: string[];
  ageRange: [number, number] | null;
  personalityTags: string[];
}
