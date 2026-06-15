const flowers = [
  {
    id: 1,
    name: '红玫瑰',
    category: 'rose',
    price: 15,
    stock: 80,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20red%20roses%20bouquet%20photography&image_size=square_hd',
    description: '热情似火的红玫瑰，象征着热烈的爱情'
  },
  {
    id: 2,
    name: '粉玫瑰',
    category: 'rose',
    price: 18,
    stock: 60,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20pink%20roses%20bouquet%20photography&image_size=square_hd',
    description: '温柔淡雅的粉玫瑰，代表着初恋与感动'
  },
  {
    id: 3,
    name: '白百合',
    category: 'lily',
    price: 25,
    stock: 40,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20white%20lilies%20bouquet%20photography&image_size=square_hd',
    description: '纯洁高雅的白百合，寓意百年好合'
  },
  {
    id: 4,
    name: '黄百合',
    category: 'lily',
    price: 22,
    stock: 35,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20yellow%20lilies%20bouquet%20photography&image_size=square_hd',
    description: '明亮温暖的黄百合，象征财富与高贵'
  },
  {
    id: 5,
    name: '粉郁金香',
    category: 'tulip',
    price: 20,
    stock: 50,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20pink%20tulips%20bouquet%20photography&image_size=square_hd',
    description: '娇艳欲滴的粉郁金香，代表爱的告白'
  },
  {
    id: 6,
    name: '紫郁金香',
    category: 'tulip',
    price: 28,
    stock: 30,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20purple%20tulips%20bouquet%20photography&image_size=square_hd',
    description: '神秘高贵的紫郁金香，象征忠贞的爱情'
  },
  {
    id: 7,
    name: '向日葵',
    category: 'mixed',
    price: 12,
    stock: 100,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20sunflowers%20bouquet%20photography&image_size=square_hd',
    description: '阳光灿烂的向日葵，寓意积极向上'
  },
  {
    id: 8,
    name: '康乃馨',
    category: 'mixed',
    price: 8,
    stock: 90,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20carnations%20bouquet%20photography&image_size=square_hd',
    description: '温馨典雅的康乃馨，代表母爱与感恩'
  },
  {
    id: 9,
    name: '洋桔梗',
    category: 'mixed',
    price: 16,
    stock: 45,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20eustoma%20flowers%20bouquet%20photography&image_size=square_hd',
    description: '清新脱俗的洋桔梗，象征不变的爱'
  },
  {
    id: 10,
    name: '满天星',
    category: 'mixed',
    price: 10,
    stock: 70,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20babys%20breath%20flowers%20bouquet%20photography&image_size=square_hd',
    description: '如梦如幻的满天星，代表思念与清纯'
  },
  {
    id: 11,
    name: '混合花束A',
    category: 'mixed',
    price: 35,
    stock: 25,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20mixed%20flowers%20bouquet%20roses%20lilies%20photography&image_size=square_hd',
    description: '玫瑰与百合的完美搭配，浪漫典雅'
  },
  {
    id: 12,
    name: '混合花束B',
    category: 'mixed',
    price: 30,
    stock: 20,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20mixed%20flowers%20bouquet%20tulips%20sunflowers%20photography&image_size=square_hd',
    description: '郁金香与向日葵的活力组合，阳光明媚'
  }
];

const orders = [];

function getFlowers() {
  return flowers;
}

function getFlowerById(id) {
  return flowers.find(flower => flower.id === id);
}

function addOrder(order) {
  const newOrder = {
    id: orders.length + 1,
    ...order,
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  return newOrder;
}

function getOrderById(id) {
  return orders.find(order => order.id === id);
}

function validateBouquetStock(bouquetItems) {
  for (const item of bouquetItems) {
    const flower = getFlowerById(item.flowerId);
    if (!flower) {
      return { valid: false, message: `鲜花ID ${item.flowerId} 不存在` };
    }
    if (flower.stock < item.quantity) {
      return { valid: false, message: `${flower.name} 库存不足，当前库存: ${flower.stock}` };
    }
  }
  return { valid: true };
}

module.exports = {
  flowers,
  orders,
  getFlowers,
  getFlowerById,
  addOrder,
  getOrderById,
  validateBouquetStock
};
