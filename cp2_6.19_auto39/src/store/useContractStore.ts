import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  ContractStore,
  Clause,
  Role,
  FilterType,
} from '../types';

const STORAGE_KEY = 'contract_negotiation_data';

const createInitialClauses = (): Clause[] => [
  {
    id: uuidv4(),
    clauseNumber: 1,
    title: '合作内容与范围',
    content:
      '本合同项下，甲方委托乙方作为其在华东地区的独家合作伙伴，负责甲方旗下全系列智能硬件产品的市场推广、渠道销售及售后服务支持工作。合作范围涵盖线下实体零售渠道、线上电商平台分销以及企业级客户定制化解决方案三大板块。乙方应严格按照甲方制定的市场策略和价格体系开展业务，不得擅自调整产品定价或跨越授权区域进行销售活动。双方约定的合作期限为自合同生效之日起计算，共计二十四个月。合作期满前六十日，双方可就续约事宜进行友好协商并另行签署补充协议。',
    originalContent:
      '本合同项下，甲方委托乙方作为其在华东地区的独家合作伙伴，负责甲方旗下全系列智能硬件产品的市场推广、渠道销售及售后服务支持工作。合作范围涵盖线下实体零售渠道、线上电商平台分销以及企业级客户定制化解决方案三大板块。乙方应严格按照甲方制定的市场策略和价格体系开展业务，不得擅自调整产品定价或跨越授权区域进行销售活动。双方约定的合作期限为自合同生效之日起计算，共计二十四个月。合作期满前六十日，双方可就续约事宜进行友好协商并另行签署补充协议。',
  },
  {
    id: uuidv4(),
    clauseNumber: 2,
    title: '价格政策与结算方式',
    content:
      '甲方给予乙方的供货价格为市场建议零售价的四五折，该价格已包含标准包装及运输至乙方指定仓库的物流费用，但不包含增值税专用发票税费。乙方应在每月二十五日前向甲方提交下一月度的订货计划，甲方在收到订单及全额货款后三个工作日内安排发货。结算方式采用银行转账或电子承兑汇票，账期不超过三十日。若乙方单次订货金额达到五十万元以上，可享受额外两个百分点的价格优惠。对于滞销产品，甲方允许乙方在产品入库后九十日内申请调换，调换产生的物流费用由乙方自行承担。',
    originalContent:
      '甲方给予乙方的供货价格为市场建议零售价的四五折，该价格已包含标准包装及运输至乙方指定仓库的物流费用，但不包含增值税专用发票税费。乙方应在每月二十五日前向甲方提交下一月度的订货计划，甲方在收到订单及全额货款后三个工作日内安排发货。结算方式采用银行转账或电子承兑汇票，账期不超过三十日。若乙方单次订货金额达到五十万元以上，可享受额外两个百分点的价格优惠。对于滞销产品，甲方允许乙方在产品入库后九十日内申请调换，调换产生的物流费用由乙方自行承担。',
  },
  {
    id: uuidv4(),
    clauseNumber: 3,
    title: '质量保证与售后服务',
    content:
      '甲方承诺所提供产品均符合国家相关质量标准及行业规范，并提供自产品售出之日起为期十二个月的免费保修服务。保修期内因产品本身质量问题导致的故障，甲方负责免费维修或更换全新产品；因人为损坏或不可抗力因素造成的损坏，甲方可提供有偿维修服务，具体费用由双方另行协商。乙方应建立完善的售后服务体系，配备专业的技术支持人员，在接到客户报修后二十四小时内给予响应，七个工作日内完成维修处理。对于重大质量问题，甲方应在接到乙方反馈后派遣技术专家赴现场协助解决。',
    originalContent:
      '甲方承诺所提供产品均符合国家相关质量标准及行业规范，并提供自产品售出之日起为期十二个月的免费保修服务。保修期内因产品本身质量问题导致的故障，甲方负责免费维修或更换全新产品；因人为损坏或不可抗力因素造成的损坏，甲方可提供有偿维修服务，具体费用由双方另行协商。乙方应建立完善的售后服务体系，配备专业的技术支持人员，在接到客户报修后二十四小时内给予响应，七个工作日内完成维修处理。对于重大质量问题，甲方应在接到乙方反馈后派遣技术专家赴现场协助解决。',
  },
  {
    id: uuidv4(),
    clauseNumber: 4,
    title: '保密条款与知识产权',
    content:
      '双方在合作过程中获知的对方商业秘密、技术资料、客户信息及其他未公开的经营信息，均属于保密范围，未经对方书面同意，任何一方不得向第三方泄露或用于本合同以外的目的。保密义务在本合同终止后仍然持续有效，期限为自合同终止之日起五年。甲方拥有其产品的全部知识产权，包括但不限于专利权、商标权、著作权及专有技术。乙方仅有权在授权范围内使用甲方的品牌标识和产品资料，不得擅自修改、复制或用于其他产品。任何一方违反保密义务的，应向对方支付相当于合同总金额百分之二十的违约金，并赔偿由此造成的全部经济损失。',
    originalContent:
      '双方在合作过程中获知的对方商业秘密、技术资料、客户信息及其他未公开的经营信息，均属于保密范围，未经对方书面同意，任何一方不得向第三方泄露或用于本合同以外的目的。保密义务在本合同终止后仍然持续有效，期限为自合同终止之日起五年。甲方拥有其产品的全部知识产权，包括但不限于专利权、商标权、著作权及专有技术。乙方仅有权在授权范围内使用甲方的品牌标识和产品资料，不得擅自修改、复制或用于其他产品。任何一方违反保密义务的，应向对方支付相当于合同总金额百分之二十的违约金，并赔偿由此造成的全部经济损失。',
  },
  {
    id: uuidv4(),
    clauseNumber: 5,
    title: '违约责任与争议解决',
    content:
      '若任何一方未按本合同约定履行义务，即构成违约，违约方应承担相应的违约责任。乙方若连续两个季度未能完成约定销售目标，甲方有权取消其独家合作伙伴资格。甲方若未能按约定时间供货，每逾期一日应按逾期交货金额的万分之五向乙方支付违约金。因履行本合同发生的任何争议，双方应首先通过友好协商解决；协商不成的，任何一方均有权向甲方所在地有管辖权的人民法院提起诉讼。本合同的订立、效力、解释、履行及争议解决均适用中华人民共和国法律。本合同未尽事宜，双方可另行签订补充协议，补充协议与本合同具有同等法律效力。',
    originalContent:
      '若任何一方未按本合同约定履行义务，即构成违约，违约方应承担相应的违约责任。乙方若连续两个季度未能完成约定销售目标，甲方有权取消其独家合作伙伴资格。甲方若未能按约定时间供货，每逾期一日应按逾期交货金额的万分之五向乙方支付违约金。因履行本合同发生的任何争议，双方应首先通过友好协商解决；协商不成的，任何一方均有权向甲方所在地有管辖权的人民法院提起诉讼。本合同的订立、效力、解释、履行及争议解决均适用中华人民共和国法律。本合同未尽事宜，双方可另行签订补充协议，补充协议与本合同具有同等法律效力。',
  },
];

