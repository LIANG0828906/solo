export interface FoodJournal {
  id: string;
  restaurantName: string;
  photos: string[];
  cuisineTags: string[];
  rating: number;
  review: string;
  latitude: number;
  longitude: number;
  tasteProfile: {
    sour: number;
    sweet: number;
    spicy: number;
    salty: number;
    umami: number;
  };
  createdAt: string;
}
