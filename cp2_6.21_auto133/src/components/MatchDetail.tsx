import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { MatchResult, JobRequirement } from '../types';

interface MatchDetailProps {
  matchResult: MatchResult;
  job: JobRequirement;
}

const generateExplanation = (item: string, type: 'strength' | 'weakness'): string => {
  const explanations: Record<string, { strength: string; weakness: string }> = {
    技能匹配: {
      strength: '您的简历中明确包含相关技能，与岗位要求完美契合。根据简历描述，您有丰富的实际项目经验，能够快速上手工作并产出高质量成果。',
      weakness: '您的简历中缺少部分核心技能。建议通过在线课程、实战项目进行系统学习，补充相关技术栈经验，以提升岗位适配度。',
    },
    项目经验丰富: {
      strength: '您的工作经历累计超过岗位要求，参与过多个完整项目周期，具备独立负责模块或带领团队的能力，对业务流程有深入理解。',
      weakness: '您的项目经验相对不足，建议积极参与更多实战项目，积累完整项目周期经验，重点提升复杂问题解决能力。',
    },
    项目经验不足: {
      strength: '',
      weakness: '您的从业年限和项目数量未达到岗位期望。建议通过参与开源项目、实习或个人项目积累经验，并在简历中突出项目成果细节。',
    },
    学历背景优秀: {
      strength: '您的学历背景达到或超过岗位要求，毕业于知名院校，专业与岗位高度相关，具备扎实的理论基础和学习能力。',
      weakness: '您的学历与岗位要求存在差距。可通过获取专业认证、持续进修、或展示优秀项目成果来弥补学历方面的不足。',
    },
    学历待提升: {
      strength: '',
      weakness: '您的学历层次低于岗位期望。建议考虑在职深造、专业技能认证，或重点突出实际工作能力与项目成果来增强竞争力。',
    },
    软技能突出: {
      strength: '您在沟通协作、团队配合、问题解决等方面表现优秀，具备良好的职业素养。这些能力有助于您快速融入团队，推动项目顺利开展。',
      weakness: '您在软技能方面有提升空间。建议主动参与团队协作、汇报演讲等场景锻炼，提升沟通表达与跨部门协作能力。',
    },
    软技能需加强: {
      strength: '',
      weakness: '您的沟通、协作、领导等软技能有待提升。建议在工作中主动承担跨团队任务，多做汇报分享，锻炼表达和协调能力。',
    },
    行业认知深入: {
      strength: '您对目标行业有深刻的理解和认知，熟悉行业发展趋势、业务模式和关键技术，能够快速把握业务需求并提出有效解决方案。',
      weakness: '您对目标行业的了解有待加深。建议多关注行业资讯、研究竞品产品、参与行业社群交流，逐步建立行业认知体系。',
    },
    行业认知待积累: {
      strength: '',
      weakness: '您对该行业的业务知识积累有限。建议通过行业报告、资讯平台、线下活动等方式加深了解，结合岗位特点做针对性学习。',
    },
    具备基础岗位胜任能力: {
      strength: '您已具备岗位所需的基础能力，具备较大的发展潜力。通过岗位培训和项目实践，能够快速成长为合格的团队成员。',
      weakness: '',
    },
    无明显短板: {
      strength: '',
      weakness: '综合评估您在各项维度上表现均衡，暂无明显短板。建议在保持现有水平的基础上，打造1-2项核心优势技能，形成差异化竞争力。',
    },
  };

  for (const key in explanations) {
    if (item.includes(key)) {
      const text = explanations[key][type];
      if (text) return text;
    }
  }

  if (item.includes('技能')) {
    if (type === 'strength') {
      return `您的简历中明确包含${item.replace('技能匹配', '')}技能，与岗位要求完美契合。根据简历描述，您有相关项目开发经验，这些技能将帮助您高效完成工作任务。`;
    }
    return `${item}。建议通过系统学习和实战项目补充这些技能，掌握核心概念并能独立完成项目，这将显著提升您的匹配度和竞争力。`;
  }

  if (type === 'strength') {
    return `这是您申请该岗位的核心优势之一。建议在面试中结合具体案例进行阐述，用数据和成果展示您的实际能力，让面试官更直观地感受到您的价值。`;
  }
  return `这是您当前需要重点提升的方向。建议制定针对性的学习计划，通过在线课程、项目实践、行业交流等方式系统提升，争取短期内取得明显进步。`;
};

const MatchDetail: React.FC<MatchDetailProps> = ({ matchResult, job }) => {
  const { strengths, weaknesses, overallScore, radarData } = matchResult;

  return (
    <div className="match-detail-card stagger-item stagger-visible">
      <div className="match-detail-header">
        <h3 className="match-detail-title">{job.title} · 详细匹配分析</h3>
        <div className="match-overall-score">{overallScore}%</div>
      </div>

      <div className="radar-container">
        <div className="radar-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#e0e0e0" strokeWidth={1} />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: '#e0e0e0', fontSize: 13, fontWeight: 500 }}
                stroke="#e0e0e0"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#a0a0b8', fontSize: 11 }}
                stroke="#e0e0e0"
                tickCount={6}
              />
              <Radar
                name="匹配度"
                dataKey="score"
                stroke="#2196f3"
                strokeWidth={2}
                fill="rgba(33,150,243,0.3)"
                fillOpacity={1}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #7c4dff',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  color: '#e0e0e0',
                  fontSize: '13px',
                }}
                formatter={(value: number) => [`${value}分`, '得分']}
                labelFormatter={(label: string) => `维度：${label}`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="match-lists">
        <div className="match-list-section">
          <h4 className="strengths-title">
            <FaCheck style={{ color: '#4caf50' }} />
            优势项
          </h4>
          <ul className="match-list">
            {strengths.map((s, idx) => (
              <li key={idx} className="match-list-item">
                <FaCheck className="icon icon-check" />
                <span>{s}</span>
                <div className="item-tooltip">{generateExplanation(s, 'strength')}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="match-list-section">
          <h4 className="weaknesses-title">
            <FaTimes style={{ color: '#f44336' }} />
            待提升项
          </h4>
          <ul className="match-list">
            {weaknesses.map((w, idx) => (
              <li key={idx} className="match-list-item">
                <FaTimes className="icon icon-times" />
                <span>{w}</span>
                <div className="item-tooltip">{generateExplanation(w, 'weakness')}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MatchDetail;
