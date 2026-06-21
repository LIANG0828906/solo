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

function generateStrengthExplanation(item: string, matchResult: MatchResult, job: JobRequirement): string {
  if (item.includes('技能匹配') || item.includes('技能契合')) {
    const matched = matchResult.matchedSkills.slice(0, 4).join('、');
    return `您的简历中包含${job.title}岗位所需的核心技能（${matched}），与岗位要求高度契合。这些技能在实际项目中得到充分运用，能够帮助您快速进入工作状态并高效产出成果。`;
  }

  if (item.includes('项目经验') || item.includes('经验丰富')) {
    const expCount = matchResult.matchedSkills.length;
    return `您的工作经历和项目积累达到或超过${job.title}岗位的要求。凭借${expCount > 0 ? matchResult.matchedSkills[0] : '相关领域'}的实战经验，您能够独立承担核心模块的开发与优化工作，有效推动项目落地。`;
  }

  if (item.includes('学历') || item.includes('教育')) {
    return `您的学历背景满足${job.company || ''}${job.title}岗位的${job.educationLevel}学历要求，扎实的专业基础为技术能力的持续提升提供了有力支撑，有助于深入理解业务场景和技术原理。`;
  }

  if (item.includes('软技能') || item.includes('沟通') || item.includes('协作')) {
    return `您在沟通协作、团队配合等方面展现出良好的职业素养，这对于${job.title}岗位尤为重要。优秀的软技能将帮助您快速融入${job.industry}行业的团队环境，高效推动跨部门协作。`;
  }

  if (item.includes('行业') || item.includes('认知')) {
    return `您对${job.industry}行业有较为深入的理解，熟悉行业核心业务逻辑和技术趋势。这种行业认知使您能够更准确地把握${job.title}岗位的业务需求，提出更具针对性的解决方案。`;
  }

  if (item.includes('基础') || item.includes('胜任')) {
    return `您已具备${job.title}岗位所需的基础能力，通过进一步的项目实践和岗位培训，有望快速成长为团队的核心成员，在${job.industry}领域发挥更大价值。`;
  }

  return `这是您申请${job.title}岗位的核心优势之一。建议在面试中结合具体案例进行阐述，用数据和成果展示您的实际能力，让面试官更直观地感受到您的价值。`;
}

function generateWeaknessExplanation(item: string, matchResult: MatchResult, job: JobRequirement): string {
  if (item.includes('缺少') && item.includes('技能')) {
    const missing = matchResult.missingSkills.slice(0, 3).join('、');
    return `您的简历中未体现${missing}等${job.title}岗位核心技能。这些技能是${job.company || '该'}公司日常工作的重要工具，建议通过在线课程和实战项目系统学习，掌握核心概念并能独立完成项目后，匹配度将显著提升。`;
  }

  if (item.includes('项目经验') || item.includes('经验不足')) {
    return `您的工作年限和项目积累与${job.title}岗位的${job.experienceYears}年+经验要求存在差距。建议通过参与${job.industry}行业的实战项目、开源贡献或个人项目来补充经验，并在简历中突出项目成果和量化数据。`;
  }

  if (item.includes('学历') || item.includes('教育')) {
    return `您的学历层次低于${job.title}岗位的${job.educationLevel}要求。可通过获取专业认证（如${matchResult.missingSkills[0] || '相关领域'}认证）、在职进修或重点展示实际工作成果来弥补学历短板，提升综合竞争力。`;
  }

  if (item.includes('软技能') || item.includes('沟通') || item.includes('协作')) {
    return `您在沟通协作、团队领导等软技能方面有提升空间，这对${job.title}岗位的日常协作效率有较大影响。建议主动承担跨团队任务、多做汇报分享，锻炼表达和协调能力，培养项目推进中的软实力。`;
  }

  if (item.includes('行业') || item.includes('认知')) {
    return `您对${job.industry}行业的业务知识积累有限，可能影响对${job.title}岗位业务需求的理解深度。建议关注行业报告和资讯平台，参与行业社群交流，结合${job.title}的具体工作场景做针对性学习。`;
  }

  if (item.includes('无明显短板')) {
    return `综合评估您在各项维度上表现均衡，暂无突出短板。建议在保持现有水平的基础上，打造1-2项与${job.title}岗位强相关的核心优势技能，形成差异化竞争力，提高面试通过率。`;
  }

  return `这是您当前需要重点提升的方向，建议制定针对${job.title}岗位的学习计划，通过在线课程、项目实践、行业交流等方式系统提升，争取短期内取得明显进步。`;
}

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
                <div className="item-tooltip">{generateStrengthExplanation(s, matchResult, job)}</div>
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
                <div className="item-tooltip">{generateWeaknessExplanation(w, matchResult, job)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MatchDetail;