const getInitialState = (): Omit<
  ContractStore,
  | 'addComment'
  | 'resolveComment'
  | 'deleteComment'
  | 'setFilterType'
  | 'setHighlightedClause'
  | 'addRevision'
  | 'acceptRevision'
  | 'rejectRevision'
  | 'setCurrentRole'
  | 'saveSignature'
  | 'setShowConfirmModal'
  | 'resetContract'
> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        id: parsed.id || uuidv4(),
        title: parsed.title || '智能硬件产品独家合作协议',
        clauses: parsed.clauses || createInitialClauses(),
        comments: parsed.comments || [],
        revisions: parsed.revisions || [],
        initiatorSignature: parsed.initiatorSignature || null,
        receiverSignature: parsed.receiverSignature || null,
        status: parsed.status || 'draft',
        currentRole: parsed.currentRole || ('initiator' as Role),
        highlightedClauseId: null,
        filterType: 'all' as FilterType,
        showConfirmModal: false,
      };
    }
  } catch {
    // ignore
  }

  return {
    id: uuidv4(),
    title: '智能硬件产品独家合作协议',
    clauses: createInitialClauses(),
    comments: [],
    revisions: [],
    initiatorSignature: null,
    receiverSignature: null,
    status: 'draft',
    currentRole: 'initiator' as Role,
    highlightedClauseId: null,
    filterType: 'all' as FilterType,
    showConfirmModal: false,
  };
};

