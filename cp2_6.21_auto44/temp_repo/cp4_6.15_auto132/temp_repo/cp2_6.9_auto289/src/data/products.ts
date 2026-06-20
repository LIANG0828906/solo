import { v4 as uuidv4 } from "uuid";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  catchphrases: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: uuidv4(),
    name: "拨浪鼓",
    price: 5,
    stock: 6,
    catchphrases: [
      "拨浪鼓儿响咚咚，引得孩童笑融融！",
      "手摇鼓声响，欢乐多，拨浪鼓儿笑呵呵！",
      "咚咚锵锵拨浪鼓，孩童闻声齐相聚！",
      "拨浪鼓，咚咚响，买个给娃把福享！",
      "小小拨浪鼓，摇摇响当当，孩童喜洋洋！"
    ]
  },
  {
    id: uuidv4(),
    name: "糖葫芦",
    price: 5,
    stock: 6,
    catchphrases: [
      "卖糖葫芦咯！酸酸甜甜！",
      "冰糖葫芦红似火，一颗一颗甜心窝！",
      "糖葫芦儿甜又酸，咬上一口笑开颜！",
      "红通通的糖葫芦，甜滋滋的好滋味！",
      "冰糖葫芦串一串，幸福甜蜜满长安！"
    ]
  },
  {
    id: uuidv4(),
    name: "绢花",
    price: 5,
    stock: 6,
    catchphrases: [
      "绢花鲜，绢花艳，绢花簪发人更艳！",
      "巧手织得绢花开，引得蝴蝶翩翩来！",
      "绢花一朵头上戴，娇艳欲滴惹人爱！",
      "买朵绢花送佳人，锦上添花情意深！",
      "绢花娇艳美如画，戴在头上俏冤家！"
    ]
  },
  {
    id: uuidv4(),
    name: "泥人",
    price: 5,
    stock: 6,
    catchphrases: [
      "捏泥人咯！活灵活现！",
      "小小泥人手中捏，千姿百态笑哈哈！",
      "泥人张，手艺巧，捏出世间万物娇！",
      "捏个娃娃憨态可掬，买个回家乐呵呵！",
      "泥人儿，泥人儿，买个泥人逗孩儿！"
    ]
  },
  {
    id: uuidv4(),
    name: "风筝",
    price: 5,
    stock: 6,
    catchphrases: [
      "放风筝咯！天高任飞翔！",
      "纸鸢翩翩飞上天，烦恼统统随风散！",
      "风筝飞，线儿牵，逍遥自在云间！",
      "巧手扎个彩风筝，春风得意上青云！",
      "放风筝，步步高，前程似锦乐陶陶！"
    ]
  },
  {
    id: uuidv4(),
    name: "胭脂",
    price: 5,
    stock: 6,
    catchphrases: [
      "胭脂水粉，佳人必备！",
      "胭脂一抹红颜醉，倾国倾城惹人怜！",
      "上等胭脂香满堂，佳人抹上增颜色！",
      "胭脂香，胭脂红，胭脂点唇春意浓！",
      "买盒胭脂送娇妻，恩爱甜蜜永不离！"
    ]
  }
];
