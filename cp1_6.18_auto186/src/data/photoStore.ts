export interface Photo {
  id: string;
  title: string;
  category: 'portrait' | 'landscape' | 'still_life';
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  serviceType: 'portrait' | 'wedding' | 'product';
  date: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  photoId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface Stats {
  totalPhotos: number;
  totalBookings: number;
  totalComments: number;
}

let photos: Photo[] = [
  {
    id: 'demo-1',
    title: '城市黄昏',
    category: 'landscape',
    url: 'https://picsum.photos/seed/landscape1/1200/800',
    thumbnailUrl: 'https://picsum.photos/seed/landscape1/400/600',
    width: 1200,
    height: 800,
    createdAt: new Date('2025-01-15').toISOString()
  },
  {
    id: 'demo-2',
    title: '静谧时光',
    category: 'portrait',
    url: 'https://picsum.photos/seed/portrait1/800/1200',
    thumbnailUrl: 'https://picsum.photos/seed/portrait1/400/600',
    width: 800,
    height: 1200,
    createdAt: new Date('2025-02-20').toISOString()
  },
  {
    id: 'demo-3',
    title: '静物之美',
    category: 'still_life',
    url: 'https://picsum.photos/seed/still1/1000/1000',
    thumbnailUrl: 'https://picsum.photos/seed/still1/400/400',
    width: 1000,
    height: 1000,
    createdAt: new Date('2025-03-10').toISOString()
  },
  {
    id: 'demo-4',
    title: '山川壮丽',
    category: 'landscape',
    url: 'https://picsum.photos/seed/landscape2/1600/900',
    thumbnailUrl: 'https://picsum.photos/seed/landscape2/400/300',
    width: 1600,
    height: 900,
    createdAt: new Date('2025-04-05').toISOString()
  },
  {
    id: 'demo-5',
    title: '光影人像',
    category: 'portrait',
    url: 'https://picsum.photos/seed/portrait2/900/1200',
    thumbnailUrl: 'https://picsum.photos/seed/portrait2/400/533',
    width: 900,
    height: 1200,
    createdAt: new Date('2025-05-12').toISOString()
  },
  {
    id: 'demo-6',
    title: '咖啡时光',
    category: 'still_life',
    url: 'https://picsum.photos/seed/still2/1200/900',
    thumbnailUrl: 'https://picsum.photos/seed/still2/400/300',
    width: 1200,
    height: 900,
    createdAt: new Date('2025-06-18').toISOString()
  }
];

let bookings: Booking[] = [];
let comments: Comment[] = [
  {
    id: 'c1',
    photoId: 'demo-1',
    username: '林小雨',
    content: '构图太美了，光影处理得非常棒！',
    createdAt: new Date('2025-06-10').toISOString()
  },
  {
    id: 'c2',
    photoId: 'demo-2',
    username: '张明',
    content: '摄影师很专业，拍摄体验非常好，推荐给大家！',
    createdAt: new Date('2025-06-15').toISOString()
  }
];

export const photoStore = {
  getPhotos: (category?: string): Photo[] => {
    if (!category || category === 'all') return [...photos];
    return photos.filter(p => p.category === category);
  },

  getPhotoById: (id: string): Photo | undefined => {
    return photos.find(p => p.id === id);
  },

  addPhotos: (newPhotos: Photo[]): Photo[] => {
    photos = [...newPhotos, ...photos];
    return newPhotos;
  },

  deletePhoto: (id: string): boolean => {
    const idx = photos.findIndex(p => p.id === id);
    if (idx !== -1) {
      photos.splice(idx, 1);
      comments = comments.filter(c => c.photoId !== id);
      return true;
    }
    return false;
  },

  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>): Booking => {
    const newBooking: Booking = {
      ...booking,
      id: `booking-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    bookings.push(newBooking);
    return newBooking;
  },

  getBookings: (): Booking[] => [...bookings],

  getComments: (photoId?: string): Comment[] => {
    let result = [...comments];
    if (photoId) {
      result = result.filter(c => c.photoId === photoId);
    }
    return result.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  addComment: (data: Omit<Comment, 'id' | 'createdAt'>): Comment => {
    const newComment: Comment = {
      ...data,
      id: `comment-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    comments.push(newComment);
    return newComment;
  },

  getStats: (): Stats => ({
    totalPhotos: photos.length,
    totalBookings: bookings.length,
    totalComments: comments.length
  })
};
