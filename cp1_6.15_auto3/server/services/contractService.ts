import contractModel, {
  Comment,
  HistoryRecord,
  ApprovalStatus,
} from '../models/contractModel';

export interface ContractData {
  contractId: string;
  oldContent: string;
  newContent: string;
  comments: Comment[];
  approvalStatus: ApprovalStatus;
  history: HistoryRecord[];
}

export interface DiffStatistics {
  added: number;
  removed: number;
  unchanged: number;
}

export interface DiffChange {
  type: 'equal' | 'added' | 'removed';
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface DiffResult {
  changes: DiffChange[];
  statistics: DiffStatistics;
}

class ContractService {
  getContractData(): ContractData {
    const contract = contractModel.getContract();
    return {
      contractId: contract.contractId,
      oldContent: contract.oldContent,
      newContent: contract.newContent,
      comments: contractModel.getComments(),
      approvalStatus: contractModel.getApprovalStatus(),
      history: contractModel.getHistory(),
    };
  }

  addComment(
    lineIndex: number,
    content: string,
    author: string,
    parentId?: string
  ): Comment {
    if (!content || !content.trim()) {
      throw new Error('批注内容不能为空');
    }
    if (!author || !author.trim()) {
      throw new Error('作者信息不能为空');
    }

    const trimmedContent = content.trim();
    const trimmedAuthor = author.trim();

    const comment = contractModel.addComment({
      lineIndex,
      content: trimmedContent,
      author: trimmedAuthor,
      parentId,
    });

    const isReply = !!parentId;
    contractModel.addHistory({
      type: 'comment',
      description: isReply
        ? `回复了批注：${trimmedContent.substring(0, 30)}${trimmedContent.length > 30 ? '...' : ''}`
        : `添加了批注：${trimmedContent.substring(0, 30)}${trimmedContent.length > 30 ? '...' : ''}`,
      user: trimmedAuthor,
    });

    return comment;
  }

  handleApprovalAction(
    action: 'approve' | 'reject' | undefined,
    user: string,
    oldContent?: string,
    newContent?: string
  ): { status: ApprovalStatus; history: HistoryRecord[] } {
    if (!user || !user.trim()) {
      throw new Error('用户信息不能为空');
    }

    const trimmedUser = user.trim();

    if (oldContent !== undefined || newContent !== undefined) {
      contractModel.updateContent(oldContent, newContent);
      contractModel.addHistory({
        type: 'version',
        description: '上传了新的合同版本并进行对比',
        user: trimmedUser,
      });
      contractModel.setApprovalStatus('reviewing');
    } else if (action) {
      let newStatus: ApprovalStatus;
      let description: string;
      let historyType: 'approve' | 'reject';

      switch (action) {
        case 'approve':
          newStatus = 'approved';
          description = '审批通过了该合同';
          historyType = 'approve';
          break;
        case 'reject':
          newStatus = 'rejected';
          description = '驳回了该合同';
          historyType = 'reject';
          break;
        default:
          throw new Error('无效的审批操作');
      }

      contractModel.setApprovalStatus(newStatus);
      contractModel.addHistory({
        type: historyType,
        description,
        user: trimmedUser,
      });
    } else {
      throw new Error('必须提供审批操作或版本内容');
    }

    return {
      status: contractModel.getApprovalStatus(),
      history: contractModel.getHistory(),
    };
  }

  computeDiff(oldText: string, newText: string): DiffResult {
    if (!oldText && !newText) {
      return { changes: [], statistics: { added: 0, removed: 0, unchanged: 0 } };
    }

    const oldLines = (oldText || '').split('\n');
    const newLines = (newText || '').split('\n');

    const dp: number[][] = [];
    const m = oldLines.length;
    const n = newLines.length;

    for (let i = 0; i <= m; i++) {
      dp[i] = [];
      for (let j = 0; j <= n; j++) {
        if (i === 0 || j === 0) {
          dp[i][j] = 0;
        } else if (oldLines[i - 1] === newLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const changes: DiffChange[] = [];
    let i = m;
    let j = n;
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        changes.unshift({
          type: 'equal',
          content: oldLines[i - 1],
          oldLineNumber: i,
          newLineNumber: j,
        });
        unchanged++;
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        changes.unshift({
          type: 'added',
          content: newLines[j - 1],
          oldLineNumber: null,
          newLineNumber: j,
        });
        added++;
        j--;
      } else {
        changes.unshift({
          type: 'removed',
          content: oldLines[i - 1],
          oldLineNumber: i,
          newLineNumber: null,
        });
        removed++;
        i--;
      }
    }

    return {
      changes,
      statistics: { added, removed, unchanged },
    };
  }
}

export default new ContractService();
