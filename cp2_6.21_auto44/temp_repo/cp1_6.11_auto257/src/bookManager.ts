import { Book, SearchResult } from './types';

const MOCK_BOOKS = [
  { id: 'book-1', title: '论语', author: '孔子', content: '子曰学而时习之不亦说乎有朋自远方来不亦乐乎人不知而不愠不亦君子乎曾子曰吾日三省吾身为人谋而不忠乎与朋友交而不信乎传不习乎' },
  { id: 'book-2', title: '道德经', author: '老子', content: '道可道非常道名可名非常名无名天地之始有名万物之母故常无欲以观其妙常有欲以观其徼此两者同出而异名同谓之玄玄之又玄众妙之门' },
  { id: 'book-3', title: '诗经', author: '佚名', content: '关关雎鸠在河之洲窈窕淑女君子好逑参差荇菜左右流之窈窕淑女寤寐求之求之不得寤寐思服悠哉悠哉辗转反侧' },
  { id: 'book-4', title: '孟子', author: '孟子', content: '孟子见梁惠王王曰叟不远千里而来亦将有以利吾国乎孟子对曰王何必曰利亦有仁义而已矣' },
  { id: 'book-5', title: '庄子', author: '庄周', content: '北冥有鱼其名为鲲鲲之大不知其几千里也化而为鸟其名为鹏鹏之背不知其几千里也怒而飞其翼若垂天之云' },
  { id: 'book-6', title: '荀子', author: '荀况', content: '君子曰学不可以已青取之于蓝而青于蓝冰水为之而寒于水木直中绳輮以为轮其曲中规虽有槁暴不复挺者輮使之然也' },
  { id: 'book-7', title: '韩非子', author: '韩非', content: '道者万物之始是非之纪也是以明君守始以知万物之源治纪以知善败之端故虚静以待令名自命也令事自定也' },
  { id: 'book-8', title: '墨子', author: '墨翟', content: '子墨子言曰仁人之所以为事者必兴天下之利除去天下之害以此为事者也然则天下之利何也天下之害何也' },
  { id: 'book-9', title: '左传', author: '左丘明', content: '十年春齐师伐我公将战曹刿请见其乡人曰肉食者谋之又何间焉刿曰肉食者鄙未能远谋乃入见' },
  { id: 'book-10', title: '战国策', author: '刘向', content: '苏秦始将连横说秦惠王曰大王之国西有巴蜀汉中之利北有胡貉代马之用南有巫山黔中之限东有肴函之固' },
  { id: 'book-11', title: '史记', author: '司马迁', content: '太史公曰先人有言自周公卒五百岁而有孔子孔子卒后至于今五百岁有能绍明世正易传继春秋本诗书礼乐之际意在斯乎意在斯乎' },
  { id: 'book-12', title: '汉书', author: '班固', content: '高祖沛丰邑中阳里人也姓刘氏母媪尝息大泽之陂梦与神遇是时雷电晦冥父太公往视则见交龙于上已而有娠遂产高祖' },
  { id: 'book-13', title: '后汉书', author: '范晔', content: '刘秀字文叔南阳蔡阳人也高祖九世之孙也出自景帝生长沙定王发生舂陵节侯买买生郁林太守外外生巨鹿都尉回回生南顿令钦钦生光武' },
  { id: 'book-14', title: '三国志', author: '陈寿', content: '太祖武皇帝沛国谯人也姓曹讳操字孟德汉相国参之后桓帝世曹腾为中常侍大长秋封费亭侯养子嵩嗣官至太尉莫能审其生出本末' },
  { id: 'book-15', title: '资治通鉴', author: '司马光', content: '初命晋大夫魏斯赵籍韩虔为诸侯臣光曰臣闻天子之职莫大于礼礼莫大于分分莫大于名何谓礼纪纲是也何谓分君臣是也何谓名公侯卿大夫是也' },
  { id: 'book-16', title: '楚辞', author: '屈原', content: '帝高阳之苗裔兮朕皇考曰伯庸摄提贞于孟陬兮惟庚寅吾以降皇览揆余初度兮肇锡余以嘉名名余曰正则兮字余曰灵均' },
  { id: 'book-17', title: '文选', author: '萧统', content: '式观元始眇觌玄风冬穴夏巢之时茹毛饮血之世世质民淳斯文未作逮乎伏羲氏之王天下也始画八卦造书契以代结绳之政由是文籍生焉' },
  { id: 'book-18', title: '玉台新咏', author: '徐陵', content: '凌云概日由余之所未窥千门万户张衡之所曾赋周王璧台之上汉帝金屋之中玉树以珊瑚作枝珠帘以玳瑁为押' },
  { id: 'book-19', title: '乐府诗集', author: '郭茂倩', content: '青青园中葵朝露待日晞阳春布德泽万物生光辉常恐秋节至焜黄华叶衰百川东到海何时复西归少壮不努力老大徒伤悲' },
  { id: 'book-20', title: '全唐诗', author: '彭定求', content: '床前明月光疑是地上霜举头望明月低头思故乡李白字太白兴圣皇帝九世孙其先隋末以罪徙西域神龙初遁还客巴西' },
  { id: 'book-21', title: '全宋词', author: '唐圭璋', content: '明月几时有把酒问青天不知天上宫阙今夕是何年我欲乘风归去又恐琼楼玉宇高处不胜寒起舞弄清影何似在人间' },
  { id: 'book-22', title: '元曲选', author: '臧懋循', content: '天地也只合把清浊分辨可怎生糊涂了盗跖颜渊为善的受贫穷更命短造恶的享富贵又寿延天地也做得个怕硬欺软却原来也这般顺水推船' },
  { id: 'book-23', title: '西厢记', author: '王实甫', content: '永老无别离万古常完聚愿普天下有情的都成了眷属则为你如花美眷似水流年是答儿闲寻遍在幽闺自怜' },
  { id: 'book-24', title: '牡丹亭', author: '汤显祖', content: '天下女子有情宁有如杜丽娘者乎梦其人即病病即弥连至手画形容传于世而后死死三年矣复能溟莫中求得其所梦者而生' },
  { id: 'book-25', title: '红楼梦', author: '曹雪芹', content: '满纸荒唐言一把辛酸泪都云作者痴谁解其中味此开卷第一回也作者自云曾历过一番梦幻之后故将真事隐去而借通灵之说撰此石头记一书也' },
  { id: 'book-26', title: '西游记', author: '吴承恩', content: '诗曰混沌未分天地乱茫茫渺渺无人见自从盘古破鸿蒙开辟从兹清浊辨覆载群生仰至仁发明万物皆成善欲知造化会元功须看西游释厄传' },
  { id: 'book-27', title: '三国演义', author: '罗贯中', content: '滚滚长江东逝水浪花淘尽英雄是非成败转头空青山依旧在几度夕阳红白发渔樵江渚上惯看秋月春风一壶浊酒喜相逢古今多少事都付笑谈中' },
  { id: 'book-28', title: '水浒传', author: '施耐庵', content: '话说大宋仁宗天子在位嘉祐三年三月三日五更三点天子驾坐紫宸殿受百官朝贺但见祥云迷凤阁瑞气罩龙楼含烟御柳拂旌旗带露宫花迎剑戟' },
  { id: 'book-29', title: '儒林外史', author: '吴敬梓', content: '人生南北多歧路将相神仙也要凡人做百代兴亡朝复暮江风吹倒前朝树功名富贵无凭据费尽心情总把流光误浊酒三杯沉醉去水流花谢知何处' },
  { id: 'book-30', title: '聊斋志异', author: '蒲松龄', content: '披萝带荔三闾氏感而为骚牛鬼蛇神长爪郎吟而成癖自鸣天籁不择好音有由然矣松落落秋萤之火魑魅争光逐逐野马之尘罔两见笑' },
  { id: 'book-31', title: '尚书', author: '孔丘', content: '曰若稽古帝尧曰放勋钦明文思安安允恭克让光被四表格于上下克明俊德以亲九族九族既睦平章百姓百姓昭明协和万邦黎民于变时雍' },
  { id: 'book-32', title: '仪礼', author: '佚名', content: '士冠礼筮于庙门主人玄冠朝服缁带素韠即位于门东西面有司如主人服即位于西方东面北上筮人执筴抽上韇兼执之进受命于主人' },
  { id: 'book-33', title: '礼记', author: '戴圣', content: '敖不可长欲不可从志不可满乐不可极贤者狎而敬之畏而爱之爱而知其恶憎而知其善积而能散安安而能迁临财毋苟得临难毋苟免' },
  { id: 'book-34', title: '周易', author: '姬昌', content: '元亨利贞初九潜龙勿用九二见龙在田利见大人九三君子终日乾乾夕惕若厉无咎九四或跃在渊无咎九五飞龙在天利见大人上九亢龙有悔' },
  { id: 'book-35', title: '春秋', author: '孔子', content: '元年春王正月三月公及邾仪父盟于蔑夏五月郑伯克段于鄢秋七月天王使宰咺来归惠公仲子之赗九月及宋人盟于宿冬十有二月祭伯来公子益师卒' },
  { id: 'book-36', title: '公羊传', author: '公羊高', content: '元年者何君之始年也春者何岁之始也王者孰谓谓文王也曷为先言王而后言正月王正月也何言乎王正月大一统也' },
];

