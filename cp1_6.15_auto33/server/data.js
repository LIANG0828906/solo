import { v4 as uuidv4 } from 'uuid';

export const flowers = [
  {
    id: '1',
    name: '红玫瑰',
    category: 'rose',
    price: 15,
    stock: 3,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20red%20roses%20bouquet%20close%20up%20soft%20lighting%20floral%20photography&image_size=square_hd',
    description: '热情似火的红玫瑰，象征着热烈的爱情'
  },
  {
    id: '2',
    name: '粉玫瑰',
    category: 'rose',
    price: 18,
    stock: 0,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicate%20pink%20roses%20bouquet%20romantic%20soft%20focus%20floral%20photography&image_size=square_hd',
    description: '温柔淡雅的粉玫瑰，代表着初恋与感动'
  },
  {
    id: '3',
    name: '白百合',
    category: 'lily',
    price: 25,
    stock: 12,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pure%20white%20lilies%20bouquet%20elegant%20studio%20lighting%20floral%20photography&image_size=square_hd',
    description: '纯洁高雅的白百合，寓意百年好合'
  },
  {
    id: '4',
    name: '黄百合',
    category: 'lily',
    price: 22,
    stock: 2,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bright%20yellow%20lilies%20bouquet%20sunny%20warm%20floral%20photography&image_size=square_hd',
    description: '明亮温暖的黄百合，象征财富与高贵'
  },
  {
    id: '5',
    name: '粉郁金香',
    category: 'tulip',
    price: 20,
    stock: 0,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tender%20pink%20tulips%20bouquet%20spring%20garden%20floral%20photography&image_size=square_hd',
    description: '娇艳欲滴的粉郁金香，代表爱的告白'
  },
  {
    id: '6',
    name: '紫郁金香',
    category: 'tulip',
    price: 28,
    stock: 5,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=royal%20purple%20tulips%20bouquet%20dramatic%20lighting%20floral%20photography&image_size=square_hd',
    description: '神秘高贵的紫郁金香，象征忠贞的爱情'
  },
  {
    id: '7',
    name: '向日葵',
    category: 'mixed',
    price: 12,
    stock: 35,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cheerful%20sunflowers%20bouquet%20golden%20sunlight%20floral%20photography&image_size=square_hd',
    description: '阳光灿烂的向日葵，寓意积极向上'
  },
  {
    id: '8',
    name: '康乃馨',
    category: 'mixed',
    price: 8,
    stock: 0,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=soft%20carnations%20bouquet%20pastel%20colors%20floral%20photography&image_size=square_hd',
    description: '温馨典雅的康乃馨，代表母爱与感恩'
  },
  {
    id: '9',
    name: '洋桔梗',
    category: 'mixed',
    price: 16,
    stock: 8,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20eustoma%20flowers%20bouquet%20lavender%20tones%20floral%20photography&image_size=square_hd',
    description: '清新脱俗的洋桔梗，象征不变的爱'
  },
  {
    id: '10',
    name: '满天星',
    category: 'mixed',
    price: 10,
    stock: 50,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dreamy%20babys%20breath%20gypsophila%20bouquet%20ethereal%20floral%20photography&image_size=square_hd',
    description: '如梦如幻的满天星，代表思念与清纯'
  },
  {
    id: '11',
    name: '浪漫混搭',
    category: 'mixed',
    price: 35,
    stock: 3,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20mixed%20roses%20lilies%20bouquet%20romantic%20floral%20arrangement&image_size=square_hd',
    description: '玫瑰与百合的完美搭配，浪漫典雅'
  },
  {
    id: '12',
    name: '阳光花篮',
    category: 'mixed',
    price: 30,
    stock: 15,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vibrant%20mixed%20tulips%20sunflowers%20basket%20floral%20arrangement&image_size=square_hd',
    description: '郁金香与向日葵的活力组合，阳光明媚'
  }
];

export const orders = [];

export function getFlowers(filters = {}) {
  const { category, minPrice, maxPrice } = filters;
  return flowers.filter(f => {
    if (category && f.category !== category) return false;
    if (minPrice !== undefined && f.price < Number(minPrice)) return false;
    if (maxPrice !== undefined && f.price > Number(maxPrice)) return false;
    return true;
  });
}

export function getFlowerById(id) {
  return flowers.find(f => f.id === id);
}

export function validateBouquetStock(bouquetItems) {
  for (const item of bouquetItems) {
    const flower = getFlowerById(item.flowerId);
    if (!flower) {
      return { valid: false, message: `鲜花ID ${item.flowerId} 不存在` };
    }
    if (flower.stock < item.quantity) {
      return { valid: false, message: `${flower.name} 库存不足，当前仅剩 ${flower.stock} 朵` };
    }
  }
  return { valid: true };
}

export function createOrder(bouquet, deliveryInfo) {
  const bouquetItems = bouquet.items || [];
  const validation = validateBouquetStock(bouquetItems);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  for (const item of bouquetItems) {
    const flower = getFlowerById(item.flowerId);
    if (flower) {
      flower.stock -= item.quantity;
    }
  }

  const newOrder = {
    id: uuidv4().slice(0, 8).toUpperCase(),
    bouquet: {
      id: uuidv4().slice(0, 8),
      items: bouquetItems.map(item => {
        const flower = getFlowerById(item.flowerId);
        return {
          flowerId: item.flowerId,
          quantity: item.quantity,
          flower: { ...flower }
        };
      }),
      totalPrice: bouquet.totalPrice
    },
    deliveryInfo,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  return newOrder;
}

export function getOrderById(id) {
  return orders.find(o => o.id === id);
}
