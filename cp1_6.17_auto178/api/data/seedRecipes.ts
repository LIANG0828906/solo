export interface Ingredient {
  name: string
  amount: string
  category: 'vegetable' | 'meat' | 'seasoning' | 'other'
}

export interface Step {
  order: number
  description: string
}

export interface Recipe {
  id: string
  name: string
  coverImage: string
  author: string
  prepTime: string
  cookTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  cuisine: 'chinese' | 'western' | 'japanese'
  ingredients: Ingredient[]
  steps: Step[]
  likes: number
}

export const seedRecipes: Recipe[] = [
  {
    id: '1',
    name: '宫保鸡丁',
    coverImage: '',
    author: '王大厨',
    prepTime: '15分钟',
    cookTime: '20分钟',
    difficulty: 'medium',
    cuisine: 'chinese',
    ingredients: [
      { name: '鸡胸肉', amount: '300g', category: 'meat' },
      { name: '花生米', amount: '50g', category: 'other' },
      { name: '干辣椒', amount: '10个', category: 'seasoning' },
      { name: '青椒', amount: '2个', category: 'vegetable' },
      { name: '酱油', amount: '2勺', category: 'seasoning' },
    ],
    steps: [
      { order: 1, description: 'Cut chicken breast into small cubes and marinate with soy sauce and starch for 10 minutes.' },
      { order: 2, description: 'Heat oil in a wok and fry peanuts until golden, then set aside.' },
      { order: 3, description: 'Stir-fry dried chilies and Sichuan peppercorns until fragrant.' },
      { order: 4, description: 'Add marinated chicken and stir-fry until cooked through.' },
      { order: 5, description: 'Pour in the sauce mixture of soy sauce, vinegar, sugar and starch water.' },
      { order: 6, description: 'Toss in peanuts and green peppers, stir well and serve.' },
    ],
    likes: 128,
  },
  {
    id: '2',
    name: '红烧肉',
    coverImage: '',
    author: '李阿姨',
    prepTime: '10分钟',
    cookTime: '90分钟',
    difficulty: 'hard',
    cuisine: 'chinese',
    ingredients: [
      { name: '五花肉', amount: '500g', category: 'meat' },
      { name: '冰糖', amount: '30g', category: 'seasoning' },
      { name: '酱油', amount: '3勺', category: 'seasoning' },
      { name: '生姜', amount: '3片', category: 'vegetable' },
      { name: '八角', amount: '2个', category: 'seasoning' },
    ],
    steps: [
      { order: 1, description: 'Cut pork belly into 3cm cubes and blanch in boiling water for 5 minutes.' },
      { order: 2, description: 'Heat oil and caramelize rock sugar until it turns amber.' },
      { order: 3, description: 'Add pork pieces and coat evenly with caramelized sugar.' },
      { order: 4, description: 'Pour in soy sauce, ginger, star anise and enough water to cover the meat.' },
      { order: 5, description: 'Simmer on low heat for 60-90 minutes until tender.' },
    ],
    likes: 256,
  },
  {
    id: '3',
    name: '番茄炒蛋',
    coverImage: '',
    author: '张妈妈',
    prepTime: '5分钟',
    cookTime: '10分钟',
    difficulty: 'easy',
    cuisine: 'chinese',
    ingredients: [
      { name: '番茄', amount: '2个', category: 'vegetable' },
      { name: '鸡蛋', amount: '3个', category: 'other' },
      { name: '盐', amount: '适量', category: 'seasoning' },
      { name: '白糖', amount: '1勺', category: 'seasoning' },
    ],
    steps: [
      { order: 1, description: 'Beat eggs with a pinch of salt and set aside.' },
      { order: 2, description: 'Dice tomatoes into bite-sized pieces.' },
      { order: 3, description: 'Scramble eggs in hot oil until just set, then remove from pan.' },
      { order: 4, description: 'Stir-fry tomatoes until softened and juicy.' },
      { order: 5, description: 'Return eggs to pan, add sugar and salt, mix well and serve.' },
    ],
    likes: 342,
  },
  {
    id: '4',
    name: '麻婆豆腐',
    coverImage: '',
    author: '陈师傅',
    prepTime: '10分钟',
    cookTime: '15分钟',
    difficulty: 'medium',
    cuisine: 'chinese',
    ingredients: [
      { name: '嫩豆腐', amount: '400g', category: 'other' },
      { name: '猪肉末', amount: '100g', category: 'meat' },
      { name: '豆瓣酱', amount: '2勺', category: 'seasoning' },
      { name: '花椒粉', amount: '1勺', category: 'seasoning' },
      { name: '小葱', amount: '2根', category: 'vegetable' },
    ],
    steps: [
      { order: 1, description: 'Cut tofu into 2cm cubes and blanch in salted water for 2 minutes.' },
      { order: 2, description: 'Stir-fry ground pork until browned and crispy.' },
      { order: 3, description: 'Add doubanjiang and cook until the oil turns red.' },
      { order: 4, description: 'Add water, gently slide in tofu and simmer for 5 minutes.' },
      { order: 5, description: 'Thicken with starch water and sprinkle Sichuan pepper and scallions on top.' },
    ],
    likes: 189,
  },
  {
    id: '5',
    name: 'Pasta Carbonara',
    coverImage: '',
    author: 'Marco',
    prepTime: '10分钟',
    cookTime: '20分钟',
    difficulty: 'medium',
    cuisine: 'western',
    ingredients: [
      { name: '意面', amount: '200g', category: 'other' },
      { name: '培根', amount: '100g', category: 'meat' },
      { name: '鸡蛋', amount: '2个', category: 'other' },
      { name: '帕玛森芝士', amount: '50g', category: 'other' },
      { name: '黑胡椒', amount: '适量', category: 'seasoning' },
    ],
    steps: [
      { order: 1, description: 'Cook spaghetti in salted boiling water until al dente.' },
      { order: 2, description: 'Fry bacon strips until crispy in a large pan.' },
      { order: 3, description: 'Whisk eggs with grated Parmesan cheese and black pepper in a bowl.' },
      { order: 4, description: 'Toss hot pasta into the bacon pan, remove from heat.' },
      { order: 5, description: 'Quickly pour in egg mixture and toss vigorously to create a creamy sauce without scrambling the eggs.' },
      { order: 6, description: 'Serve immediately with extra Parmesan and black pepper.' },
    ],
    likes: 210,
  },
  {
    id: '6',
    name: 'Caesar Salad',
    coverImage: '',
    author: 'Emma',
    prepTime: '15分钟',
    cookTime: '5分钟',
    difficulty: 'easy',
    cuisine: 'western',
    ingredients: [
      { name: '罗马生菜', amount: '1颗', category: 'vegetable' },
      { name: '鸡胸肉', amount: '150g', category: 'meat' },
      { name: '面包丁', amount: '50g', category: 'other' },
      { name: '帕玛森芝士', amount: '30g', category: 'other' },
    ],
    steps: [
      { order: 1, description: 'Grill chicken breast until cooked, then slice into strips.' },
      { order: 2, description: 'Tear romaine lettuce into bite-sized pieces and wash thoroughly.' },
      { order: 3, description: 'Toast bread cubes in a pan with olive oil until golden and crispy.' },
      { order: 4, description: 'Toss lettuce with Caesar dressing until well coated.' },
      { order: 5, description: 'Top with chicken strips, croutons and shaved Parmesan.' },
    ],
    likes: 156,
  },
  {
    id: '7',
    name: '寿司',
    coverImage: '',
    author: '田中',
    prepTime: '30分钟',
    cookTime: '20分钟',
    difficulty: 'hard',
    cuisine: 'japanese',
    ingredients: [
      { name: '寿司米', amount: '300g', category: 'other' },
      { name: '三文鱼', amount: '200g', category: 'meat' },
      { name: '海苔', amount: '5片', category: 'other' },
      { name: '寿司醋', amount: '3勺', category: 'seasoning' },
      { name: '黄瓜', amount: '1根', category: 'vegetable' },
    ],
    steps: [
      { order: 1, description: 'Cook sushi rice and mix with sushi vinegar while still hot.' },
      { order: 2, description: 'Fan the rice until it cools to room temperature and becomes glossy.' },
      { order: 3, description: 'Slice salmon and cucumber into thin strips.' },
      { order: 4, description: 'Place nori on a bamboo mat, spread rice evenly, leaving a gap at the top.' },
      { order: 5, description: 'Lay salmon and cucumber strips across the center and roll tightly.' },
      { order: 6, description: 'Slice the roll into 8 pieces with a wet knife.' },
    ],
    likes: 275,
  },
  {
    id: '8',
    name: '味噌汤',
    coverImage: '',
    author: '铃木',
    prepTime: '5分钟',
    cookTime: '10分钟',
    difficulty: 'easy',
    cuisine: 'japanese',
    ingredients: [
      { name: '味噌酱', amount: '3勺', category: 'seasoning' },
      { name: '豆腐', amount: '150g', category: 'other' },
      { name: '海带', amount: '1片', category: 'vegetable' },
      { name: '小葱', amount: '2根', category: 'vegetable' },
    ],
    steps: [
      { order: 1, description: 'Soak kombu in cold water for 10 minutes, then bring to a gentle simmer.' },
      { order: 2, description: 'Remove kombu before boiling to keep the broth clear.' },
      { order: 3, description: 'Cut tofu into small cubes and add to the broth.' },
      { order: 4, description: 'Dissolve miso paste in a ladleful of broth, then stir back into the pot.' },
    ],
    likes: 198,
  },
]
