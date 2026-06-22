export interface Draft {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  platform: '微博' | '小红书' | '抖音' | '微信公众号' | string;
  createdAt: string;
}

export interface ScheduledItem {
  id: string;
  draftId: string;
  date: string;
  timeSlot?: string;
}

export interface ScheduledItemWithDraft extends ScheduledItem {
  draft: Draft;
}

export interface ScheduleMap {
  [dateKey: string]: ScheduledItemWithDraft[];
}

export interface PlatformStats {
  platform: string;
  bestTimeSlots: string[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
