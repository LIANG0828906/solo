const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

const CUSTOMER_PERSONALITIES = [
  {
    type: 'generous',
    name: '豪爽客',
    icon: '💰',
    discountRate: 0.9,
    requiresGift: false,
    bonusItems: [],
    successBonus: 0,
    dialogPool: [
      '这小玩意儿不错，来一个！',
      '出门在外，图个吉利，就这个价！',
      '钱不是问题，货好就行。',
      '老板爽快人，我也是痛快人，成交！',
      '这点碎银子算什么，拿着！',
      '看你走街串巷不容易，不还价了。',
      '好东西值得好价钱，收着吧。',
      '我这人性子急，不喜欢磨叽，就这价！',
      '今天心情好，给你凑个整。',
      '手艺不错，多赏你几个铜板。',
      '行走江湖，讲究的就是痛快！',
      '这点钱，洒洒水啦！',
      '做生意嘛，和气生财，就按你说的来。',
      '难得看上眼，贵点也值了。',
      '出门带的就是散碎银两，不用找了。',
      '你这货我要了，别啰嗦。',
      '俺们山东人做买卖，就是实在！',
      '这点银子，权当交个朋友。',
      '东西好，价钱自然也好说。',
      '下次还来照顾你生意！'
    ]
  },
  {
    type: 'stingy',
    name: '吝啬客',
    icon: '🪙',
    discountRate: 0.6,
    requiresGift: true,
    bonusItems: [],
    successBonus: 0,
    dialogPool: [
      '这也太贵了！便宜点！',
      '隔壁摊才卖一半的价！',
      '再便宜些，不然我走了啊。',
      '你这货根本不值这个钱！',
      '便宜点，我多介绍几个客人来。',
      '都是老主顾了，打个折呗？',
      '这东西做工粗糙，最多值这个数。',
      '我身上就这么多铜板，你看着办。',
      '再送个小玩意儿，不然不买。',
      '别家都送东西，你怎么不送？',
      '便宜点便宜点，下次还来！',
      '我可是问了好几家才来你这的。',
      '这价钱能买俩了都！',
      '少赚点嘛，薄利多销啊！',
      '你这价码，吓死人咯！',
      '抹个零头，图个吉利。',
      '能不能再少点？凑个整？',
      '这料子不值钱啊，你可别蒙我。',
      '再降点，我今天就带了这么多。',
      '送个小的，我给你宣传宣传！'
    ]
  },
  {
    type: 'child',
    name: '稚子客',
    icon: '🪁',
    discountRate: 0.8,
    requiresGift: false,
    bonusItems: ['糖画', '泥人'],
    successBonus: 0.2,
    dialogPool: [
      '叔叔，这个泥人好可爱呀~',
      '我要那个糖画！小兔子的！',
      '娘亲给我的压岁钱，刚好够买这个！',
      '哇！这个团扇上有蝴蝶！',
      '爷爷爷爷，我要这个风筝！',
      '这个香囊香香的，我要给娘亲~',
      '叔叔，这个能便宜点吗？我只有这么多钱...',
      '我要把这个泥人送给隔壁的小花！',
      '这个拨浪鼓咚咚响，好好玩！',
      '爹爹说，考了第一名就给我买！',
      '好漂亮的玉佩！我要给爹爹看！',
      '这个木偶会动！太神奇了！',
      '我攒了好久的铜板才够的！',
      '奶奶说，这个能辟邪保平安~',
      '叔叔，糖画能不能画个小老虎？',
      '这个竹蜻蜓飞得好高呀！',
      '我要买两个！一个给我，一个给弟弟！',
      '这个绣球好漂亮，我要抛绣球！',
      '泥人张的手艺真棒！跟真的一样！',
      '我要带着这个风筝去踏青！'
    ]
  }
];

app.get('/api/customer', (req, res) => {
  const personality = CUSTOMER_PERSONALITIES[Math.floor(Math.random() * CUSTOMER_PERSONALITIES.length)];
  const dialogIndex = Math.floor(Math.random() * personality.dialogPool.length);
  const customer = {
    id: Date.now() + Math.random(),
    type: personality.type,
    name: personality.name,
    icon: personality.icon,
    discountRate: personality.discountRate,
    requiresGift: personality.requiresGift,
    bonusItems: personality.bonusItems,
    successBonus: personality.successBonus,
    dialog: personality.dialogPool[dialogIndex],
    color: generateCustomerColor()
  };
  res.json(customer);
});

function generateCustomerColor() {
  const colors = [
    { robe: '#8B0000', sash: '#FFD700' },
    { robe: '#191970', sash: '#C0C0C0' },
    { robe: '#006400', sash: '#DEB887' },
    { robe: '#800080', sash: '#FFC0CB' },
    { robe: '#8B4513', sash: '#F5DEB3' },
    { robe: '#2F4F4F', sash: '#AFEEEE' },
    { robe: '#A52A2A', sash: '#FFE4B5' }
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

app.post('/api/trade', (req, res) => {
  const { success, action, basePrice, customerType } = req.body;
  
  let reputationChange = 0;
  let moneyChange = 0;
  
  if (success) {
    let finalPrice = basePrice;
    
    if (action === 'raise') {
      finalPrice = Math.floor(basePrice * 1.2);
      reputationChange = Math.floor(Math.random() * 6) + 5;
    } else if (action === 'normal') {
      finalPrice = basePrice;
      reputationChange = Math.floor(Math.random() * 6) + 8;
    } else if (action === 'gift') {
      finalPrice = Math.floor(basePrice * 0.9);
      reputationChange = Math.floor(Math.random() * 6) + 10;
    }
    
    if (customerType === 'generous') {
      finalPrice = Math.floor(finalPrice * 1.1);
    }
    
    moneyChange = finalPrice;
  } else {
    reputationChange = -(Math.floor(Math.random() * 6) + 5);
    moneyChange = 0;
  }
  
  res.json({
    success,
    moneyChange,
    reputationChange,
    staminaCost: success ? 0 : -10
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
