import { Contract, ContractStatus } from '../types';
import { formatCurrency, formatNumber } from '../utils/revenueCalculator';

interface ContractListProps {
  contracts: Contract[];
  onSelectContract: (contractId: string) => void;
  onToggleStatus: (contractId: string) => void;
}

const statusConfig: Record<
  ContractStatus,
  { bg: string; label: string; shadow: string }
> = {
  settled: {
    bg: '#4CAF50',
    label: '已结算',
    shadow: '0 0 8px rgba(76, 175, 80, 0.4)',
  },
  pending: {
    bg: '#FF9800',
    label: '待结算',
    shadow: '0 0 8px rgba(255, 152, 0, 0.4)',
  },
};

function ContractCard({
  contract,
  onClick,
  onToggleStatus,
}: {
  contract: Contract;
  onClick: () => void;
  onToggleStatus: () => void;
}) {
  const status = statusConfig[contract.status];
  const totalPlayCount = contract.songs.reduce((sum, s) => sum + s.playCount, 0);

  return (
    <div
      onClick={onClick}
      style={{
        width: 320,
        minHeight: 220,
        borderRadius: 16,
        background: 'linear-gradient(145deg, #1E1E2E 0%, #2B2B3D 100%)',
        border: '1px solid #3A3A50',
        padding: 20,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        position: 'relative',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 12px 32px #6C63FF50, 0 4px 12px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <div
            style={{
              fontSize: 13,
              color: '#808098',
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            {contract.date}
          </div>
          <div
            style={{
              fontSize: 16,
              color: '#FFFFFF',
              fontWeight: 600,
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {contract.venue}
          </div>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus();
          }}
          title="点击切换状态"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: status.bg,
            boxShadow: status.shadow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.1,
            cursor: 'pointer',
          }}
        >
          {status.label.slice(0, 2)}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(108, 99, 255, 0.08)',
            borderRadius: 10,
            padding: '10px 12px',
            border: '1px solid rgba(108, 99, 255, 0.15)',
          }}
        >
          <div style={{ fontSize: 11, color: '#808098', marginBottom: 4 }}>
            演出费
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            {formatCurrency(contract.fee)}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'rgba(78, 205, 196, 0.08)',
            borderRadius: 10,
            padding: '10px 12px',
            border: '1px solid rgba(78, 205, 196, 0.15)',
          }}
        >
          <div style={{ fontSize: 11, color: '#808098', marginBottom: 4 }}>
            分成比例
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#4ECDC4',
            }}
          >
            {contract.splitRatio}%
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12, color: '#808098' }}>分成完成度</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: contract.status === 'settled' ? '#4CAF50' : '#FF9800',
            }}
          >
            {contract.status === 'settled' ? contract.splitRatio : 0}/
            {contract.splitRatio}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${
                contract.status === 'settled' ? contract.splitRatio : 0
              }%`,
              background:
                contract.status === 'settled'
                  ? 'linear-gradient(90deg, #4CAF50, #66BB6A)'
                  : 'linear-gradient(90deg, #FF9800, #FFB74D)',
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ fontSize: 12, color: '#808098' }}>
          曲目: {contract.songs.length} 首
        </div>
        <div style={{ fontSize: 12, color: '#808098' }}>
          播放: {formatNumber(totalPlayCount)}
        </div>
      </div>
    </div>
  );
}

function ContractList({
  contracts,
  onSelectContract,
  onToggleStatus,
}: ContractListProps) {
  const settledCount = contracts.filter((c) => c.status === 'settled').length;
  const pendingCount = contracts.filter((c) => c.status === 'pending').length;
  const totalFee = contracts.reduce((sum, c) => sum + c.fee, 0);
  const totalSongs = contracts.reduce((sum, c) => sum + c.songs.length, 0);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: 8,
          }}
        >
          巡演合同管理
        </h1>
        <p style={{ fontSize: 14, color: '#808098' }}>
          管理所有演出合同，查看每场演出的曲目分配与版税计算
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          {
            label: '合同总数',
            value: contracts.length.toString(),
            color: '#6C63FF',
            bg: 'rgba(108, 99, 255, 0.1)',
            border: '1px solid rgba(108, 99, 255, 0.2)',
          },
          {
            label: '已结算',
            value: settledCount.toString(),
            color: '#4CAF50',
            bg: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.2)',
          },
          {
            label: '待结算',
            value: pendingCount.toString(),
            color: '#FF9800',
            bg: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.2)',
          },
          {
            label: '曲目总数',
            value: totalSongs.toString(),
            color: '#4ECDC4',
            bg: 'rgba(78, 205, 196, 0.1)',
            border: '1px solid rgba(78, 205, 196, 0.2)',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              borderRadius: 12,
              padding: '16px 20px',
              background: stat.bg,
              border: stat.border,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#808098',
                marginBottom: 6,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
            {stat.label === '合同总数' && (
              <div style={{ fontSize: 12, color: '#808098', marginTop: 4 }}>
                总演出费: {formatCurrency(totalFee)}
              </div>
            )}
          </div>
        ))}
      </div>

      {contracts.length === 0 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '40vh',
            color: '#606078',
            fontSize: 16,
          }}
        >
          暂无合同数据
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 320px)',
            gap: 24,
            justifyContent: 'start',
          }}
        >
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onClick={() => onSelectContract(contract.id)}
              onToggleStatus={() => onToggleStatus(contract.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ContractList;
