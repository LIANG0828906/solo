/**
 * 故事选择项接口
 * 定义单个选择按钮的数据结构，包含文本和跳转目标
 */
export interface StoryChoice {
  /** 选项的唯一标识符ID */
  id: string;
  /** 选择按钮上显示的文本内容 */
  text: string;
  /** 点击此选项后跳转的下一个故事节点ID，null表示到达结局 */
  nextNodeId: string | null;
}

/**
 * 故事节点接口
 * 定义一个完整的故事场景，包含标题、描述和两个分支选择
 */
export interface StoryNode {
  /** 节点的唯一标识符ID，用于状态管理和跳转定位 */
  id: string;
  /** 场景标题，显示在卡片顶部 */
  title: string;
  /** 场景描述文本，显示在卡片中间区域 */
  description: string;
  /** 两个分支选择项，固定长度为2的元组：
   *  choices[0] = 左侧按钮，choices[1] = 右侧按钮
   */
  choices: [StoryChoice, StoryChoice];
}

/**
 * 历史记录条目接口
 * 记录玩家做出的每一个选择，用于路径树展示和状态回溯
 */
export interface HistoryEntry {
  /** 做出此选择时所在的故事节点ID */
  nodeId: string;
  /** 选择的索引：0 = 左选择，1 = 右选择 */
  choiceIndex: 0 | 1;
  /** 选择按钮上的文本，用于路径树展示 */
  choiceText: string;
  /** 做出选择的时间戳（毫秒） */
  timestamp: number;
}
