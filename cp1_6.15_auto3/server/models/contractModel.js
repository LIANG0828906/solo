const { v4: uuidv4 } = require('uuid');

class ContractModel {
  constructor() {
    this.contract = {
      contractId: 'contract-001',
      oldContent: `甲方（委托方）：____________________
乙方（服务方）：____________________

第一条 服务内容
1.1 乙方同意按照本合同约定向甲方提供技术咨询服务。
1.2 服务范围包括但不限于：系统架构设计、代码审查、性能优化。
1.3 服务期限为自合同生效之日起12个月。

第二条 费用与支付
2.1 本合同总金额为人民币500,000元整。
2.2 甲方应在合同签署后15个工作日内支付30%预付款。
2.3 剩余款项在服务完成并验收合格后一次性支付。

第三条 保密义务
3.1 双方对在合作过程中知悉的对方商业秘密负有保密义务。
3.2 保密期限为合同终止后5年。

第四条 违约责任
4.1 任何一方违反本合同约定，应承担相应的违约责任。
4.2 违约金不超过合同总金额的20%。

第五条 争议解决
5.1 因本合同引起的争议，双方应友好协商解决。
5.2 协商不成的，提交甲方所在地人民法院诉讼解决。`,
      newContent: `甲方（委托方）：____________________
乙方（服务方）：____________________

第一条 服务内容
1.1 乙方同意按照本合同约定向甲方提供专业技术咨询服务。
1.2 服务范围包括但不限于：系统架构设计、代码审查、性能优化、安全审计。
1.3 服务期限为自合同生效之日起24个月。
1.4 乙方应每月提交书面服务报告。

第二条 费用与支付
2.1 本合同总金额为人民币800,000元整。
2.2 甲方应在合同签署后10个工作日内支付40%预付款。
2.3 剩余款项分三期支付，每完成一个里程碑支付一次。

第三条 知识产权
3.1 乙方在服务过程中产生的知识产权归甲方所有。
3.2 乙方保留使用通用技术知识的权利。

第四条 保密义务
4.1 双方对在合作过程中知悉的对方商业秘密负有保密义务。
4.2 保密期限为合同终止后10年。

第五条 违约责任
5.1 任何一方违反本合同约定，应承担相应的违约责任。
5.2 违约金不超过合同总金额的30%。
5.3 因违约造成损失的，还应赔偿实际损失。

第六条 争议解决
6.1 因本合同引起的争议，双方应友好协商解决。
6.2 协商不成的，提交北京仲裁委员会仲裁解决。`,
      comments: [],
      approvalStatus: 'pending',
      history: [
        {
          id: uuidv4(),
          type: 'version',
          description: '创建初始合同版本',
          user: '系统',
          timestamp: Date.now() - 86400000,
        },
      ],
    };
  }

  getContract() {
    return this.contract;
  }

  updateContent(oldContent, newContent) {
    if (oldContent !== undefined) {
      this.contract.oldContent = oldContent;
    }
    if (newContent !== undefined) {
      this.contract.newContent = newContent;
    }
  }

  addComment(comment) {
    const newComment = {
      id: uuidv4(),
      lineIndex: comment.lineIndex,
      content: comment.content,
      author: comment.author,
      timestamp: Date.now(),
      replies: [],
    };

    if (comment.replyToId) {
      const addReply = (comments) => {
        for (let i = 0; i < comments.length; i++) {
          if (comments[i].id === comment.replyToId) {
            if (!comments[i].replies) {
              comments[i].replies = [];
            }
            comments[i].replies.push(newComment);
            return newComment;
          }
          if (comments[i].replies && comments[i].replies.length > 0) {
            const result = addReply(comments[i].replies);
            if (result) return result;
          }
        }
        return null;
      };
      return addReply(this.contract.comments) || newComment;
    } else {
      this.contract.comments.push(newComment);
    }
    return newComment;
  }

  getComments() {
    return this.contract.comments;
  }

  getApprovalStatus() {
    return this.contract.approvalStatus;
  }

  setApprovalStatus(status) {
    this.contract.approvalStatus = status;
    return this.contract.approvalStatus;
  }

  getHistory() {
    return [...this.contract.history].sort((a, b) => b.timestamp - a.timestamp);
  }

  addHistory(record) {
    const newRecord = {
      id: uuidv4(),
      ...record,
      timestamp: Date.now(),
    };
    this.contract.history.unshift(newRecord);
    return this.getHistory();
  }
}

module.exports = new ContractModel();
