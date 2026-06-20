export interface Artwork {
  id: string;
  name: string;
  artist: string;
  year: number;
  dimensions: string;
  imageUrl: string;
  style: string;
  era: string;
}

export interface Annotation {
  id: string;
  artworkId: string;
  tag: string;
  comment: string;
  createdAt: string;
}

export const artworks: Artwork[] = [
  {
    id: '1',
    name: '星月夜',
    artist: '文森特·梵高',
    year: 1889,
    dimensions: '73.7 × 92.1 cm',
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80',
    style: '后印象派',
    era: '19世纪',
  },
  {
    id: '2',
    name: '蒙娜丽莎',
    artist: '列奥纳多·达·芬奇',
    year: 1503,
    dimensions: '77 × 53 cm',
    imageUrl: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800&q=80',
    style: '文艺复兴',
    era: '16世纪',
  },
  {
    id: '3',
    name: '呐喊',
    artist: '爱德华·蒙克',
    year: 1893,
    dimensions: '91 × 73.5 cm',
    imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&q=80',
    style: '表现主义',
    era: '19世纪',
  },
  {
    id: '4',
    name: '戴珍珠耳环的少女',
    artist: '约翰内斯·维米尔',
    year: 1665,
    dimensions: '44.5 × 39 cm',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
    style: '巴洛克',
    era: '17世纪',
  },
  {
    id: '5',
    name: '向日葵',
    artist: '文森特·梵高',
    year: 1888,
    dimensions: '92.1 × 73 cm',
    imageUrl: 'https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=800&q=80',
    style: '后印象派',
    era: '19世纪',
  },
  {
    id: '6',
    name: '记忆的永恒',
    artist: '萨尔瓦多·达利',
    year: 1931,
    dimensions: '24.1 × 33 cm',
    imageUrl: 'https://images.unsplash.com/photo-1577720643272-265f09367456?w=800&q=80',
    style: '超现实主义',
    era: '20世纪',
  },
  {
    id: '7',
    name: '睡莲',
    artist: '克劳德·莫奈',
    year: 1906,
    dimensions: '89.9 × 94.1 cm',
    imageUrl: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80',
    style: '印象派',
    era: '20世纪',
  },
  {
    id: '8',
    name: '自画像',
    artist: '文森特·梵高',
    year: 1889,
    dimensions: '65 × 54 cm',
    imageUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800&q=80',
    style: '后印象派',
    era: '19世纪',
  },
  {
    id: '9',
    name: '创世纪',
    artist: '米开朗基罗',
    year: 1512,
    dimensions: '280 × 570 cm',
    imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80',
    style: '文艺复兴',
    era: '16世纪',
  },
  {
    id: '10',
    name: '拾穗者',
    artist: '让-弗朗索瓦·米勒',
    year: 1857,
    dimensions: '83.5 × 111 cm',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    style: '现实主义',
    era: '19世纪',
  },
  {
    id: '11',
    name: '吻',
    artist: '古斯塔夫·克里姆特',
    year: 1907,
    dimensions: '180 × 180 cm',
    imageUrl: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800&q=80',
    style: '新艺术运动',
    era: '20世纪',
  },
  {
    id: '12',
    name: '宫娥',
    artist: '迭戈·委拉斯开兹',
    year: 1656,
    dimensions: '318 × 276 cm',
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80',
    style: '巴洛克',
    era: '17世纪',
  },
];

const STORAGE_KEY = 'art_gallery_annotations';

export const loadAnnotations = (): Annotation[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveAnnotations = (annotations: Annotation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
  } catch {
    console.error('Failed to save annotations');
  }
};

export const addAnnotation = (
  artworkId: string,
  tag: string,
  comment: string
): Annotation => {
  const annotations = loadAnnotations();
  const newAnnotation: Annotation = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    artworkId,
    tag,
    comment,
    createdAt: new Date().toISOString(),
  };
  annotations.push(newAnnotation);
  saveAnnotations(annotations);
  return newAnnotation;
};

export const getAnnotationsByArtworkId = (artworkId: string): Annotation[] => {
  return loadAnnotations().filter((a) => a.artworkId === artworkId);
};