const SCROLL_COLORS = [
  { start: '#C4A882', end: '#8B6914' },
  { start: '#D4B892', end: '#9B7924' },
  { start: '#B89872', end: '#7B5904' },
  { start: '#CDB088', end: '#937114' },
];

export class BookManager {
  private books: Map<string, Book> = new Map();
  private bookList: Book[] = [];

  constructor() {
    this.initializeBooks();
  }

  private initializeBooks(): void {
    const totalBooks = MOCK_BOOKS.length;
    const rows = 4;
    const cols = Math.ceil(totalBooks / rows);

    MOCK_BOOKS.forEach((mock, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const colorIndex = index % SCROLL_COLORS.length;
      
      const book: Book = {
        id: mock.id,
        title: mock.title,
        author: mock.author,
        content: mock.content,
        characters: mock.content.split(''),
        shelfRow: row,
        shelfCol: col,
        isOpen: false,
        openProgress: 0,
        color: SCROLL_COLORS[colorIndex],
      };
      
      this.books.set(book.id, book);
      this.bookList.push(book);
    });
  }

  getAllBooks(): Book[] {
    return this.bookList;
  }

  getBookById(id: string): Book | undefined {
    return this.books.get(id);
  }

  openBook(id: string): void {
    const book = this.books.get(id);
    if (book) {
      book.isOpen = true;
      book.openProgress = 0;
    }
  }

