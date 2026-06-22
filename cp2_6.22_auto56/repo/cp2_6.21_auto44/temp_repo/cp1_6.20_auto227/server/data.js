import { v4 as uuidv4 } from 'uuid';

const generateMockCourses = () => {
  const courseTemplates = [
    {
      name: '少儿编程入门班',
      category: '编程',
      teacherName: '李明',
      teacherBio: '10年编程教学经验，前BAT高级工程师',
      price: 2999,
      outline: ['Scratch基础入门', '动画与游戏制作', 'Python启蒙', '项目实战'],
      rating: 4.5,
      radarScores: {
        contentDepth: 7.5,
        funFactor: 8.2,
        teacherQuality: 8.8,
        valueForMoney: 7.0,
        afterClassService: 6.5,
      },
      tags: [
        { name: '互动性强', count: 45 },
        { name: '老师耐心', count: 38 },
        { name: '内容有趣', count: 32 },
        { name: '作业适中', count: 28 },
        { name: '进度合理', count: 22 },
        { name: '服务一般', count: 15 },
      ],
      reviews: [
        { rating: 9, comment: '孩子很喜欢，李老师讲课很生动', createdAt: '2024-01-15' },
        { rating: 8, comment: '课程设计合理，适合零基础', createdAt: '2024-01-10' },
        { rating: 7, comment: '整体不错，课后答疑可以再快些', createdAt: '2024-01-05' },
        { rating: 10, comment: '比线下培训班划算多了', createdAt: '2023-12-28' },
        { rating: 8, comment: '孩子学完做了个小游戏，很有成就感', createdAt: '2023-12-20' },
      ],
    },
    {
      name: '少儿编程进阶班',
      category: '编程',
      teacherName: '王芳',
      teacherBio: '清华大学计算机硕士，8年少儿编程教研经验',
      price: 4599,
      outline: ['Python核心语法', '算法思维训练', 'Web开发入门', '人工智能启蒙'],
      rating: 4.8,
      radarScores: {
        contentDepth: 9.2,
        funFactor: 7.5,
        teacherQuality: 9.5,
        valueForMoney: 8.0,
        afterClassService: 8.5,
      },
      tags: [
        { name: '内容深入', count: 52 },
        { name: '老师专业', count: 48 },
        { name: '作业较多', count: 35 },
        { name: '答疑及时', count: 30 },
        { name: '难度偏大', count: 25 },
        { name: '干货满满', count: 42 },
      ],
      reviews: [
        { rating: 10, comment: '王老师太专业了，孩子进步很大', createdAt: '2024-01-18' },
        { rating: 9, comment: '课程有深度，值得报名', createdAt: '2024-01-12' },
        { rating: 8, comment: '作业有点多，但确实能学到东西', createdAt: '2024-01-08' },
        { rating: 9, comment: '性价比很高，服务也到位', createdAt: '2024-01-02' },
        { rating: 7, comment: '难度比入门班高不少，建议有基础再学', createdAt: '2023-12-25' },
      ],
    },
    {
      name: '数学思维训练班',
      category: '数学',
      teacherName: '张伟',
      teacherBio: '重点中学特级数学教师，奥赛金牌教练',
      price: 3299,
      outline: ['逻辑思维启蒙', '奥数基础', '应用题技巧', '图形与空间'],
      rating: 4.7,
      radarScores: {
        contentDepth: 8.5,
        funFactor: 7.0,
        teacherQuality: 9.0,
        valueForMoney: 8.2,
        afterClassService: 7.8,
      },
      tags: [
        { name: '方法独特', count: 40 },
        { name: '孩子开窍了', count: 35 },
        { name: '有点枯燥', count: 28 },
        { name: '提分明显', count: 45 },
        { name: '老师负责', count: 38 },
      ],
      reviews: [
        { rating: 9, comment: '张老师的方法确实不一样，孩子数学开窍了', createdAt: '2024-01-20' },
        { rating: 8, comment: '成绩提高明显，就是课程有点闷', createdAt: '2024-01-15' },
        { rating: 10, comment: '超值！孩子数学成绩从80分提到95分', createdAt: '2024-01-08' },
        { rating: 9, comment: '老师很负责，每次作业都认真批改', createdAt: '2024-01-03' },
        { rating: 8, comment: '不错的课程，推荐给数学薄弱的孩子', createdAt: '2023-12-28' },
      ],
    },
    {
      name: '英语启蒙班',
      category: '英语',
      teacherName: 'Lucy Chen',
      teacherBio: '美国哥伦比亚大学教育硕士，12年少儿英语教学经验',
      price: 3899,
      outline: ['自然拼读', '日常对话', '绘本阅读', '英文歌曲'],
      rating: 4.6,
      radarScores: {
        contentDepth: 6.8,
        funFactor: 9.5,
        teacherQuality: 8.8,
        valueForMoney: 7.5,
        afterClassService: 8.0,
      },
      tags: [
        { name: '互动性强', count: 55 },
        { name: '发音标准', count: 48 },
        { name: '孩子喜欢', count: 52 },
        { name: '内容偏浅', count: 20 },
        { name: '课堂活跃', count: 45 },
      ],
      reviews: [
        { rating: 10, comment: 'Lucy老师太有亲和力了，孩子超爱上课', createdAt: '2024-01-22' },
        { rating: 9, comment: '发音很标准，互动很多，孩子不抵触', createdAt: '2024-01-18' },
        { rating: 8, comment: '很好的启蒙课程，就是内容稍简单', createdAt: '2024-01-10' },
        { rating: 9, comment: '终于找到孩子愿意学的英语课了', createdAt: '2024-01-05' },
        { rating: 8, comment: '课堂氛围很好，适合零基础孩子', createdAt: '2023-12-30' },
      ],
    },
    {
      name: '英语口语提升班',
      category: '英语',
      teacherName: 'David Brown',
      teacherBio: '伦敦大学学院教育学博士，剑桥CELTA认证教师',
      price: 5299,
      outline: ['情景对话', '发音纠正', '辩论技巧', '西方文化'],
      rating: 4.9,
      radarScores: {
        contentDepth: 8.8,
        funFactor: 8.5,
        teacherQuality: 9.8,
        valueForMoney: 7.8,
        afterClassService: 9.0,
      },
      tags: [
        { name: '外教专业', count: 60 },
        { name: '口语进步大', count: 55 },
        { name: '价格偏高', count: 30 },
        { name: '内容实用', count: 45 },
        { name: '服务周到', count: 40 },
        { name: '纯正英式发音', count: 50 },
      ],
      reviews: [
        { rating: 10, comment: 'David老师非常专业，孩子口语进步神速', createdAt: '2024-01-25' },
        { rating: 10, comment: '虽然价格不便宜，但真的物有所值', createdAt: '2024-01-20' },
        { rating: 9, comment: '课程内容很实用，都是生活中能用的', createdAt: '2024-01-15' },
        { rating: 10, comment: '课后还会给发音纠正录音，服务太到位了', createdAt: '2024-01-08' },
        { rating: 9, comment: '孩子现在敢开口说英语了，太棒了', createdAt: '2024-01-02' },
      ],
    },
    {
      name: '创意美术班',
      category: '美术',
      teacherName: '周婷',
      teacherBio: '中央美术学院硕士，儿童美育专家',
      price: 2599,
      outline: ['色彩基础', '创意绘画', '手工制作', '艺术欣赏'],
      rating: 4.4,
      radarScores: {
        contentDepth: 6.5,
        funFactor: 9.2,
        teacherQuality: 8.0,
        valueForMoney: 7.8,
        afterClassService: 7.0,
      },
      tags: [
        { name: '培养创造力', count: 45 },
        { name: '课堂有趣', count: 50 },
        { name: '材料需要自备', count: 25 },
        { name: '老师有耐心', count: 38 },
        { name: '作品惊艳', count: 35 },
      ],
      reviews: [
        { rating: 9, comment: '孩子的想象力被激发了，作品越来越有创意', createdAt: '2024-01-28' },
        { rating: 8, comment: '课堂很有趣，周婷老师特别有耐心', createdAt: '2024-01-22' },
        { rating: 7, comment: '就是很多材料要自己准备，有点麻烦', createdAt: '2024-01-18' },
        { rating: 9, comment: '每次下课都带回漂亮的作品，很开心', createdAt: '2024-01-12' },
        { rating: 8, comment: '不错的美育启蒙课程', createdAt: '2024-01-05' },
      ],
    },
    {
      name: '钢琴入门班',
      category: '音乐',
      teacherName: '赵雅琴',
      teacherBio: '上海音乐学院钢琴系毕业，15年教学经验',
      price: 4299,
      outline: ['乐理基础', '指法练习', '简单曲目', '演奏技巧'],
      rating: 4.3,
      radarScores: {
        contentDepth: 8.0,
        funFactor: 6.5,
        teacherQuality: 8.5,
        valueForMoney: 7.2,
        afterClassService: 6.8,
      },
      tags: [
        { name: '老师专业', count: 40 },
        { name: '基础扎实', count: 38 },
        { name: '练习枯燥', count: 45 },
        { name: '需要练琴', count: 35 },
        { name: '进度合理', count: 28 },
      ],
      reviews: [
        { rating: 8, comment: '赵老师基础教得很扎实，值得推荐', createdAt: '2024-01-30' },
        { rating: 7, comment: '就是练琴有点枯燥，需要家长督促', createdAt: '2024-01-25' },
        { rating: 9, comment: '课程安排很合理，循序渐进', createdAt: '2024-01-20' },
        { rating: 8, comment: '孩子已经能弹简单的曲子了，很有成就感', createdAt: '2024-01-15' },
        { rating: 7, comment: '如果能多点趣味互动就更好了', createdAt: '2024-01-08' },
      ],
    },
    {
      name: '少儿围棋班',
      category: '棋类',
      teacherName: '陈九段',
      teacherBio: '职业九段棋手，国家一级运动员',
      price: 3599,
      outline: ['围棋规则', '基本定式', '布局思路', '对弈实战'],
      rating: 4.6,
      radarScores: {
        contentDepth: 8.5,
        funFactor: 8.0,
        teacherQuality: 9.2,
        valueForMoney: 8.0,
        afterClassService: 7.5,
      },
      tags: [
        { name: '培养专注力', count: 50 },
        { name: '老师专业', count: 45 },
        { name: '孩子沉迷', count: 30 },
        { name: '锻炼思维', count: 48 },
        { name: '进度适中', count: 32 },
      ],
      reviews: [
        { rating: 10, comment: '陈老师太厉害了，孩子学围棋后专注力提升很多', createdAt: '2024-02-01' },
        { rating: 9, comment: '不仅学围棋，还锻炼了思维能力', createdAt: '2024-01-28' },
        { rating: 8, comment: '孩子现在每天都要下几盘，迷上了', createdAt: '2024-01-22' },
        { rating: 9, comment: '职业棋手讲课确实不一样', createdAt: '2024-01-18' },
        { rating: 8, comment: '课程安排不错，进度适中', createdAt: '2024-01-10' },
      ],
    },
    {
      name: '机器人编程班',
      category: '编程',
      teacherName: '刘工',
      teacherBio: '前华为硬件工程师，创客教育倡导者',
      price: 5999,
      outline: ['电子元件认识', '电路基础', 'Arduino编程', '机器人搭建'],
      rating: 4.7,
      radarScores: {
        contentDepth: 8.8,
        funFactor: 9.0,
        teacherQuality: 8.5,
        valueForMoney: 6.5,
        afterClassService: 7.2,
      },
      tags: [
        { name: '动手能力强', count: 52 },
        { name: '孩子喜欢', count: 48 },
        { name: '设备较贵', count: 40 },
        { name: '实践性强', count: 45 },
        { name: '科技感十足', count: 38 },
      ],
      reviews: [
        { rating: 10, comment: '太赞了！孩子自己做了个会动的机器人', createdAt: '2024-02-05' },
        { rating: 9, comment: '课程实践性很强，不是光讲理论', createdAt: '2024-02-01' },
        { rating: 8, comment: '就是硬件设备需要额外买，有点贵', createdAt: '2024-01-28' },
        { rating: 9, comment: '刘老师很懂孩子，知道怎么激发兴趣', createdAt: '2024-01-22' },
        { rating: 8, comment: '科技感十足，适合喜欢动手的孩子', createdAt: '2024-01-15' },
      ],
    },
    {
      name: '科学实验班',
      category: '科学',
      teacherName: '黄博士',
      teacherBio: '中科院物理学博士，科普达人',
      price: 3199,
      outline: ['物理小实验', '化学魔法', '生物观察', '科学方法'],
      rating: 4.5,
      radarScores: {
        contentDepth: 7.8,
        funFactor: 9.3,
        teacherQuality: 8.2,
        valueForMoney: 8.0,
        afterClassService: 7.0,
      },
      tags: [
        { name: '激发好奇心', count: 55 },
        { name: '实验有趣', count: 50 },
        { name: '材料自备', count: 28 },
        { name: '通俗易懂', count: 42 },
        { name: '长知识', count: 48 },
      ],
      reviews: [
        { rating: 9, comment: '黄博士把复杂的科学讲得特别有意思', createdAt: '2024-02-08' },
        { rating: 10, comment: '每次实验都让孩子尖叫，太喜欢了', createdAt: '2024-02-03' },
        { rating: 8, comment: '孩子现在总问为什么，好奇心被激发了', createdAt: '2024-01-30' },
        { rating: 8, comment: '很多实验材料家里都有，方便', createdAt: '2024-01-25' },
        { rating: 9, comment: '不仅好玩，还能学到真正的科学知识', createdAt: '2024-01-20' },
      ],
    },
    {
      name: '硬笔书法班',
      category: '书法',
      teacherName: '苏老师',
      teacherBio: '中国书法家协会会员，20年书法教学经验',
      price: 2299,
      outline: ['基本笔画', '间架结构', '章法布局', '作品创作'],
      rating: 4.2,
      radarScores: {
        contentDepth: 7.5,
        funFactor: 5.5,
        teacherQuality: 8.8,
        valueForMoney: 8.5,
        afterClassService: 6.5,
      },
      tags: [
        { name: '书写进步', count: 48 },
        { name: '老师专业', count: 42 },
        { name: '比较枯燥', count: 50 },
        { name: '需要坚持', count: 45 },
        { name: '性价比高', count: 38 },
      ],
      reviews: [
        { rating: 8, comment: '孩子字写得好多了，就是需要长期坚持', createdAt: '2024-02-10' },
        { rating: 7, comment: '苏老师教得很好，但确实有点枯燥', createdAt: '2024-02-05' },
        { rating: 9, comment: '价格很实惠，老师也专业', createdAt: '2024-02-01' },
        { rating: 8, comment: '考试卷面分提高了不少', createdAt: '2024-01-28' },
        { rating: 7, comment: '需要家长陪着练，不然容易放弃', createdAt: '2024-01-22' },
      ],
    },
    {
      name: '少儿编程大师班',
      category: '编程',
      teacherName: '钱教授',
      teacherBio: '985高校计算机教授，ACM竞赛金牌教练',
      price: 7999,
      outline: ['数据结构', '算法设计', '竞赛技巧', '项目开发'],
      rating: 4.9,
      radarScores: {
        contentDepth: 9.8,
        funFactor: 7.2,
        teacherQuality: 9.9,
        valueForMoney: 7.0,
        afterClassService: 9.2,
      },
      tags: [
        { name: '大神级别', count: 65 },
        { name: '竞赛首选', count: 60 },
        { name: '价格很高', count: 45 },
        { name: '内容硬核', count: 55 },
        { name: '服务顶级', count: 50 },
        { name: '难度很大', count: 40 },
      ],
      reviews: [
        { rating: 10, comment: '钱教授真是大神，孩子竞赛拿了一等奖', createdAt: '2024-02-12' },
        { rating: 10, comment: '虽然贵，但真的是顶级的教学资源', createdAt: '2024-02-08' },
        { rating: 9, comment: '内容确实硬核，需要孩子有基础', createdAt: '2024-02-03' },
        { rating: 10, comment: '服务太到位了，还有一对一答疑', createdAt: '2024-01-30' },
        { rating: 9, comment: '想走信息竞赛路线的，强烈推荐', createdAt: '2024-01-25' },
      ],
    },
  ];

  const avatarColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  ];

  return courseTemplates.map((template, index) => {
    const reviewsWithIds = template.reviews.map(r => ({
      id: uuidv4(),
      courseId: '',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

    const course = {
      id: uuidv4(),
      name: template.name,
      category: template.category,
      teacher: {
        name: template.teacherName,
        avatar: avatarColors[index % avatarColors.length],
        bio: template.teacherBio,
      },
      price: template.price,
      outline: template.outline,
      rating: template.rating,
      radarScores: template.radarScores,
      tags: template.tags,
      reviews: reviewsWithIds.map(r => ({ ...r, courseId: '' })),
    };

    course.reviews.forEach(r => r.courseId = course.id);
    return course;
  });
};

export const mockCourses = generateMockCourses();

export const userReviewsStore = new Map();

export const searchCourses = (keyword) => {
  if (!keyword || keyword.trim() === '') {
    return mockCourses.slice(0, 10);
  }
  const lowerKeyword = keyword.toLowerCase();
  return mockCourses
    .filter(
      (course) =>
        course.name.toLowerCase().includes(lowerKeyword) ||
        course.category.toLowerCase().includes(lowerKeyword) ||
        course.teacher.name.toLowerCase().includes(lowerKeyword) ||
        course.teacher.bio.toLowerCase().includes(lowerKeyword)
    )
    .slice(0, 10);
};

export const addReview = (courseId, rating, comment) => {
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) {
    return null;
  }

  const review = {
    id: uuidv4(),
    courseId,
    rating,
    comment,
    createdAt: new Date().toISOString().split('T')[0],
  };

  course.reviews.unshift(review);
  userReviewsStore.set(courseId, review);

  const tagKeywords = {
    '互动': '互动性强',
    '有趣': '内容有趣',
    '耐心': '老师耐心',
    '专业': '老师专业',
    '枯燥': '比较枯燥',
    '贵': '价格偏高',
    '值': '性价比高',
    '进步': '进步明显',
    '作业': '作业太多',
    '服务': '服务周到',
  };

  for (const [keyword, tagName] of Object.entries(tagKeywords)) {
    if (comment.includes(keyword)) {
      const existingTag = course.tags.find((t) => t.name === tagName);
      if (existingTag) {
        existingTag.count += 1;
      } else {
        course.tags.push({ name: tagName, count: 1 });
      }
    }
  }

  return review;
};

export const getCourseReputation = (courseId) => {
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) {
    return null;
  }

  const sortedTags = [...course.tags].sort((a, b) => b.count - a.count);

  const recentReviews = [...course.reviews]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return {
    tags: sortedTags,
    recentReviews,
  };
};

export const getUserReview = (courseId) => {
  return userReviewsStore.get(courseId) || null;
};
