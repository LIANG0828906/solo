export type ActivityType = '城市漫步' | '海滩度假' | '徒步登山' | '商务出差' | '滑雪旅行';

export type Category = '服装' | '洗护' | '电子' | '证件' | '医疗' | '其他';

export interface Item {
  id: string;
  name: string;
  category: Category;
  weight: number;
  quantity: number;
  packed: boolean;
  order: number;
}

export interface Trip {
  id: string;
  destination: string;
  days: number;
  activityTypes: ActivityType[];
  items: Item[];
  createdAt: number;
}