export const useContractStore = create<ContractStore>((set, get) => {
  const saveToStorage = () => {
    const state = get();
    try {
      const toSave = {
        id: state.id,
        title: state.title,
        clauses: state.clauses,
        comments: state.comments,
        revisions: state.revisions,
        initiatorSignature: state.initiatorSignature,
        receiverSignature: state.receiverSignature,
        status: state.status,
        currentRole: state.currentRole,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore
    }
  };

  return {
    ...getInitialState(),

    addComment: (clauseId: string, content: string) => {
      const { currentRole } = get();
      set((state) => ({
        comments: [
          {
            id: uuidv4(),
            clauseId,
            authorRole: currentRole,
            content,
            status: 'unresolved',
            createdAt: Date.now(),
          },
          ...state.comments,
        ],
      }));
      saveToStorage();
    },

    resolveComment: (commentId: string) => {
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId ? { ...c, status: 'resolved' as const } : c
        ),
      }));
      saveToStorage();
    },

    deleteComment: (commentId: string) => {
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== commentId),
      }));
      saveToStorage();
    },

    setFilterType: (filter: FilterType) => {
      set({ filterType: filter });
    },

    setHighlightedClause: (clauseId: string | null) => {
      set({ highlightedClauseId: clauseId });
    },

    addRevision: (
      clauseId: string,
      beforeContent: string,
      afterContent: string
    ) => {
      set((state) => ({
        revisions: [
          {
            id: uuidv4(),
            clauseId,
            beforeContent,
            afterContent,
            status: 'pending',
            createdAt: Date.now(),
          },
          ...state.revisions,
        ],
      }));
      saveToStorage();
    },

    acceptRevision: (revisionId: string) => {
      set((state) => {
        const revision = state.revisions.find((r) => r.id === revisionId);
        if (!revision) return state;
        return {
          revisions: state.revisions.map((r) =>
            r.id === revisionId ? { ...r, status: 'accepted' as const } : r
          ),
          clauses: state.clauses.map((c) =>
            c.id === revision.clauseId
              ? { ...c, content: revision.afterContent, originalContent: revision.afterContent }
              : c
          ),
        };
      });
      saveToStorage();
    },

    rejectRevision: (revisionId: string) => {
      set((state) => ({
        revisions: state.revisions.map((r) =>
          r.id === revisionId ? { ...r, status: 'rejected' as const } : r
        ),
      }));
      saveToStorage();
    },

    setCurrentRole: (role: Role) => {
      set({ currentRole: role });
      saveToStorage();
    },

    saveSignature: (dataUrl: string, role: Role) => {
      const signature = {
        dataUrl,
        signedAt: Date.now(),
        signerRole: role,
      };
      set((state) => {
        const updates: Partial<ContractStore> = {};
        if (role === 'initiator') {
          updates.initiatorSignature = signature;
        } else {
          updates.receiverSignature = signature;
        }
        if (
          (role === 'initiator' && state.receiverSignature) ||
          (role === 'receiver' && state.initiatorSignature)
        ) {
          updates.status = 'signed';
          updates.showConfirmModal = true;
        }
        return updates;
      });
      saveToStorage();
    },

    setShowConfirmModal: (show: boolean) => {
      set({ showConfirmModal: show });
    },

    resetContract: () => {
      const newClauses = createInitialClauses();
      const newId = uuidv4();
      set({
        id: newId,
        clauses: newClauses,
        comments: [],
        revisions: [],
        initiatorSignature: null,
        receiverSignature: null,
        status: 'draft',
        showConfirmModal: false,
      });
      saveToStorage();
    },
  };
});