  closeBook(id: string): void {
    const book = this.books.get(id);
    if (book) {
      book.isOpen = false;
      book.openProgress = 0;
    }
  }

  closeAllBooks(): void {
    this.bookList.forEach(book => {
      book.isOpen = false;
      book.openProgress = 0;
    });
  }

  updateOpenProgress(id: string, progress: number): void {
    const book = this.books.get(id);
    if (book) {
      book.openProgress = Math.max(0, Math.min(1, progress));
    }
  }

  startBlinkAnimation(bookIds: Set<string>): void {
    const now = Date.now();
    bookIds.forEach(id => {
      const book = this.books.get(id);
      if (book) {
        book.blinkStartTime = now;
        book.blinkPhase = 0;
      }
    });
  }

  updateBlinkAnimation(): void {
    const now = Date.now();
    const blinkDuration = 500;
    const maxBlinks = 3;

    this.bookList.forEach(book => {
      if (book.blinkStartTime !== undefined && book.blinkPhase !== undefined) {
        const elapsed = now - book.blinkStartTime;
        const phase = Math.floor(elapsed / blinkDuration);
        
        if (phase >= maxBlinks * 2) {
          book.blinkStartTime = undefined;
          book.blinkPhase = undefined;
        } else {
          book.blinkPhase = phase;
        }
      }
    });
  }

  search(query: string): SearchResult {
    const result: SearchResult = {
      bookIds: new Set<string>(),
      annotationIds: new Set<string>(),
    };

    if (!query.trim()) {
      return result;
    }

    const lowerQuery = query.toLowerCase();
    
    this.bookList.forEach(book => {
      if (
        book.title.toLowerCase().includes(lowerQuery) ||
        book.content.toLowerCase().includes(lowerQuery)
      ) {
        result.bookIds.add(book.id);
      }
    });

    return result;
  }

  getBooksCount(): number {
    return this.bookList.length;
  }

  getShelfDimensions(): { rows: number; cols: number } {
    const rows = 4;
    const cols = Math.ceil(this.bookList.length / rows);
    return { rows, cols };
  }
}
