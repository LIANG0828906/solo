export type CardType = 'info' | 'product' | 'person' | 'milestone';

export interface CardTemplate {
  type: CardType;
  name: string;
  title: string;
  description: string;
  backDescription: string;
  imageUrl: string;
  bgColor: string;
  primaryColor: string;
  buttonText: string;
}

export interface CardStyleParams {
  borderRadius: number;
  shadowIntensity: number;
}

export interface LayoutOffsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CardInteractionState {
  isHovered: boolean;
  isFlipped: boolean;
  isEditMode: boolean;
}

export const CARD_TEMPLATES: Record<CardType, CardTemplate> = {
  info: {
    type: 'info',
    name: '信息卡',
    title: '系统通知',
    description: '您有新的消息需要查看',
    backDescription: '消息详情：您的账户安全等级已更新，请及时确认。',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20blue%20tech%20illustration&image_size=square',
    bgColor: '#E3F2FD',
    primaryColor: '#1976D2',
    buttonText: '查看详情'
  },
  product: {
    type: 'product',
    name: '商品卡',
    title: '精选商品',
    description: '限时特惠，立享8折优惠',
    backDescription: '商品详情：采用优质材料，做工精细，提供一年质保服务。',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20product%20display%20pink&image_size=square',
    bgColor: '#FCE4EC',
    primaryColor: '#C2185B',
    buttonText: '立即购买'
  },
  person: {
    type: 'person',
    name: '人物卡',
    title: '张明',
    description: '高级产品设计师 / UI专家',
    backDescription: '个人简介：10年设计经验，曾主导多个千万级用户产品的设计工作。',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20warm%20tone&image_size=square',
    bgColor: '#FFF8E1',
    primaryColor: '#FF8F00',
    buttonText: '查看主页'
  },
  milestone: {
    type: 'milestone',
    name: '里程碑卡',
    title: '项目里程碑',
    description: 'Q2目标已完成90%',
    backDescription: '具体日期：2024年6月30日完成全部交付，团队绩效评级A+。',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=milestone%20achievement%20green&image_size=square',
    bgColor: '#F5F5F5',
    primaryColor: '#00796B',
    buttonText: '查看报告'
  }
};
