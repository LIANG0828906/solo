import React, { useMemo } from 'react';
import { Button, Empty } from 'antd';
import { SwapOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useRecipeStore } from '../stores/recipeStore';
import type { Substitution } from '../utils/api';

interface SubstitutionPanelProps {
  ingredientId: string;
  ingredientName: string;
  ingredients: Array<{ id: string; name: string }>;
}

const SubstitutionPanel: React.FC<SubstitutionPanelProps> = React.memo(
  ({ ingredientId, ingredientName, ingredients }) => {
    const {
      currentSubstitutions,
      activeSubstitutions,
      applySubstitution,
      revertSubstitution,
      closeSubstitutionPanel,
    } = useRecipeStore();

    const activeSub = useMemo(() => {
      return activeSubstitutions.find(s => s.originalId === ingredientId);
    }, [activeSubstitutions, ingredientId]);

    const isSubstituted = !!activeSub;

    return (
      <div
        style={{
          width: 360,
          background: '#F0F2F5',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          transition: 'all 0.3s ease',
          animation: 'slideIn 0.3s ease',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>智能替代方案</div>
            <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>
              为 <span style={{ color: '#1890FF', fontWeight: 500 }}>{ingredientName}</span> 寻找替代
            </div>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={closeSubstitutionPanel}
            style={{ transition: 'all 0.2s ease' }}
          />
        </div>

        {isSubstituted && (
          <div
            style={{
              background: '#F6FFED',
              border: '1px solid #B7EB8F',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ color: '#52C41A', fontWeight: 500 }}>{activeSub!.substituteName}</span>
              <span style={{ color: '#999', marginLeft: 8 }}>已替换</span>
            </div>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => revertSubstitution(ingredientId)}
              style={{ transition: 'all 0.2s ease' }}
            >
              撤销
            </Button>
          </div>
        )}

        {currentSubstitutions.length === 0 ? (
          <Empty description="暂无替代方案" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentSubstitutions.map((sub: Substitution, idx: number) => {
              const isApplied = isSubstituted && activeSub?.substituteName === sub.substitute;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    padding: 14,
                    border: isApplied ? '2px solid #52C41A' : '1px solid #E8E8E8',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SwapOutlined style={{ color: isApplied ? '#52C41A' : '#1890FF' }} />
                      <span style={{ fontWeight: 600, fontSize: 15, color: isApplied ? '#52C41A' : '#333' }}>
                        {sub.substitute}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: sub.diffPercent.includes('-') ? '#F6FFED' : '#FFF7E6',
                        color: sub.diffPercent.includes('-') ? '#52C41A' : '#FA8C16',
                        fontWeight: 500,
                      }}
                    >
                      {sub.diffPercent}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#666', margin: '0 0 10px 0', lineHeight: 1.6 }}>
                    {sub.reason}
                  </p>
                  {isApplied ? (
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckOutlined />}
                      style={{ background: '#52C41A', borderColor: '#52C41A', transition: 'all 0.2s ease' }}
                    >
                      已应用
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() =>
                        applySubstitution(ingredientId, ingredientName, sub.substitute, sub.diffPercent)
                      }
                      style={{ transition: 'all 0.2s ease' }}
                    >
                      应用替代
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

SubstitutionPanel.displayName = 'SubstitutionPanel';

export default SubstitutionPanel;
