export interface PoetryPair {
  id: number
  upperHalf: string
  lowerHalf: string
  author: string
  title: string
  dynasty: string
}

export const POETRY_PAIRS: PoetryPair[] = [
  { id: 1, upperHalf: '床前明月光', lowerHalf: '疑是地上霜', author: '李白', title: '静夜思', dynasty: '唐' },
  { id: 2, upperHalf: '疑是地上霜', lowerHalf: '举头望明月', author: '李白', title: '静夜思', dynasty: '唐' },
  { id: 3, upperHalf: '举头望明月', lowerHalf: '低头思故乡', author: '李白', title: '静夜思', dynasty: '唐' },
  { id: 4, upperHalf: '春眠不觉晓', lowerHalf: '处处闻啼鸟', author: '孟浩然', title: '春晓', dynasty: '唐' },
  { id: 5, upperHalf: '处处闻啼鸟', lowerHalf: '夜来风雨声', author: '孟浩然', title: '春晓', dynasty: '唐' },
  { id: 6, upperHalf: '夜来风雨声', lowerHalf: '花落知多少', author: '孟浩然', title: '春晓', dynasty: '唐' },
  { id: 7, upperHalf: '白日依山尽', lowerHalf: '黄河入海流', author: '王之涣', title: '登鹳雀楼', dynasty: '唐' },
  { id: 8, upperHalf: '黄河入海流', lowerHalf: '欲穷千里目', author: '王之涣', title: '登鹳雀楼', dynasty: '唐' },
  { id: 9, upperHalf: '欲穷千里目', lowerHalf: '更上一层楼', author: '王之涣', title: '登鹳雀楼', dynasty: '唐' },
  { id: 10, upperHalf: '红豆生南国', lowerHalf: '春来发几枝', author: '王维', title: '相思', dynasty: '唐' },
  { id: 11, upperHalf: '春来发几枝', lowerHalf: '愿君多采撷', author: '王维', title: '相思', dynasty: '唐' },
  { id: 12, upperHalf: '愿君多采撷', lowerHalf: '此物最相思', author: '王维', title: '相思', dynasty: '唐' },
  { id: 13, upperHalf: '锄禾日当午', lowerHalf: '汗滴禾下土', author: '李绅', title: '悯农', dynasty: '唐' },
  { id: 14, upperHalf: '汗滴禾下土', lowerHalf: '谁知盘中餐', author: '李绅', title: '悯农', dynasty: '唐' },
  { id: 15, upperHalf: '谁知盘中餐', lowerHalf: '粒粒皆辛苦', author: '李绅', title: '悯农', dynasty: '唐' },
  { id: 16, upperHalf: '鹅鹅鹅', lowerHalf: '曲项向天歌', author: '骆宾王', title: '咏鹅', dynasty: '唐' },
  { id: 17, upperHalf: '曲项向天歌', lowerHalf: '白毛浮绿水', author: '骆宾王', title: '咏鹅', dynasty: '唐' },
  { id: 18, upperHalf: '白毛浮绿水', lowerHalf: '红掌拨清波', author: '骆宾王', title: '咏鹅', dynasty: '唐' },
  { id: 19, upperHalf: '日照香炉生紫烟', lowerHalf: '遥看瀑布挂前川', author: '李白', title: '望庐山瀑布', dynasty: '唐' },
  { id: 20, upperHalf: '遥看瀑布挂前川', lowerHalf: '飞流直下三千尺', author: '李白', title: '望庐山瀑布', dynasty: '唐' },
  { id: 21, upperHalf: '飞流直下三千尺', lowerHalf: '疑是银河落九天', author: '李白', title: '望庐山瀑布', dynasty: '唐' },
  { id: 22, upperHalf: '朝辞白帝彩云间', lowerHalf: '千里江陵一日还', author: '李白', title: '早发白帝城', dynasty: '唐' },
  { id: 23, upperHalf: '千里江陵一日还', lowerHalf: '两岸猿声啼不住', author: '李白', title: '早发白帝城', dynasty: '唐' },
  { id: 24, upperHalf: '两岸猿声啼不住', lowerHalf: '轻舟已过万重山', author: '李白', title: '早发白帝城', dynasty: '唐' },
  { id: 25, upperHalf: '李白乘舟将欲行', lowerHalf: '忽闻岸上踏歌声', author: '李白', title: '赠汪伦', dynasty: '唐' },
  { id: 26, upperHalf: '忽闻岸上踏歌声', lowerHalf: '桃花潭水深千尺', author: '李白', title: '赠汪伦', dynasty: '唐' },
  { id: 27, upperHalf: '桃花潭水深千尺', lowerHalf: '不及汪伦送我情', author: '李白', title: '赠汪伦', dynasty: '唐' },
  { id: 28, upperHalf: '故人西辞黄鹤楼', lowerHalf: '烟花三月下扬州', author: '李白', title: '黄鹤楼送孟浩然之广陵', dynasty: '唐' },
  { id: 29, upperHalf: '烟花三月下扬州', lowerHalf: '孤帆远影碧空尽', author: '李白', title: '黄鹤楼送孟浩然之广陵', dynasty: '唐' },
  { id: 30, upperHalf: '孤帆远影碧空尽', lowerHalf: '唯见长江天际流', author: '李白', title: '黄鹤楼送孟浩然之广陵', dynasty: '唐' },
  { id: 31, upperHalf: '两个黄鹂鸣翠柳', lowerHalf: '一行白鹭上青天', author: '杜甫', title: '绝句', dynasty: '唐' },
  { id: 32, upperHalf: '一行白鹭上青天', lowerHalf: '窗含西岭千秋雪', author: '杜甫', title: '绝句', dynasty: '唐' },
  { id: 33, upperHalf: '窗含西岭千秋雪', lowerHalf: '门泊东吴万里船', author: '杜甫', title: '绝句', dynasty: '唐' },
  { id: 34, upperHalf: '好雨知时节', lowerHalf: '当春乃发生', author: '杜甫', title: '春夜喜雨', dynasty: '唐' },
  { id: 35, upperHalf: '当春乃发生', lowerHalf: '随风潜入夜', author: '杜甫', title: '春夜喜雨', dynasty: '唐' },
  { id: 36, upperHalf: '随风潜入夜', lowerHalf: '润物细无声', author: '杜甫', title: '春夜喜雨', dynasty: '唐' },
  { id: 37, upperHalf: '岱宗夫如何', lowerHalf: '齐鲁青未了', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 38, upperHalf: '齐鲁青未了', lowerHalf: '造化钟神秀', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 39, upperHalf: '造化钟神秀', lowerHalf: '阴阳割昏晓', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 40, upperHalf: '阴阳割昏晓', lowerHalf: '荡胸生曾云', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 41, upperHalf: '荡胸生曾云', lowerHalf: '决眦入归鸟', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 42, upperHalf: '决眦入归鸟', lowerHalf: '会当凌绝顶', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 43, upperHalf: '会当凌绝顶', lowerHalf: '一览众山小', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 44, upperHalf: '黄四娘家花满蹊', lowerHalf: '千朵万朵压枝低', author: '杜甫', title: '江畔独步寻花', dynasty: '唐' },
  { id: 45, upperHalf: '千朵万朵压枝低', lowerHalf: '留连戏蝶时时舞', author: '杜甫', title: '江畔独步寻花', dynasty: '唐' },
  { id: 46, upperHalf: '留连戏蝶时时舞', lowerHalf: '自在娇莺恰恰啼', author: '杜甫', title: '江畔独步寻花', dynasty: '唐' },
  { id: 47, upperHalf: '千山鸟飞绝', lowerHalf: '万径人踪灭', author: '柳宗元', title: '江雪', dynasty: '唐' },
  { id: 48, upperHalf: '万径人踪灭', lowerHalf: '孤舟蓑笠翁', author: '柳宗元', title: '江雪', dynasty: '唐' },
  { id: 49, upperHalf: '孤舟蓑笠翁', lowerHalf: '独钓寒江雪', author: '柳宗元', title: '江雪', dynasty: '唐' },
  { id: 50, upperHalf: '月落乌啼霜满天', lowerHalf: '江枫渔火对愁眠', author: '张继', title: '枫桥夜泊', dynasty: '唐' },
  { id: 51, upperHalf: '江枫渔火对愁眠', lowerHalf: '姑苏城外寒山寺', author: '张继', title: '枫桥夜泊', dynasty: '唐' },
  { id: 52, upperHalf: '姑苏城外寒山寺', lowerHalf: '夜半钟声到客船', author: '张继', title: '枫桥夜泊', dynasty: '唐' },
  { id: 53, upperHalf: '慈母手中线', lowerHalf: '游子身上衣', author: '孟郊', title: '游子吟', dynasty: '唐' },
  { id: 54, upperHalf: '游子身上衣', lowerHalf: '临行密密缝', author: '孟郊', title: '游子吟', dynasty: '唐' },
  { id: 55, upperHalf: '临行密密缝', lowerHalf: '意恐迟迟归', author: '孟郊', title: '游子吟', dynasty: '唐' },
  { id: 56, upperHalf: '意恐迟迟归', lowerHalf: '谁言寸草心', author: '孟郊', title: '游子吟', dynasty: '唐' },
  { id: 57, upperHalf: '谁言寸草心', lowerHalf: '报得三春晖', author: '孟郊', title: '游子吟', dynasty: '唐' },
  { id: 58, upperHalf: '独在异乡为异客', lowerHalf: '每逢佳节倍思亲', author: '王维', title: '九月九日忆山东兄弟', dynasty: '唐' },
  { id: 59, upperHalf: '每逢佳节倍思亲', lowerHalf: '遥知兄弟登高处', author: '王维', title: '九月九日忆山东兄弟', dynasty: '唐' },
  { id: 60, upperHalf: '遥知兄弟登高处', lowerHalf: '遍插茱萸少一人', author: '王维', title: '九月九日忆山东兄弟', dynasty: '唐' },
  { id: 61, upperHalf: '渭城朝雨浥轻尘', lowerHalf: '客舍青青柳色新', author: '王维', title: '送元二使安西', dynasty: '唐' },
  { id: 62, upperHalf: '客舍青青柳色新', lowerHalf: '劝君更尽一杯酒', author: '王维', title: '送元二使安西', dynasty: '唐' },
  { id: 63, upperHalf: '劝君更尽一杯酒', lowerHalf: '西出阳关无故人', author: '王维', title: '送元二使安西', dynasty: '唐' },
  { id: 64, upperHalf: '空山新雨后', lowerHalf: '天气晚来秋', author: '王维', title: '山居秋暝', dynasty: '唐' },
  { id: 65, upperHalf: '天气晚来秋', lowerHalf: '明月松间照', author: '王维', title: '山居秋暝', dynasty: '唐' },
  { id: 66, upperHalf: '明月松间照', lowerHalf: '清泉石上流', author: '王维', title: '山居秋暝', dynasty: '唐' },
  { id: 67, upperHalf: '秦时明月汉时关', lowerHalf: '万里长征人未还', author: '王昌龄', title: '出塞', dynasty: '唐' },
  { id: 68, upperHalf: '万里长征人未还', lowerHalf: '但使龙城飞将在', author: '王昌龄', title: '出塞', dynasty: '唐' },
  { id: 69, upperHalf: '但使龙城飞将在', lowerHalf: '不教胡马度阴山', author: '王昌龄', title: '出塞', dynasty: '唐' },
  { id: 70, upperHalf: '寒雨连江夜入吴', lowerHalf: '平明送客楚山孤', author: '王昌龄', title: '芙蓉楼送辛渐', dynasty: '唐' },
  { id: 71, upperHalf: '平明送客楚山孤', lowerHalf: '洛阳亲友如相问', author: '王昌龄', title: '芙蓉楼送辛渐', dynasty: '唐' },
  { id: 72, upperHalf: '洛阳亲友如相问', lowerHalf: '一片冰心在玉壶', author: '王昌龄', title: '芙蓉楼送辛渐', dynasty: '唐' },
  { id: 73, upperHalf: '葡萄美酒夜光杯', lowerHalf: '欲饮琵琶马上催', author: '王翰', title: '凉州词', dynasty: '唐' },
  { id: 74, upperHalf: '欲饮琵琶马上催', lowerHalf: '醉卧沙场君莫笑', author: '王翰', title: '凉州词', dynasty: '唐' },
  { id: 75, upperHalf: '醉卧沙场君莫笑', lowerHalf: '古来征战几人回', author: '王翰', title: '凉州词', dynasty: '唐' },
  { id: 76, upperHalf: '少小离家老大回', lowerHalf: '乡音无改鬓毛衰', author: '贺知章', title: '回乡偶书', dynasty: '唐' },
  { id: 77, upperHalf: '乡音无改鬓毛衰', lowerHalf: '儿童相见不相识', author: '贺知章', title: '回乡偶书', dynasty: '唐' },
  { id: 78, upperHalf: '儿童相见不相识', lowerHalf: '笑问客从何处来', author: '贺知章', title: '回乡偶书', dynasty: '唐' },
  { id: 79, upperHalf: '碧玉妆成一树高', lowerHalf: '万条垂下绿丝绦', author: '贺知章', title: '咏柳', dynasty: '唐' },
  { id: 80, upperHalf: '万条垂下绿丝绦', lowerHalf: '不知细叶谁裁出', author: '贺知章', title: '咏柳', dynasty: '唐' },
  { id: 81, upperHalf: '不知细叶谁裁出', lowerHalf: '二月春风似剪刀', author: '贺知章', title: '咏柳', dynasty: '唐' },
  { id: 82, upperHalf: '横看成岭侧成峰', lowerHalf: '远近高低各不同', author: '苏轼', title: '题西林壁', dynasty: '宋' },
  { id: 83, upperHalf: '远近高低各不同', lowerHalf: '不识庐山真面目', author: '苏轼', title: '题西林壁', dynasty: '宋' },
  { id: 84, upperHalf: '不识庐山真面目', lowerHalf: '只缘身在此山中', author: '苏轼', title: '题西林壁', dynasty: '宋' },
  { id: 85, upperHalf: '水光潋滟晴方好', lowerHalf: '山色空蒙雨亦奇', author: '苏轼', title: '饮湖上初晴后雨', dynasty: '宋' },
  { id: 86, upperHalf: '山色空蒙雨亦奇', lowerHalf: '欲把西湖比西子', author: '苏轼', title: '饮湖上初晴后雨', dynasty: '宋' },
  { id: 87, upperHalf: '欲把西湖比西子', lowerHalf: '淡妆浓抹总相宜', author: '苏轼', title: '饮湖上初晴后雨', dynasty: '宋' },
  { id: 88, upperHalf: '竹外桃花三两枝', lowerHalf: '春江水暖鸭先知', author: '苏轼', title: '惠崇春江晚景', dynasty: '宋' },
  { id: 89, upperHalf: '春江水暖鸭先知', lowerHalf: '蒌蒿满地芦芽短', author: '苏轼', title: '惠崇春江晚景', dynasty: '宋' },
  { id: 90, upperHalf: '蒌蒿满地芦芽短', lowerHalf: '正是河豚欲上时', author: '苏轼', title: '惠崇春江晚景', dynasty: '宋' },
  { id: 91, upperHalf: '明月几时有', lowerHalf: '把酒问青天', author: '苏轼', title: '水调歌头', dynasty: '宋' },
  { id: 92, upperHalf: '把酒问青天', lowerHalf: '但愿人长久', author: '苏轼', title: '水调歌头', dynasty: '宋' },
  { id: 93, upperHalf: '但愿人长久', lowerHalf: '千里共婵娟', author: '苏轼', title: '水调歌头', dynasty: '宋' },
  { id: 94, upperHalf: '应怜屐齿印苍苔', lowerHalf: '小扣柴扉久不开', author: '叶绍翁', title: '游园不值', dynasty: '宋' },
  { id: 95, upperHalf: '小扣柴扉久不开', lowerHalf: '春色满园关不住', author: '叶绍翁', title: '游园不值', dynasty: '宋' },
  { id: 96, upperHalf: '春色满园关不住', lowerHalf: '一枝红杏出墙来', author: '叶绍翁', title: '游园不值', dynasty: '宋' },
  { id: 97, upperHalf: '毕竟西湖六月中', lowerHalf: '风光不与四时同', author: '杨万里', title: '晓出净慈寺送林子方', dynasty: '宋' },
  { id: 98, upperHalf: '风光不与四时同', lowerHalf: '接天莲叶无穷碧', author: '杨万里', title: '晓出净慈寺送林子方', dynasty: '宋' },
  { id: 99, upperHalf: '接天莲叶无穷碧', lowerHalf: '映日荷花别样红', author: '杨万里', title: '晓出净慈寺送林子方', dynasty: '宋' },
  { id: 100, upperHalf: '泉眼无声惜细流', lowerHalf: '树阴照水爱晴柔', author: '杨万里', title: '小池', dynasty: '宋' },
  { id: 101, upperHalf: '树阴照水爱晴柔', lowerHalf: '小荷才露尖尖角', author: '杨万里', title: '小池', dynasty: '宋' },
  { id: 102, upperHalf: '小荷才露尖尖角', lowerHalf: '早有蜻蜓立上头', author: '杨万里', title: '小池', dynasty: '宋' },
  { id: 103, upperHalf: '爆竹声中一岁除', lowerHalf: '春风送暖入屠苏', author: '王安石', title: '元日', dynasty: '宋' },
  { id: 104, upperHalf: '春风送暖入屠苏', lowerHalf: '千门万户曈曈日', author: '王安石', title: '元日', dynasty: '宋' },
  { id: 105, upperHalf: '千门万户曈曈日', lowerHalf: '总把新桃换旧符', author: '王安石', title: '元日', dynasty: '宋' },
  { id: 106, upperHalf: '京口瓜洲一水间', lowerHalf: '钟山只隔数重山', author: '王安石', title: '泊船瓜洲', dynasty: '宋' },
  { id: 107, upperHalf: '钟山只隔数重山', lowerHalf: '春风又绿江南岸', author: '王安石', title: '泊船瓜洲', dynasty: '宋' },
  { id: 108, upperHalf: '春风又绿江南岸', lowerHalf: '明月何时照我还', author: '王安石', title: '泊船瓜洲', dynasty: '宋' },
  { id: 109, upperHalf: '茅檐长扫净无苔', lowerHalf: '花木成畦手自栽', author: '王安石', title: '书湖阴先生壁', dynasty: '宋' },
  { id: 110, upperHalf: '花木成畦手自栽', lowerHalf: '一水护田将绿绕', author: '王安石', title: '书湖阴先生壁', dynasty: '宋' },
  { id: 111, upperHalf: '一水护田将绿绕', lowerHalf: '两山排闼送青来', author: '王安石', title: '书湖阴先生壁', dynasty: '宋' },
  { id: 112, upperHalf: '胜日寻芳泗水滨', lowerHalf: '无边光景一时新', author: '朱熹', title: '春日', dynasty: '宋' },
  { id: 113, upperHalf: '无边光景一时新', lowerHalf: '等闲识得东风面', author: '朱熹', title: '春日', dynasty: '宋' },
  { id: 114, upperHalf: '等闲识得东风面', lowerHalf: '万紫千红总是春', author: '朱熹', title: '春日', dynasty: '宋' },
  { id: 115, upperHalf: '半亩方塘一鉴开', lowerHalf: '天光云影共徘徊', author: '朱熹', title: '观书有感', dynasty: '宋' },
  { id: 116, upperHalf: '天光云影共徘徊', lowerHalf: '问渠那得清如许', author: '朱熹', title: '观书有感', dynasty: '宋' },
  { id: 117, upperHalf: '问渠那得清如许', lowerHalf: '为有源头活水来', author: '朱熹', title: '观书有感', dynasty: '宋' },
  { id: 118, upperHalf: '死去元知万事空', lowerHalf: '但悲不见九州同', author: '陆游', title: '示儿', dynasty: '宋' },
  { id: 119, upperHalf: '但悲不见九州同', lowerHalf: '王师北定中原日', author: '陆游', title: '示儿', dynasty: '宋' },
  { id: 120, upperHalf: '王师北定中原日', lowerHalf: '家祭无忘告乃翁', author: '陆游', title: '示儿', dynasty: '宋' },
  { id: 121, upperHalf: '古人学问无遗力', lowerHalf: '少壮工夫老始成', author: '陆游', title: '冬夜读书示子聿', dynasty: '宋' },
  { id: 122, upperHalf: '少壮工夫老始成', lowerHalf: '纸上得来终觉浅', author: '陆游', title: '冬夜读书示子聿', dynasty: '宋' },
  { id: 123, upperHalf: '纸上得来终觉浅', lowerHalf: '绝知此事要躬行', author: '陆游', title: '冬夜读书示子聿', dynasty: '宋' },
  { id: 124, upperHalf: '莫笑农家腊酒浑', lowerHalf: '丰年留客足鸡豚', author: '陆游', title: '游山西村', dynasty: '宋' },
  { id: 125, upperHalf: '丰年留客足鸡豚', lowerHalf: '山重水复疑无路', author: '陆游', title: '游山西村', dynasty: '宋' },
  { id: 126, upperHalf: '山重水复疑无路', lowerHalf: '柳暗花明又一村', author: '陆游', title: '游山西村', dynasty: '宋' },
  { id: 127, upperHalf: '生当作人杰', lowerHalf: '死亦为鬼雄', author: '李清照', title: '夏日绝句', dynasty: '宋' },
  { id: 128, upperHalf: '死亦为鬼雄', lowerHalf: '至今思项羽', author: '李清照', title: '夏日绝句', dynasty: '宋' },
  { id: 129, upperHalf: '至今思项羽', lowerHalf: '不肯过江东', author: '李清照', title: '夏日绝句', dynasty: '宋' },
  { id: 130, upperHalf: '常记溪亭日暮', lowerHalf: '沉醉不知归路', author: '李清照', title: '如梦令', dynasty: '宋' },
  { id: 131, upperHalf: '沉醉不知归路', lowerHalf: '兴尽晚回舟', author: '李清照', title: '如梦令', dynasty: '宋' },
  { id: 132, upperHalf: '兴尽晚回舟', lowerHalf: '误入藕花深处', author: '李清照', title: '如梦令', dynasty: '宋' },
  { id: 133, upperHalf: '山外青山楼外楼', lowerHalf: '西湖歌舞几时休', author: '林升', title: '题临安邸', dynasty: '宋' },
  { id: 134, upperHalf: '西湖歌舞几时休', lowerHalf: '暖风熏得游人醉', author: '林升', title: '题临安邸', dynasty: '宋' },
  { id: 135, upperHalf: '暖风熏得游人醉', lowerHalf: '直把杭州作汴州', author: '林升', title: '题临安邸', dynasty: '宋' },
  { id: 136, upperHalf: '九州生气恃风雷', lowerHalf: '万马齐喑究可哀', author: '龚自珍', title: '己亥杂诗', dynasty: '清' },
  { id: 137, upperHalf: '万马齐喑究可哀', lowerHalf: '我劝天公重抖擞', author: '龚自珍', title: '己亥杂诗', dynasty: '清' },
  { id: 138, upperHalf: '我劝天公重抖擞', lowerHalf: '不拘一格降人才', author: '龚自珍', title: '己亥杂诗', dynasty: '清' },
  { id: 139, upperHalf: '咬定青山不放松', lowerHalf: '立根原在破岩中', author: '郑燮', title: '竹石', dynasty: '清' },
  { id: 140, upperHalf: '立根原在破岩中', lowerHalf: '千磨万击还坚劲', author: '郑燮', title: '竹石', dynasty: '清' },
  { id: 141, upperHalf: '千磨万击还坚劲', lowerHalf: '任尔东西南北风', author: '郑燮', title: '竹石', dynasty: '清' },
  { id: 142, upperHalf: '牧童骑黄牛', lowerHalf: '歌声振林樾', author: '袁枚', title: '所见', dynasty: '清' },
  { id: 143, upperHalf: '歌声振林樾', lowerHalf: '意欲捕鸣蝉', author: '袁枚', title: '所见', dynasty: '清' },
  { id: 144, upperHalf: '意欲捕鸣蝉', lowerHalf: '忽然闭口立', author: '袁枚', title: '所见', dynasty: '清' },
  { id: 145, upperHalf: '草长莺飞二月天', lowerHalf: '拂堤杨柳醉春烟', author: '高鼎', title: '村居', dynasty: '清' },
  { id: 146, upperHalf: '拂堤杨柳醉春烟', lowerHalf: '儿童散学归来早', author: '高鼎', title: '村居', dynasty: '清' },
  { id: 147, upperHalf: '儿童散学归来早', lowerHalf: '忙趁东风放纸鸢', author: '高鼎', title: '村居', dynasty: '清' },
  { id: 148, upperHalf: '碧阑干外绣帘垂', lowerHalf: '猩血屏风画折枝', author: '韩偓', title: '已凉', dynasty: '唐' },
  { id: 149, upperHalf: '猩血屏风画折枝', lowerHalf: '八尺龙须方锦褥', author: '韩偓', title: '已凉', dynasty: '唐' },
  { id: 150, upperHalf: '八尺龙须方锦褥', lowerHalf: '已凉天气未寒时', author: '韩偓', title: '已凉', dynasty: '唐' },
  { id: 151, upperHalf: '朱雀桥边野草花', lowerHalf: '乌衣巷口夕阳斜', author: '刘禹锡', title: '乌衣巷', dynasty: '唐' },
  { id: 152, upperHalf: '乌衣巷口夕阳斜', lowerHalf: '旧时王谢堂前燕', author: '刘禹锡', title: '乌衣巷', dynasty: '唐' },
  { id: 153, upperHalf: '旧时王谢堂前燕', lowerHalf: '飞入寻常百姓家', author: '刘禹锡', title: '乌衣巷', dynasty: '唐' },
  { id: 154, upperHalf: '湖光秋月两相和', lowerHalf: '潭面无风镜未磨', author: '刘禹锡', title: '望洞庭', dynasty: '唐' },
  { id: 155, upperHalf: '潭面无风镜未磨', lowerHalf: '遥望洞庭山水翠', author: '刘禹锡', title: '望洞庭', dynasty: '唐' },
  { id: 156, upperHalf: '遥望洞庭山水翠', lowerHalf: '白银盘里一青螺', author: '刘禹锡', title: '望洞庭', dynasty: '唐' },
  { id: 157, upperHalf: '离离原上草', lowerHalf: '一岁一枯荣', author: '白居易', title: '赋得古原草送别', dynasty: '唐' },
  { id: 158, upperHalf: '一岁一枯荣', lowerHalf: '野火烧不尽', author: '白居易', title: '赋得古原草送别', dynasty: '唐' },
  { id: 159, upperHalf: '野火烧不尽', lowerHalf: '春风吹又生', author: '白居易', title: '赋得古原草送别', dynasty: '唐' },
  { id: 160, upperHalf: '江南好', lowerHalf: '风景旧曾谙', author: '白居易', title: '忆江南', dynasty: '唐' },
  { id: 161, upperHalf: '风景旧曾谙', lowerHalf: '日出江花红胜火', author: '白居易', title: '忆江南', dynasty: '唐' },
  { id: 162, upperHalf: '日出江花红胜火', lowerHalf: '春来江水绿如蓝', author: '白居易', title: '忆江南', dynasty: '唐' },
  { id: 163, upperHalf: '春来江水绿如蓝', lowerHalf: '能不忆江南', author: '白居易', title: '忆江南', dynasty: '唐' },
  { id: 164, upperHalf: '小娃撑小艇', lowerHalf: '偷采白莲回', author: '白居易', title: '池上', dynasty: '唐' },
  { id: 165, upperHalf: '偷采白莲回', lowerHalf: '不解藏踪迹', author: '白居易', title: '池上', dynasty: '唐' },
  { id: 166, upperHalf: '不解藏踪迹', lowerHalf: '浮萍一道开', author: '白居易', title: '池上', dynasty: '唐' },
  { id: 167, upperHalf: '松下问童子', lowerHalf: '言师采药去', author: '贾岛', title: '寻隐者不遇', dynasty: '唐' },
  { id: 168, upperHalf: '言师采药去', lowerHalf: '只在此山中', author: '贾岛', title: '寻隐者不遇', dynasty: '唐' },
  { id: 169, upperHalf: '只在此山中', lowerHalf: '云深不知处', author: '贾岛', title: '寻隐者不遇', dynasty: '唐' },
  { id: 170, upperHalf: '蓬头稚子学垂纶', lowerHalf: '侧坐莓苔草映身', author: '胡令能', title: '小儿垂钓', dynasty: '唐' },
  { id: 171, upperHalf: '侧坐莓苔草映身', lowerHalf: '路人借问遥招手', author: '胡令能', title: '小儿垂钓', dynasty: '唐' },
  { id: 172, upperHalf: '路人借问遥招手', lowerHalf: '怕得鱼惊不应人', author: '胡令能', title: '小儿垂钓', dynasty: '唐' },
]

