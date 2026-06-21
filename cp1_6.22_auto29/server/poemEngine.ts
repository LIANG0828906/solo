export interface Poem {
  title: string;
  author: string;
  dynasty: string;
  lines: string[];
}

export interface Verse {
  text: string;
  source: string;
  author: string;
  dynasty: string;
  lastChar: string;
  firstChar: string;
}

const POEMS: Poem[] = [
  { title: '静夜思', author: '李白', dynasty: '唐', lines: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
  { title: '春晓', author: '孟浩然', dynasty: '唐', lines: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'] },
  { title: '登鹳雀楼', author: '王之涣', dynasty: '唐', lines: ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'] },
  { title: '相思', author: '王维', dynasty: '唐', lines: ['红豆生南国', '春来发几枝', '愿君多采撷', '此物最相思'] },
  { title: '江雪', author: '柳宗元', dynasty: '唐', lines: ['千山鸟飞绝', '万径人踪灭', '孤舟蓑笠翁', '独钓寒江雪'] },
  { title: '悯农', author: '李绅', dynasty: '唐', lines: ['锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦'] },
  { title: '咏鹅', author: '骆宾王', dynasty: '唐', lines: ['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波'] },
  { title: '望庐山瀑布', author: '李白', dynasty: '唐', lines: ['日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天'] },
  { title: '早发白帝城', author: '李白', dynasty: '唐', lines: ['朝辞白帝彩云间', '千里江陵一日还', '两岸猿声啼不住', '轻舟已过万重山'] },
  { title: '望天门山', author: '李白', dynasty: '唐', lines: ['天门中断楚江开', '碧水东流至此回', '两岸青山相对出', '孤帆一片日边来'] },
  { title: '赠汪伦', author: '李白', dynasty: '唐', lines: ['李白乘舟将欲行', '忽闻岸上踏歌声', '桃花潭水深千尺', '不及汪伦送我情'] },
  { title: '黄鹤楼送孟浩然之广陵', author: '李白', dynasty: '唐', lines: ['故人西辞黄鹤楼', '烟花三月下扬州', '孤帆远影碧空尽', '唯见长江天际流'] },
  { title: '独坐敬亭山', author: '李白', dynasty: '唐', lines: ['众鸟高飞尽', '孤云独去闲', '相看两不厌', '只有敬亭山'] },
  { title: '春望', author: '杜甫', dynasty: '唐', lines: ['国破山河在', '城春草木深', '感时花溅泪', '恨别鸟惊心', '烽火连三月', '家书抵万金', '白头搔更短', '浑欲不胜簪'] },
  { title: '绝句', author: '杜甫', dynasty: '唐', lines: ['两个黄鹂鸣翠柳', '一行白鹭上青天', '窗含西岭千秋雪', '门泊东吴万里船'] },
  { title: '春夜喜雨', author: '杜甫', dynasty: '唐', lines: ['好雨知时节', '当春乃发生', '随风潜入夜', '润物细无声'] },
  { title: '江畔独步寻花', author: '杜甫', dynasty: '唐', lines: ['黄四娘家花满蹊', '千朵万朵压枝低', '留连戏蝶时时舞', '自在娇莺恰恰啼'] },
  { title: '出塞', author: '王昌龄', dynasty: '唐', lines: ['秦时明月汉时关', '万里长征人未还', '但使龙城飞将在', '不教胡马度阴山'] },
  { title: '芙蓉楼送辛渐', author: '王昌龄', dynasty: '唐', lines: ['寒雨连江夜入吴', '平明送客楚山孤', '洛阳亲友如相问', '一片冰心在玉壶'] },
  { title: '凉州词', author: '王翰', dynasty: '唐', lines: ['葡萄美酒夜光杯', '欲饮琵琶马上催', '醉卧沙场君莫笑', '古来征战几人回'] },
  { title: '送元二使安西', author: '王维', dynasty: '唐', lines: ['渭城朝雨浥轻尘', '客舍青青柳色新', '劝君更尽一杯酒', '西出阳关无故人'] },
  { title: '九月九日忆山东兄弟', author: '王维', dynasty: '唐', lines: ['独在异乡为异客', '每逢佳节倍思亲', '遥知兄弟登高处', '遍插茱萸少一人'] },
  { title: '鹿柴', author: '王维', dynasty: '唐', lines: ['空山不见人', '但闻人语响', '返景入深林', '复照青苔上'] },
  { title: '竹里馆', author: '王维', dynasty: '唐', lines: ['独坐幽篁里', '弹琴复长啸', '深林人不知', '明月来相照'] },
  { title: '山行', author: '杜牧', dynasty: '唐', lines: ['远上寒山石径斜', '白云生处有人家', '停车坐爱枫林晚', '霜叶红于二月花'] },
  { title: '清明', author: '杜牧', dynasty: '唐', lines: ['清明时节雨纷纷', '路上行人欲断魂', '借问酒家何处有', '牧童遥指杏花村'] },
  { title: '江南春', author: '杜牧', dynasty: '唐', lines: ['千里莺啼绿映红', '水村山郭酒旗风', '南朝四百八十寺', '多少楼台烟雨中'] },
  { title: '泊秦淮', author: '杜牧', dynasty: '唐', lines: ['烟笼寒水月笼沙', '夜泊秦淮近酒家', '商女不知亡国恨', '隔江犹唱后庭花'] },
  { title: '赋得古原草送别', author: '白居易', dynasty: '唐', lines: ['离离原上草', '一岁一枯荣', '野火烧不尽', '春风吹又生'] },
  { title: '忆江南', author: '白居易', dynasty: '唐', lines: ['江南好', '风景旧曾谙', '日出江花红胜火', '春来江水绿如蓝', '能不忆江南'] },
  { title: '池上', author: '白居易', dynasty: '唐', lines: ['小娃撑小艇', '偷采白莲回', '不解藏踪迹', '浮萍一道开'] },
  { title: '枫桥夜泊', author: '张继', dynasty: '唐', lines: ['月落乌啼霜满天', '江枫渔火对愁眠', '姑苏城外寒山寺', '夜半钟声到客船'] },
  { title: '游子吟', author: '孟郊', dynasty: '唐', lines: ['慈母手中线', '游子身上衣', '临行密密缝', '意恐迟迟归', '谁言寸草心', '报得三春晖'] },
  { title: '乌衣巷', author: '刘禹锡', dynasty: '唐', lines: ['朱雀桥边野草花', '乌衣巷口夕阳斜', '旧时王谢堂前燕', '飞入寻常百姓家'] },
  { title: '望洞庭', author: '刘禹锡', dynasty: '唐', lines: ['湖光秋月两相和', '潭面无风镜未磨', '遥望洞庭山水翠', '白银盘里一青螺'] },
  { title: '浪淘沙', author: '刘禹锡', dynasty: '唐', lines: ['九曲黄河万里沙', '浪淘风簸自天涯', '如今直上银河去', '同到牵牛织女家'] },
  { title: '惠崇春江晚景', author: '苏轼', dynasty: '宋', lines: ['竹外桃花三两枝', '春江水暖鸭先知', '蒌蒿满地芦芽短', '正是河豚欲上时'] },
  { title: '题西林壁', author: '苏轼', dynasty: '宋', lines: ['横看成岭侧成峰', '远近高低各不同', '不识庐山真面目', '只缘身在此山中'] },
  { title: '饮湖上初晴后雨', author: '苏轼', dynasty: '宋', lines: ['水光潋滟晴方好', '山色空蒙雨亦奇', '欲把西湖比西子', '淡妆浓抹总相宜'] },
  { title: '赠刘景文', author: '苏轼', dynasty: '宋', lines: ['荷尽已无擎雨盖', '菊残犹有傲霜枝', '一年好景君须记', '最是橙黄橘绿时'] },
  { title: '示儿', author: '陆游', dynasty: '宋', lines: ['死去元知万事空', '但悲不见九州同', '王师北定中原日', '家祭无忘告乃翁'] },
  { title: '秋夜将晓出篱门迎凉有感', author: '陆游', dynasty: '宋', lines: ['三万里河东入海', '五千仞岳上摩天', '遗民泪尽胡尘里', '南望王师又一年'] },
  { title: '四时田园杂兴', author: '范成大', dynasty: '宋', lines: ['昼出耘田夜绩麻', '村庄儿女各当家', '童孙未解供耕织', '也傍桑阴学种瓜'] },
  { title: '小池', author: '杨万里', dynasty: '宋', lines: ['泉眼无声惜细流', '树阴照水爱晴柔', '小荷才露尖尖角', '早有蜻蜓立上头'] },
  { title: '晓出净慈寺送林子方', author: '杨万里', dynasty: '宋', lines: ['毕竟西湖六月中', '风光不与四时同', '接天莲叶无穷碧', '映日荷花别样红'] },
  { title: '春日', author: '朱熹', dynasty: '宋', lines: ['胜日寻芳泗水滨', '无边光景一时新', '等闲识得东风面', '万紫千红总是春'] },
  { title: '观书有感', author: '朱熹', dynasty: '宋', lines: ['半亩方塘一鉴开', '天光云影共徘徊', '问渠那得清如许', '为有源头活水来'] },
  { title: '元日', author: '王安石', dynasty: '宋', lines: ['爆竹声中一岁除', '春风送暖入屠苏', '千门万户曈曈日', '总把新桃换旧符'] },
  { title: '泊船瓜洲', author: '王安石', dynasty: '宋', lines: ['京口瓜洲一水间', '钟山只隔数重山', '春风又绿江南岸', '明月何时照我还'] },
  { title: '书湖阴先生壁', author: '王安石', dynasty: '宋', lines: ['茅檐长扫净无苔', '花木成畦手自栽', '一水护田将绿绕', '两山排闼送青来'] },
  { title: '六月二十七日望湖楼醉书', author: '苏轼', dynasty: '宋', lines: ['黑云翻墨未遮山', '白雨跳珠乱入船', '卷地风来忽吹散', '望湖楼下水如天'] },
  { title: '凉州词', author: '王之涣', dynasty: '唐', lines: ['黄河远上白云间', '一片孤城万仞山', '羌笛何须怨杨柳', '春风不度玉门关'] },
  { title: '夜雨寄北', author: '李商隐', dynasty: '唐', lines: ['君问归期未有期', '巴山夜雨涨秋池', '何当共剪西窗烛', '却话巴山夜雨时'] },
  { title: '无题', author: '李商隐', dynasty: '唐', lines: ['相见时难别亦难', '东风无力百花残', '春蚕到死丝方尽', '蜡炬成灰泪始干'] },
  { title: '嫦娥', author: '李商隐', dynasty: '唐', lines: ['云母屏风烛影深', '长河渐落晓星沉', '嫦娥应悔偷灵药', '碧海青天夜夜心'] },
  { title: '乐游原', author: '李商隐', dynasty: '唐', lines: ['向晚意不适', '驱车登古原', '夕阳无限好', '只是近黄昏'] },
  { title: '竹石', author: '郑燮', dynasty: '清', lines: ['咬定青山不放松', '立根原在破岩中', '千磨万击还坚劲', '任尔东西南北风'] },
  { title: '己亥杂诗', author: '龚自珍', dynasty: '清', lines: ['九州生气恃风雷', '万马齐喑究可哀', '我劝天公重抖擞', '不拘一格降人才'] },
  { title: '村居', author: '高鼎', dynasty: '清', lines: ['草长莺飞二月天', '拂堤杨柳醉春烟', '儿童散学归来早', '忙趁东风放纸鸢'] },
  { title: '所见', author: '袁枚', dynasty: '清', lines: ['牧童骑黄牛', '歌声振林樾', '意欲捕鸣蝉', '忽然闭口立'] },
  { title: '题临安邸', author: '林升', dynasty: '宋', lines: ['山外青山楼外楼', '西湖歌舞几时休', '暖风熏得游人醉', '直把杭州作汴州'] },
  { title: '游园不值', author: '叶绍翁', dynasty: '宋', lines: ['应怜屐齿印苍苔', '小扣柴扉久不开', '春色满园关不住', '一枝红杏出墙来'] },
  { title: '乡村四月', author: '翁卷', dynasty: '宋', lines: ['绿遍山原白满川', '子规声里雨如烟', '乡村四月闲人少', '才了蚕桑又插田'] },
  { title: '墨梅', author: '王冕', dynasty: '元', lines: ['我家洗砚池头树', '朵朵花开淡墨痕', '不要人夸好颜色', '只留清气满乾坤'] },
  { title: '石灰吟', author: '于谦', dynasty: '明', lines: ['千锤万凿出深山', '烈火焚烧若等闲', '粉骨碎身浑不怕', '要留清白在人间'] },
  { title: '咏柳', author: '贺知章', dynasty: '唐', lines: ['碧玉妆成一树高', '万条垂下绿丝绦', '不知细叶谁裁出', '二月春风似剪刀'] },
  { title: '回乡偶书', author: '贺知章', dynasty: '唐', lines: ['少小离家老大回', '乡音无改鬓毛衰', '儿童相见不相识', '笑问客从何处来'] },
  { title: '寻隐者不遇', author: '贾岛', dynasty: '唐', lines: ['松下问童子', '言师采药去', '只在此山中', '云深不知处'] },
  { title: '题诗后', author: '贾岛', dynasty: '唐', lines: ['两句三年得', '一吟双泪流', '知音如不赏', '归卧故山秋'] },
  { title: '剑客', author: '贾岛', dynasty: '唐', lines: ['十年磨一剑', '霜刃未曾试', '今日把示君', '谁有不平事'] },
  { title: '题都城南庄', author: '崔护', dynasty: '唐', lines: ['去年今日此门中', '人面桃花相映红', '人面不知何处去', '桃花依旧笑春风'] },
  { title: '滁州西涧', author: '韦应物', dynasty: '唐', lines: ['独怜幽草涧边生', '上有黄鹂深树鸣', '春潮带雨晚来急', '野渡无人舟自横'] },
  { title: '塞下曲', author: '卢纶', dynasty: '唐', lines: ['月黑雁飞高', '单于夜遁逃', '欲将轻骑逐', '大雪满弓刀'] },
  { title: '悯农其一', author: '李绅', dynasty: '唐', lines: ['春种一粒粟', '秋收万颗子', '四海无闲田', '农夫犹饿死'] },
  { title: '从军行', author: '杨炯', dynasty: '唐', lines: ['烽火照西京', '心中自不平', '牙璋辞凤阙', '铁骑绕龙城'] },
  { title: '渡汉江', author: '宋之问', dynasty: '唐', lines: ['岭外音书断', '经冬复历春', '近乡情更怯', '不敢问来人'] },
  { title: '蜀中九日', author: '王勃', dynasty: '唐', lines: ['九月九日望乡台', '他席他乡送客杯', '人情已厌南中苦', '鸿雁那从北地来'] },
  { title: '送杜少府之任蜀州', author: '王勃', dynasty: '唐', lines: ['城阙辅三秦', '风烟望五津', '与君离别意', '同是宦游人', '海内存知己', '天涯若比邻'] },
  { title: '登幽州台歌', author: '陈子昂', dynasty: '唐', lines: ['前不见古人', '后不见来者', '念天地之悠悠', '独怆然而涕下'] },
  { title: '春江花月夜', author: '张若虚', dynasty: '唐', lines: ['春江潮水连海平', '海上明月共潮生', '滟滟随波千万里', '何处春江无月明'] },
  { title: '望月怀远', author: '张九龄', dynasty: '唐', lines: ['海上生明月', '天涯共此时', '情人怨遥夜', '竟夕起相思'] },
  { title: '感遇', author: '张九龄', dynasty: '唐', lines: ['兰叶春葳蕤', '桂华秋皎洁', '欣欣此生意', '自尔为佳节'] },
  { title: '桃花溪', author: '张旭', dynasty: '唐', lines: ['隐隐飞桥隔野烟', '石矶西畔问渔船', '桃花尽日随流水', '洞在清溪何处边'] },
  { title: '山行留客', author: '张旭', dynasty: '唐', lines: ['山光物态弄春晖', '莫为轻阴便拟归', '纵使晴明无雨色', '入云深处亦沾衣'] },
  { title: '采莲曲', author: '王昌龄', dynasty: '唐', lines: ['荷叶罗裙一色裁', '芙蓉向脸两边开', '乱入池中看不见', '闻歌始觉有人来'] },
  { title: '闺怨', author: '王昌龄', dynasty: '唐', lines: ['闺中少妇不知愁', '春日凝妆上翠楼', '忽见陌头杨柳色', '悔教夫婿觅封侯'] },
  { title: '从军行其四', author: '王昌龄', dynasty: '唐', lines: ['青海长云暗雪山', '孤城遥望玉门关', '黄沙百战穿金甲', '不破楼兰终不还'] },
  { title: '长干行', author: '崔颢', dynasty: '唐', lines: ['君家何处住', '妾住在横塘', '停船暂借问', '或恐是同乡'] },
  { title: '黄鹤楼', author: '崔颢', dynasty: '唐', lines: ['昔人已乘黄鹤去', '此地空余黄鹤楼', '黄鹤一去不复返', '白云千载空悠悠'] },
  { title: '行经华阴', author: '崔颢', dynasty: '唐', lines: ['岧峣太华俯咸京', '天外三峰削不成', '武帝祠前云欲散', '仙人掌上雨初晴'] },
  { title: '夜上受降城闻笛', author: '李益', dynasty: '唐', lines: ['回乐峰前沙似雪', '受降城外月如霜', '不知何处吹芦管', '一夜征人尽望乡'] },
  { title: '喜见外弟又言别', author: '李益', dynasty: '唐', lines: ['十年离乱后', '长大一相逢', '问姓惊初见', '称名忆旧容'] },
  { title: '雁门太守行', author: '李贺', dynasty: '唐', lines: ['黑云压城城欲摧', '甲光向日金鳞开', '角声满天秋色里', '塞上燕脂凝夜紫'] },
  { title: '李凭箜篌引', author: '李贺', dynasty: '唐', lines: ['吴丝蜀桐张高秋', '空山凝云颓不流', '江娥啼竹素女愁', '李凭中国弹箜篌'] },
  { title: '金铜仙人辞汉歌', author: '李贺', dynasty: '唐', lines: ['茂陵刘郎秋风客', '夜闻马嘶晓无迹', '画栏桂树悬秋香', '三十六宫土花碧'] },
  { title: '苏武庙', author: '温庭筠', dynasty: '唐', lines: ['苏武魂销汉使前', '古祠高树两茫然', '云边雁断胡天月', '陇上羊归塞草烟'] },
  { title: '商山早行', author: '温庭筠', dynasty: '唐', lines: ['晨起动征铎', '客行悲故乡', '鸡声茅店月', '人迹板桥霜'] },
  { title: '陇西行', author: '陈陶', dynasty: '唐', lines: ['誓扫匈奴不顾身', '五千貂锦丧胡尘', '可怜无定河边骨', '犹是春闺梦里人'] },
  { title: '己亥岁', author: '曹松', dynasty: '唐', lines: ['泽国江山入战图', '生民何计乐樵苏', '凭君莫话封侯事', '一将功成万骨枯'] },
  { title: '春怨', author: '金昌绪', dynasty: '唐', lines: ['打起黄莺儿', '莫教枝上啼', '啼时惊妾梦', '不得到辽西'] },
];

const RHYME_MAP: Record<string, string> = {
  光: 'ang', 霜: 'ang', 乡: 'ang', 望: 'ang', 张: 'ang', 长: 'ang', 床: 'ang',
  明: 'ing', 行: 'ing', 声: 'ing', 情: 'ing', 青: 'ing', 清: 'ing', 轻: 'ing', 听: 'ing',
  流: 'ou', 楼: 'ou', 秋: 'ou', 舟: 'ou', 愁: 'ou', 头: 'ou', 侯: 'ou',
  国: 'uo', 多: 'uo', 何: 'uo', 歌: 'uo', 波: 'uo',
  绝: 'ue', 雪: 'ue', 别: 'ue', 月: 'ue', 缺: 'ue',
  水: 'ui', 醉: 'ui', 岁: 'ui', 泪: 'ui',
  人: 'en', 春: 'en', 尘: 'en', 身: 'en', 新: 'en', 心: 'en', 深: 'en',
  天: 'ian', 年: 'ian', 烟: 'ian', 前: 'ian', 边: 'ian', 眠: 'ian', 船: 'ian',
  山: 'an', 还: 'an', 间: 'an', 关: 'an', 寒: 'an', 看: 'an', 颜: 'an',
  风: 'eng', 中: 'eng', 红: 'eng', 空: 'eng', 东: 'eng', 同: 'eng', 通: 'eng',
  来: 'ai', 开: 'ai', 台: 'ai', 白: 'ai', 海: 'ai',
  飞: 'ei', 归: 'ei', 杯: 'ei', 梅: 'ei',
  家: 'a', 花: 'a', 华: 'a', 斜: 'a', 霞: 'a', 沙: 'a', 涯: 'a',
  门: 'en', 村: 'en', 痕: 'en', 魂: 'en',
  高: 'ao', 毛: 'ao', 涛: 'ao', 毫: 'ao',
  诗: 'i', 知: 'i', 时: 'i', 枝: 'i', 池: 'i', 迟: 'i', 师: 'i', 思: 'i',
  千: 'ian', 烟: 'ian', 边: 'ian', 联: 'ian',
  如: 'u', 初: 'u', 书: 'u', 居: 'u',
  林: 'in', 心: 'in', 吟: 'in', 金: 'in', 音: 'in',
  游: 'ou', 愁: 'ou', 留: 'ou', 秋: 'ou',
  难: 'an', 残: 'an', 看: 'an', 寒: 'an',
  终: 'ong', 风: 'ong', 红: 'ong', 同: 'ong',
  云: 'un', 人: 'un', 春: 'un', 君: 'un',
  色: 'e', 客: 'e', 白: 'e',
  老: 'ao', 早: 'ao', 草: 'ao', 道: 'ao',
  死: 'i', 子: 'i', 里: 'i', 此: 'i',
  青: 'ing', 听: 'ing', 星: 'ing', 醒: 'ing',
  柳: 'iu', 酒: 'iu', 九: 'iu', 旧: 'iu',
  北: 'ei', 黑: 'ei', 得: 'ei',
  足: 'u', 竹: 'u', 绿: 'u',
  近: 'in', 进: 'in', 尽: 'in', 紧: 'in',
  平: 'ing', 鸣: 'ing', 名: 'ing', 明: 'ing',
  语: 'u', 雨: 'u', 许: 'u', 女: 'u',
  乐: 'e', 鹤: 'e', 阁: 'e',
  剑: 'ian', 念: 'ian', 见: 'ian', 面: 'ian',
  作: 'uo', 落: 'uo', 昨: 'uo',
  日: 'i', 一: 'i', 七: 'i',
  暮: 'u', 路: 'u', 故: 'u', 度: 'u',
  从: 'ong', 重: 'ong', 浓: 'ong', 红: 'ong',
  帝: 'i', 地: 'i', 寄: 'i', 际: 'i',
  斜: 'a', 家: 'a', 花: 'a', 华: 'a',
};

function getLastChar(text: string): string {
  const trimmed = text.trim().replace(/[，。！？、；：,.!?;:]/g, '');
  return trimmed.length > 0 ? trimmed[trimmed.length - 1] : '';
}

function getFirstChar(text: string): string {
  const trimmed = text.trim().replace(/[，。！？、；：,.!?;:]/g, '');
  return trimmed.length > 0 ? trimmed[0] : '';
}

export function checkRhyme(lastChar: string, firstChar: string): boolean {
  if (!lastChar || !firstChar) return false;
  if (lastChar === firstChar) return true;
  const l = RHYME_MAP[lastChar];
  const f = RHYME_MAP[firstChar];
  return !!(l && f && l === f);
}

export function getRandomVerse(): Verse {
  const poem = POEMS[Math.floor(Math.random() * POEMS.length)];
  const lineIdx = Math.floor(Math.random() * Math.max(1, poem.lines.length - 1));
  const line = poem.lines[lineIdx];
  return {
    text: line,
    source: poem.title,
    author: poem.author,
    dynasty: poem.dynasty,
    lastChar: getLastChar(line),
    firstChar: getFirstChar(line),
  };
}

export function verifyVerse(prevVerse: Verse, inputText: string): { valid: boolean; reason: string; matchedPoem?: Poem; matchedLine?: number } {
  const normalized = inputText.trim().replace(/[，。！？、；：,.!?;:]/g, '');
  if (normalized.length < 3) {
    return { valid: false, reason: '诗句过短，至少3字' };
  }
  const inputFirst = getFirstChar(normalized);
  const inputLast = getLastChar(normalized);
  const prevLast = prevVerse.lastChar;

  if (!checkRhyme(prevLast, inputFirst)) {
    return { valid: false, reason: `首字需与上句尾字"${prevLast}"相同或押韵，当前首字为"${inputFirst}"` };
  }

  let foundInLibrary = false;
  let matchedPoem: Poem | undefined;
  let matchedLine = -1;

  for (const poem of POEMS) {
    for (let i = 0; i < poem.lines.length; i++) {
      const libLine = poem.lines[i].replace(/[，。！？、；：,.!?;:]/g, '');
      if (libLine === normalized || libLine.includes(normalized) || normalized.includes(libLine)) {
        foundInLibrary = true;
        matchedPoem = poem;
        matchedLine = i;
        break;
      }
    }
    if (foundInLibrary) break;
  }

  if (!foundInLibrary) {
    const charMatch = prevLast === inputFirst || (RHYME_MAP[prevLast] && RHYME_MAP[inputFirst] && RHYME_MAP[prevLast] === RHYME_MAP[inputFirst]);
    if (charMatch) {
      return {
        valid: true,
        reason: '接龙成功（尾字匹配），诗句未在库中，按自由创作计',
      };
    }
    return { valid: false, reason: `未找到匹配诗句，且首字"${inputFirst}"与尾字"${prevLast}"不押韵` };
  }

  return {
    valid: true,
    reason: '接龙成功！',
    matchedPoem,
    matchedLine,
  };
}

export function buildVerseFromMatch(
  inputText: string,
  matchedPoem: Poem | undefined,
  matchedLineIdx: number,
): Verse {
  const text = inputText.trim().replace(/[，。！？、；：,.!?;:]/g, '');

  let source = '自由创作';
  let author = '佚名';
  let dynasty = '';

  if (matchedPoem) {
    source = matchedPoem.title;
    author = matchedPoem.author;
    dynasty = matchedPoem.dynasty;
  }

  return {
    text,
    source,
    author,
    dynasty,
    lastChar: getLastChar(text),
    firstChar: getFirstChar(text),
  };
}

export { POEMS };
