export interface PoetryPair {
  id: number
  firstLine: string
  secondLine: string
  author: string
  title: string
  dynasty: string
}

export const POETRY_PAIRS: PoetryPair[] = [
  { id: 1, firstLine: '床前明月光', secondLine: '疑是地上霜', author: '李白', title: '静夜思', dynasty: '唐' },
  { id: 2, firstLine: '疑是地上霜', secondLine: '举头望明月', author: '李白', title: '静夜思', dynasty: '唐' },
  { id: 3, firstLine: '举头望明月', secondLine: '低头思故乡', author: '李白', title: '静夜思', dynasty: '唐' },
  { id: 4, firstLine: '春眠不觉晓', secondLine: '处处闻啼鸟', author: '孟浩然', title: '春晓', dynasty: '唐' },
  { id: 5, firstLine: '处处闻啼鸟', secondLine: '夜来风雨声', author: '孟浩然', title: '春晓', dynasty: '唐' },
  { id: 6, firstLine: '夜来风雨声', secondLine: '花落知多少', author: '孟浩然', title: '春晓', dynasty: '唐' },
  { id: 7, firstLine: '白日依山尽', secondLine: '黄河入海流', author: '王之涣', title: '登鹳雀楼', dynasty: '唐' },
  { id: 8, firstLine: '黄河入海流', secondLine: '欲穷千里目', author: '王之涣', title: '登鹳雀楼', dynasty: '唐' },
  { id: 9, firstLine: '欲穷千里目', secondLine: '更上一层楼', author: '王之涣', title: '登鹳雀楼', dynasty: '唐' },
  { id: 10, firstLine: '红豆生南国', secondLine: '春来发几枝', author: '王维', title: '相思', dynasty: '唐' },
  { id: 11, firstLine: '春来发几枝', secondLine: '愿君多采撷', author: '王维', title: '相思', dynasty: '唐' },
  { id: 12, firstLine: '愿君多采撷', secondLine: '此物最相思', author: '王维', title: '相思', dynasty: '唐' },
  { id: 13, firstLine: '锄禾日当午', secondLine: '汗滴禾下土', author: '李绅', title: '悯农', dynasty: '唐' },
  { id: 14, firstLine: '汗滴禾下土', secondLine: '谁知盘中餐', author: '李绅', title: '悯农', dynasty: '唐' },
  { id: 15, firstLine: '谁知盘中餐', secondLine: '粒粒皆辛苦', author: '李绅', title: '悯农', dynasty: '唐' },
  { id: 16, firstLine: '鹅鹅鹅', secondLine: '曲项向天歌', author: '骆宾王', title: '咏鹅', dynasty: '唐' },
  { id: 17, firstLine: '曲项向天歌', secondLine: '白毛浮绿水', author: '骆宾王', title: '咏鹅', dynasty: '唐' },
  { id: 18, firstLine: '白毛浮绿水', secondLine: '红掌拨清波', author: '骆宾王', title: '咏鹅', dynasty: '唐' },
  { id: 19, firstLine: '日照香炉生紫烟', secondLine: '遥看瀑布挂前川', author: '李白', title: '望庐山瀑布', dynasty: '唐' },
  { id: 20, firstLine: '遥看瀑布挂前川', secondLine: '飞流直下三千尺', author: '李白', title: '望庐山瀑布', dynasty: '唐' },
  { id: 21, firstLine: '飞流直下三千尺', secondLine: '疑是银河落九天', author: '李白', title: '望庐山瀑布', dynasty: '唐' },
  { id: 22, firstLine: '朝辞白帝彩云间', secondLine: '千里江陵一日还', author: '李白', title: '早发白帝城', dynasty: '唐' },
  { id: 23, firstLine: '千里江陵一日还', secondLine: '两岸猿声啼不住', author: '李白', title: '早发白帝城', dynasty: '唐' },
  { id: 24, firstLine: '两岸猿声啼不住', secondLine: '轻舟已过万重山', author: '李白', title: '早发白帝城', dynasty: '唐' },
  { id: 25, firstLine: '李白乘舟将欲行', secondLine: '忽闻岸上踏歌声', author: '李白', title: '赠汪伦', dynasty: '唐' },
  { id: 26, firstLine: '忽闻岸上踏歌声', secondLine: '桃花潭水深千尺', author: '李白', title: '赠汪伦', dynasty: '唐' },
  { id: 27, firstLine: '桃花潭水深千尺', secondLine: '不及汪伦送我情', author: '李白', title: '赠汪伦', dynasty: '唐' },
  { id: 28, firstLine: '故人西辞黄鹤楼', secondLine: '烟花三月下扬州', author: '李白', title: '黄鹤楼送孟浩然之广陵', dynasty: '唐' },
  { id: 29, firstLine: '烟花三月下扬州', secondLine: '孤帆远影碧空尽', author: '李白', title: '黄鹤楼送孟浩然之广陵', dynasty: '唐' },
  { id: 30, firstLine: '孤帆远影碧空尽', secondLine: '唯见长江天际流', author: '李白', title: '黄鹤楼送孟浩然之广陵', dynasty: '唐' },
  { id: 31, firstLine: '两个黄鹂鸣翠柳', secondLine: '一行白鹭上青天', author: '杜甫', title: '绝句', dynasty: '唐' },
  { id: 32, firstLine: '一行白鹭上青天', secondLine: '窗含西岭千秋雪', author: '杜甫', title: '绝句', dynasty: '唐' },
  { id: 33, firstLine: '窗含西岭千秋雪', secondLine: '门泊东吴万里船', author: '杜甫', title: '绝句', dynasty: '唐' },
  { id: 34, firstLine: '好雨知时节', secondLine: '当春乃发生', author: '杜甫', title: '春夜喜雨', dynasty: '唐' },
  { id: 35, firstLine: '当春乃发生', secondLine: '随风潜入夜', author: '杜甫', title: '春夜喜雨', dynasty: '唐' },
  { id: 36, firstLine: '随风潜入夜', secondLine: '润物细无声', author: '杜甫', title: '春夜喜雨', dynasty: '唐' },
  { id: 37, firstLine: '岱宗夫如何', secondLine: '齐鲁青未了', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 38, firstLine: '齐鲁青未了', secondLine: '造化钟神秀', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 39, firstLine: '造化钟神秀', secondLine: '阴阳割昏晓', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 40, firstLine: '阴阳割昏晓', secondLine: '荡胸生曾云', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 41, firstLine: '荡胸生曾云', secondLine: '决眦入归鸟', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 42, firstLine: '决眦入归鸟', secondLine: '会当凌绝顶', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 43, firstLine: '会当凌绝顶', secondLine: '一览众山小', author: '杜甫', title: '望岳', dynasty: '唐' },
  { id: 44, firstLine: '黄四娘家花满蹊', secondLine: '千朵万朵压枝低', author: '杜甫', title: '江畔独步寻花', dynasty: '唐' },
  { id: 45, firstLine: '千朵万朵压枝低', secondLine: '留连戏蝶时时舞', author: '杜甫', title: '江畔独步寻花', dynasty: '唐' },
  { id: 46, firstLine: '留连戏蝶时时舞', secondLine: '自在娇莺恰恰啼', author: '杜甫', title: '江畔独步寻花', dynasty: '唐' },
  { id: 47, firstLine: '千山鸟飞绝', secondLine: '万径人踪灭', author: '柳宗元', title: '江雪', dynasty: '唐' },
  { id: 48, firstLine: '万径人踪灭', secondLine: '孤舟蓑笠翁', author: '柳宗元', title: '江雪', dynasty: '唐' },
  { id: 49, firstLine: '孤舟蓑笠翁', secondLine: '独钓寒江雪', author: '柳宗元', title: '江雪', dynasty: '唐' },
  { id: 50, firstLine: '月落乌啼霜满天', secondLine: '江枫渔火对愁眠', author: '张继', title: '枫桥夜泊', dynasty: '唐' },
  { id: 51, firstLine: '江枫渔火对愁眠', secondLine: '姑苏城外寒山寺', author: '张继', title: '枫桥夜泊', dynasty: '唐' },
  { id: 52, firstLine: '姑苏城外寒山寺', secondLine: '夜半钟声到客船', author: '张继', title: '枫桥夜泊', dynasty: '唐' },
  { id: 53, firstLine: '慈母手中线', secondLine: '游子身上衣', author: '孟郊', title: '游子吟', dynasty: '唐' },
  { id: 54, firstLine: '游子身上衣', secondLine: '临行密密缝', author: '孟郊', title: '游子吟', dynasty: '唐' },
  { id: 55, firstLine: '临行密密缝', secondLine: '意恐迟迟归', author: '孟郊', title: '游子吟', dynasty: '唐' },
  { id: 56, firstLine: '意恐迟迟归', secondLine: '谁言寸草心', author: '孟郊', title: '游子吟', dynasty: '唐' },
  { id: 57, firstLine: '谁言寸草心', secondLine: '报得三春晖', author: '孟郊', title: '游子吟', dynasty: '唐' },
  { id: 58, firstLine: '独在异乡为异客', secondLine: '每逢佳节倍思亲', author: '王维', title: '九月九日忆山东兄弟', dynasty: '唐' },
  { id: 59, firstLine: '每逢佳节倍思亲', secondLine: '遥知兄弟登高处', author: '王维', title: '九月九日忆山东兄弟', dynasty: '唐' },
  { id: 60, firstLine: '遥知兄弟登高处', secondLine: '遍插茱萸少一人', author: '王维', title: '九月九日忆山东兄弟', dynasty: '唐' },
  { id: 61, firstLine: '渭城朝雨浥轻尘', secondLine: '客舍青青柳色新', author: '王维', title: '送元二使安西', dynasty: '唐' },
  { id: 62, firstLine: '客舍青青柳色新', secondLine: '劝君更尽一杯酒', author: '王维', title: '送元二使安西', dynasty: '唐' },
  { id: 63, firstLine: '劝君更尽一杯酒', secondLine: '西出阳关无故人', author: '王维', title: '送元二使安西', dynasty: '唐' },
  { id: 64, firstLine: '空山新雨后', secondLine: '天气晚来秋', author: '王维', title: '山居秋暝', dynasty: '唐' },
  { id: 65, firstLine: '天气晚来秋', secondLine: '明月松间照', author: '王维', title: '山居秋暝', dynasty: '唐' },
  { id: 66, firstLine: '明月松间照', secondLine: '清泉石上流', author: '王维', title: '山居秋暝', dynasty: '唐' },
  { id: 67, firstLine: '秦时明月汉时关', secondLine: '万里长征人未还', author: '王昌龄', title: '出塞', dynasty: '唐' },
  { id: 68, firstLine: '万里长征人未还', secondLine: '但使龙城飞将在', author: '王昌龄', title: '出塞', dynasty: '唐' },
  { id: 69, firstLine: '但使龙城飞将在', secondLine: '不教胡马度阴山', author: '王昌龄', title: '出塞', dynasty: '唐' },
  { id: 70, firstLine: '寒雨连江夜入吴', secondLine: '平明送客楚山孤', author: '王昌龄', title: '芙蓉楼送辛渐', dynasty: '唐' },
  { id: 71, firstLine: '平明送客楚山孤', secondLine: '洛阳亲友如相问', author: '王昌龄', title: '芙蓉楼送辛渐', dynasty: '唐' },
  { id: 72, firstLine: '洛阳亲友如相问', secondLine: '一片冰心在玉壶', author: '王昌龄', title: '芙蓉楼送辛渐', dynasty: '唐' },
  { id: 73, firstLine: '葡萄美酒夜光杯', secondLine: '欲饮琵琶马上催', author: '王翰', title: '凉州词', dynasty: '唐' },
  { id: 74, firstLine: '欲饮琵琶马上催', secondLine: '醉卧沙场君莫笑', author: '王翰', title: '凉州词', dynasty: '唐' },
  { id: 75, firstLine: '醉卧沙场君莫笑', secondLine: '古来征战几人回', author: '王翰', title: '凉州词', dynasty: '唐' },
  { id: 76, firstLine: '少小离家老大回', secondLine: '乡音无改鬓毛衰', author: '贺知章', title: '回乡偶书', dynasty: '唐' },
  { id: 77, firstLine: '乡音无改鬓毛衰', secondLine: '儿童相见不相识', author: '贺知章', title: '回乡偶书', dynasty: '唐' },
  { id: 78, firstLine: '儿童相见不相识', secondLine: '笑问客从何处来', author: '贺知章', title: '回乡偶书', dynasty: '唐' },
  { id: 79, firstLine: '碧玉妆成一树高', secondLine: '万条垂下绿丝绦', author: '贺知章', title: '咏柳', dynasty: '唐' },
  { id: 80, firstLine: '万条垂下绿丝绦', secondLine: '不知细叶谁裁出', author: '贺知章', title: '咏柳', dynasty: '唐' },
  { id: 81, firstLine: '不知细叶谁裁出', secondLine: '二月春风似剪刀', author: '贺知章', title: '咏柳', dynasty: '唐' },
  { id: 82, firstLine: '横看成岭侧成峰', secondLine: '远近高低各不同', author: '苏轼', title: '题西林壁', dynasty: '宋' },
  { id: 83, firstLine: '远近高低各不同', secondLine: '不识庐山真面目', author: '苏轼', title: '题西林壁', dynasty: '宋' },
  { id: 84, firstLine: '不识庐山真面目', secondLine: '只缘身在此山中', author: '苏轼', title: '题西林壁', dynasty: '宋' },
  { id: 85, firstLine: '水光潋滟晴方好', secondLine: '山色空蒙雨亦奇', author: '苏轼', title: '饮湖上初晴后雨', dynasty: '宋' },
  { id: 86, firstLine: '山色空蒙雨亦奇', secondLine: '欲把西湖比西子', author: '苏轼', title: '饮湖上初晴后雨', dynasty: '宋' },
  { id: 87, firstLine: '欲把西湖比西子', secondLine: '淡妆浓抹总相宜', author: '苏轼', title: '饮湖上初晴后雨', dynasty: '宋' },
  { id: 88, firstLine: '竹外桃花三两枝', secondLine: '春江水暖鸭先知', author: '苏轼', title: '惠崇春江晚景', dynasty: '宋' },
  { id: 89, firstLine: '春江水暖鸭先知', secondLine: '蒌蒿满地芦芽短', author: '苏轼', title: '惠崇春江晚景', dynasty: '宋' },
  { id: 90, firstLine: '蒌蒿满地芦芽短', secondLine: '正是河豚欲上时', author: '苏轼', title: '惠崇春江晚景', dynasty: '宋' },
  { id: 91, firstLine: '明月几时有', secondLine: '把酒问青天', author: '苏轼', title: '水调歌头', dynasty: '宋' },
  { id: 92, firstLine: '把酒问青天', secondLine: '但愿人长久', author: '苏轼', title: '水调歌头', dynasty: '宋' },
  { id: 93, firstLine: '但愿人长久', secondLine: '千里共婵娟', author: '苏轼', title: '水调歌头', dynasty: '宋' },
  { id: 94, firstLine: '应怜屐齿印苍苔', secondLine: '小扣柴扉久不开', author: '叶绍翁', title: '游园不值', dynasty: '宋' },
  { id: 95, firstLine: '小扣柴扉久不开', secondLine: '春色满园关不住', author: '叶绍翁', title: '游园不值', dynasty: '宋' },
  { id: 96, firstLine: '春色满园关不住', secondLine: '一枝红杏出墙来', author: '叶绍翁', title: '游园不值', dynasty: '宋' },
  { id: 97, firstLine: '毕竟西湖六月中', secondLine: '风光不与四时同', author: '杨万里', title: '晓出净慈寺送林子方', dynasty: '宋' },
  { id: 98, firstLine: '风光不与四时同', secondLine: '接天莲叶无穷碧', author: '杨万里', title: '晓出净慈寺送林子方', dynasty: '宋' },
  { id: 99, firstLine: '接天莲叶无穷碧', secondLine: '映日荷花别样红', author: '杨万里', title: '晓出净慈寺送林子方', dynasty: '宋' },
  { id: 100, firstLine: '泉眼无声惜细流', secondLine: '树阴照水爱晴柔', author: '杨万里', title: '小池', dynasty: '宋' },
  { id: 101, firstLine: '树阴照水爱晴柔', secondLine: '小荷才露尖尖角', author: '杨万里', title: '小池', dynasty: '宋' },
  { id: 102, firstLine: '小荷才露尖尖角', secondLine: '早有蜻蜓立上头', author: '杨万里', title: '小池', dynasty: '宋' },
  { id: 103, firstLine: '爆竹声中一岁除', secondLine: '春风送暖入屠苏', author: '王安石', title: '元日', dynasty: '宋' },
  { id: 104, firstLine: '春风送暖入屠苏', secondLine: '千门万户曈曈日', author: '王安石', title: '元日', dynasty: '宋' },
  { id: 105, firstLine: '千门万户曈曈日', secondLine: '总把新桃换旧符', author: '王安石', title: '元日', dynasty: '宋' },
  { id: 106, firstLine: '京口瓜洲一水间', secondLine: '钟山只隔数重山', author: '王安石', title: '泊船瓜洲', dynasty: '宋' },
  { id: 107, firstLine: '钟山只隔数重山', secondLine: '春风又绿江南岸', author: '王安石', title: '泊船瓜洲', dynasty: '宋' },
  { id: 108, firstLine: '春风又绿江南岸', secondLine: '明月何时照我还', author: '王安石', title: '泊船瓜洲', dynasty: '宋' },
  { id: 109, firstLine: '茅檐长扫净无苔', secondLine: '花木成畦手自栽', author: '王安石', title: '书湖阴先生壁', dynasty: '宋' },
  { id: 110, firstLine: '花木成畦手自栽', secondLine: '一水护田将绿绕', author: '王安石', title: '书湖阴先生壁', dynasty: '宋' },
  { id: 111, firstLine: '一水护田将绿绕', secondLine: '两山排闼送青来', author: '王安石', title: '书湖阴先生壁', dynasty: '宋' },
  { id: 112, firstLine: '胜日寻芳泗水滨', secondLine: '无边光景一时新', author: '朱熹', title: '春日', dynasty: '宋' },
  { id: 113, firstLine: '无边光景一时新', secondLine: '等闲识得东风面', author: '朱熹', title: '春日', dynasty: '宋' },
  { id: 114, firstLine: '等闲识得东风面', secondLine: '万紫千红总是春', author: '朱熹', title: '春日', dynasty: '宋' },
  { id: 115, firstLine: '半亩方塘一鉴开', secondLine: '天光云影共徘徊', author: '朱熹', title: '观书有感', dynasty: '宋' },
  { id: 116, firstLine: '天光云影共徘徊', secondLine: '问渠那得清如许', author: '朱熹', title: '观书有感', dynasty: '宋' },
  { id: 117, firstLine: '问渠那得清如许', secondLine: '为有源头活水来', author: '朱熹', title: '观书有感', dynasty: '宋' },
  { id: 118, firstLine: '死去元知万事空', secondLine: '但悲不见九州同', author: '陆游', title: '示儿', dynasty: '宋' },
  { id: 119, firstLine: '但悲不见九州同', secondLine: '王师北定中原日', author: '陆游', title: '示儿', dynasty: '宋' },
  { id: 120, firstLine: '王师北定中原日', secondLine: '家祭无忘告乃翁', author: '陆游', title: '示儿', dynasty: '宋' },
  { id: 121, firstLine: '古人学问无遗力', secondLine: '少壮工夫老始成', author: '陆游', title: '冬夜读书示子聿', dynasty: '宋' },
  { id: 122, firstLine: '少壮工夫老始成', secondLine: '纸上得来终觉浅', author: '陆游', title: '冬夜读书示子聿', dynasty: '宋' },
  { id: 123, firstLine: '纸上得来终觉浅', secondLine: '绝知此事要躬行', author: '陆游', title: '冬夜读书示子聿', dynasty: '宋' },
  { id: 124, firstLine: '莫笑农家腊酒浑', secondLine: '丰年留客足鸡豚', author: '陆游', title: '游山西村', dynasty: '宋' },
  { id: 125, firstLine: '丰年留客足鸡豚', secondLine: '山重水复疑无路', author: '陆游', title: '游山西村', dynasty: '宋' },
  { id: 126, firstLine: '山重水复疑无路', secondLine: '柳暗花明又一村', author: '陆游', title: '游山西村', dynasty: '宋' },
  { id: 127, firstLine: '生当作人杰', secondLine: '死亦为鬼雄', author: '李清照', title: '夏日绝句', dynasty: '宋' },
  { id: 128, firstLine: '死亦为鬼雄', secondLine: '至今思项羽', author: '李清照', title: '夏日绝句', dynasty: '宋' },
  { id: 129, firstLine: '至今思项羽', secondLine: '不肯过江东', author: '李清照', title: '夏日绝句', dynasty: '宋' },
  { id: 130, firstLine: '常记溪亭日暮', secondLine: '沉醉不知归路', author: '李清照', title: '如梦令', dynasty: '宋' },
  { id: 131, firstLine: '沉醉不知归路', secondLine: '兴尽晚回舟', author: '李清照', title: '如梦令', dynasty: '宋' },
  { id: 132, firstLine: '兴尽晚回舟', secondLine: '误入藕花深处', author: '李清照', title: '如梦令', dynasty: '宋' },
  { id: 133, firstLine: '山外青山楼外楼', secondLine: '西湖歌舞几时休', author: '林升', title: '题临安邸', dynasty: '宋' },
  { id: 134, firstLine: '西湖歌舞几时休', secondLine: '暖风熏得游人醉', author: '林升', title: '题临安邸', dynasty: '宋' },
  { id: 135, firstLine: '暖风熏得游人醉', secondLine: '直把杭州作汴州', author: '林升', title: '题临安邸', dynasty: '宋' },
  { id: 136, firstLine: '九州生气恃风雷', secondLine: '万马齐喑究可哀', author: '龚自珍', title: '己亥杂诗', dynasty: '清' },
  { id: 137, firstLine: '万马齐喑究可哀', secondLine: '我劝天公重抖擞', author: '龚自珍', title: '己亥杂诗', dynasty: '清' },
  { id: 138, firstLine: '我劝天公重抖擞', secondLine: '不拘一格降人才', author: '龚自珍', title: '己亥杂诗', dynasty: '清' },
  { id: 139, firstLine: '咬定青山不放松', secondLine: '立根原在破岩中', author: '郑燮', title: '竹石', dynasty: '清' },
  { id: 140, firstLine: '立根原在破岩中', secondLine: '千磨万击还坚劲', author: '郑燮', title: '竹石', dynasty: '清' },
  { id: 141, firstLine: '千磨万击还坚劲', secondLine: '任尔东西南北风', author: '郑燮', title: '竹石', dynasty: '清' },
  { id: 142, firstLine: '牧童骑黄牛', secondLine: '歌声振林樾', author: '袁枚', title: '所见', dynasty: '清' },
  { id: 143, firstLine: '歌声振林樾', secondLine: '意欲捕鸣蝉', author: '袁枚', title: '所见', dynasty: '清' },
  { id: 144, firstLine: '意欲捕鸣蝉', secondLine: '忽然闭口立', author: '袁枚', title: '所见', dynasty: '清' },
  { id: 145, firstLine: '草长莺飞二月天', secondLine: '拂堤杨柳醉春烟', author: '高鼎', title: '村居', dynasty: '清' },
  { id: 146, firstLine: '拂堤杨柳醉春烟', secondLine: '儿童散学归来早', author: '高鼎', title: '村居', dynasty: '清' },
  { id: 147, firstLine: '儿童散学归来早', secondLine: '忙趁东风放纸鸢', author: '高鼎', title: '村居', dynasty: '清' },
  { id: 148, firstLine: '碧阑干外绣帘垂', secondLine: '猩血屏风画折枝', author: '韩偓', title: '已凉', dynasty: '唐' },
  { id: 149, firstLine: '猩血屏风画折枝', secondLine: '八尺龙须方锦褥', author: '韩偓', title: '已凉', dynasty: '唐' },
  { id: 150, firstLine: '八尺龙须方锦褥', secondLine: '已凉天气未寒时', author: '韩偓', title: '已凉', dynasty: '唐' },
  { id: 151, firstLine: '朱雀桥边野草花', secondLine: '乌衣巷口夕阳斜', author: '刘禹锡', title: '乌衣巷', dynasty: '唐' },
  { id: 152, firstLine: '乌衣巷口夕阳斜', secondLine: '旧时王谢堂前燕', author: '刘禹锡', title: '乌衣巷', dynasty: '唐' },
  { id: 153, firstLine: '旧时王谢堂前燕', secondLine: '飞入寻常百姓家', author: '刘禹锡', title: '乌衣巷', dynasty: '唐' },
  { id: 154, firstLine: '湖光秋月两相和', secondLine: '潭面无风镜未磨', author: '刘禹锡', title: '望洞庭', dynasty: '唐' },
  { id: 155, firstLine: '潭面无风镜未磨', secondLine: '遥望洞庭山水翠', author: '刘禹锡', title: '望洞庭', dynasty: '唐' },
  { id: 156, firstLine: '遥望洞庭山水翠', secondLine: '白银盘里一青螺', author: '刘禹锡', title: '望洞庭', dynasty: '唐' },
  { id: 157, firstLine: '离离原上草', secondLine: '一岁一枯荣', author: '白居易', title: '赋得古原草送别', dynasty: '唐' },
  { id: 158, firstLine: '一岁一枯荣', secondLine: '野火烧不尽', author: '白居易', title: '赋得古原草送别', dynasty: '唐' },
  { id: 159, firstLine: '野火烧不尽', secondLine: '春风吹又生', author: '白居易', title: '赋得古原草送别', dynasty: '唐' },
  { id: 160, firstLine: '江南好', secondLine: '风景旧曾谙', author: '白居易', title: '忆江南', dynasty: '唐' },
  { id: 161, firstLine: '风景旧曾谙', secondLine: '日出江花红胜火', author: '白居易', title: '忆江南', dynasty: '唐' },
  { id: 162, firstLine: '日出江花红胜火', secondLine: '春来江水绿如蓝', author: '白居易', title: '忆江南', dynasty: '唐' },
  { id: 163, firstLine: '春来江水绿如蓝', secondLine: '能不忆江南', author: '白居易', title: '忆江南', dynasty: '唐' },
  { id: 164, firstLine: '小娃撑小艇', secondLine: '偷采白莲回', author: '白居易', title: '池上', dynasty: '唐' },
  { id: 165, firstLine: '偷采白莲回', secondLine: '不解藏踪迹', author: '白居易', title: '池上', dynasty: '唐' },
  { id: 166, firstLine: '不解藏踪迹', secondLine: '浮萍一道开', author: '白居易', title: '池上', dynasty: '唐' },
  { id: 167, firstLine: '松下问童子', secondLine: '言师采药去', author: '贾岛', title: '寻隐者不遇', dynasty: '唐' },
  { id: 168, firstLine: '言师采药去', secondLine: '只在此山中', author: '贾岛', title: '寻隐者不遇', dynasty: '唐' },
  { id: 169, firstLine: '只在此山中', secondLine: '云深不知处', author: '贾岛', title: '寻隐者不遇', dynasty: '唐' },
  { id: 170, firstLine: '蓬头稚子学垂纶', secondLine: '侧坐莓苔草映身', author: '胡令能', title: '小儿垂钓', dynasty: '唐' },
  { id: 171, firstLine: '侧坐莓苔草映身', secondLine: '路人借问遥招手', author: '胡令能', title: '小儿垂钓', dynasty: '唐' },
  { id: 172, firstLine: '路人借问遥招手', secondLine: '怕得鱼惊不应人', author: '胡令能', title: '小儿垂钓', dynasty: '唐' },
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
  const prompt = isReverse ? pair.secondLine : pair.firstLine
  const correctAnswer = isReverse ? pair.firstLine : pair.secondLine

  const answerField = isReverse ? 'firstLine' : 'secondLine'
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