export interface Question {
  prompt: string
  correctAnswer: string
  options: string[]
  pair: PoetryPair
  isReverse: boolean
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const usedPoetryIds: Set<number> = new Set()

export function resetUsedPoetry(): void {
  usedPoetryIds.clear()
}

export function getRandomQuestion(): Question {
  let availablePairs = POETRY_PAIRS.filter((p) => !usedPoetryIds.has(p.id))
  if (availablePairs.length === 0) {
    usedPoetryIds.clear()
    availablePairs = [...POETRY_PAIRS]
  }

  const pair = availablePairs[Math.floor(Math.random() * availablePairs.length)]
  usedPoetryIds.add(pair.id)

  const isReverse = Math.random() < 0.5
  const prompt = isReverse ? pair.lowerHalf : pair.upperHalf
  const correctAnswer = isReverse ? pair.upperHalf : pair.lowerHalf

  const answerField = isReverse ? 'upperHalf' : 'lowerHalf'
  const otherPairs = POETRY_PAIRS.filter((p) => p.id !== pair.id)
  const shuffledOthers = shuffle(otherPairs)

  const wrongAnswers: string[] = []
  for (const other of shuffledOthers) {
    const candidate = other[answerField]
    if (candidate !== correctAnswer && !wrongAnswers.includes(candidate)) {
      wrongAnswers.push(candidate)
      if (wrongAnswers.length >= 3) break
    }
  }

  while (wrongAnswers.length < 3) {
    const fallbackPair = POETRY_PAIRS[Math.floor(Math.random() * POETRY_PAIRS.length)]
    const fallbackAnswer = fallbackPair[answerField]
    if (fallbackAnswer !== correctAnswer && !wrongAnswers.includes(fallbackAnswer)) {
      wrongAnswers.push(fallbackAnswer)
    }
  }

  const options = shuffle([correctAnswer, ...wrongAnswers])

  return {
    prompt,
    correctAnswer,
    options,
    pair,
    isReverse,
  }
}
