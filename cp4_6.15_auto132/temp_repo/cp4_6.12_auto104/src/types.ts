export type Genre = '动作' | '喜剧' | '剧情' | '科幻' | '恐怖' | '动画' | '其他';

export interface Movie {
  id: string;
  title: string;
  country: string;
  year: number;
  date: string;
  genre: Genre[];
  rating: number;
  comment: string;
}
