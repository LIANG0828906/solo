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

function buildStrengthTooltip(item: string, match: MatchResult, job: JobRequirement): string {
  const matchedList = match.matchedSkills.slice(0, 4).join('、');
  const totalMatched = match.matchedSkills.length;
  const requiredTotal = job.requiredSkills.length;
  const coveragePct = requiredTotal > 0 ? Math.round((totalMatched / requiredTotal) * 100) : 0;

  if (/技能匹配|技能契合|具备.*技能/.test(item)) {
    const top = matchedList || '多项核心技能';
    return `优势：在${job.title}岗位的${requiredTotal}项必备技能中，您的简历已覆盖${totalMatched}项（覆盖率${coveragePct}%），包括${top}。这些技能与${job.company || '该公司'}的技术栈高度对齐，入职后可快速投入项目开发。`;
  }

  if (/项目经验|经验丰富|经验充足/.test(item)) {
    const expDim = match.radarData.find(r => r.dimension === '项目经验');
    const score = expDim?.score ?? 0;
    return `优势：项目经验维度得分${score}分，达到${job.title}岗位${job.experienceYears}年+的招聘门槛。您在过往多份工作中积累了扎实的实战经验，可独立承担${job.industry}行业的核心业务开发任务。`;
  }

  if (/学历|教育|院校/.test(item)) {
    const eduDim = match.radarData.find(r => r.dimension === '教育背景');
    const score = eduDim?.score ?? 0;
    return `优势：教育背景维度得分${score}分，学历满足${job.title}岗位「${job.educationLevel}以上」的要求。扎实的专业基础为您在${job.industry}行业的技术深化提供了有力支撑，学习能力也得到了学历背书。`;
  }

  if (/软技能|沟通|协作|团队|合作|领导力|领导/.test(item)) {
    const softDim = match.radarData.find(r => r.dimension === '软技能');
    const score = softDim?.score ?? 0;
    return `优势：软技能维度得分${score}分，在沟通协作、团队配合方面表现突出。对于${job.title}岗位而言，优秀的软技能有助于您与${job.company ? job.company + '的' : ''}产品、设计、测试团队高效协作，推动项目顺利落地。`;
  }

  if (/行业|认知|业务|领域/.test(item)) {
    const indDim = match.radarData.find(r => r.dimension === '行业知识');
    const score = indDim?.score ?? 0;
    return `优势：行业知识维度得分${score}分，对${job.industry}行业有较为深入的理解。熟悉行业业务模式和关键技术，能更准确地把握${job.title}岗位的业务需求，减少沟通成本，快速产出符合业务预期的方案。`;
  }

  if (/基础|胜任|潜力|适配/.test(item)) {
    return `综合评估：您已具备${job.title}岗位所需的基础能力，整体匹配度${match.overallScore}%。虽然在某些细分领域仍有提升空间，但通过${job.company || '企业'}的岗位培训和项目实践，预计可在较短时间内成长为合格的团队成员。`;
  }

  if (totalMatched > 0) {
    return `该项优势具体体现：您在${item}方面表现突出，已具备${totalMatched}项${job.title}相关核心技能（如${matchedList}），整体匹配度达${match.overallScore}%，建议面试时结合具体项目案例详细阐述。`;
  }

  return `${item}是您申请${job.title}岗位的核心加分项，整体匹配度${match.overallScore}%。建议在面试环节结合实际项目案例和量化数据进行展示，增强说服力。`;
}

function buildWeaknessTooltip(item: string, match: MatchResult, job: JobRequirement): string {
  const missingList = match.missingSkills.slice(0, 3).join('、');
  const missingCount = match.missingSkills.length;
  const requiredTotal = job.requiredSkills.length;

  if (/缺少|缺失|不足.*技能|未掌握.*技能/.test(item)) {
    const ms = missingList || `${job.requiredSkills.slice(0, 3).join('、')}等`;
    return `待提升：${job.title}岗位共要求${requiredTotal}项必备技能，您的简历中缺少${missingCount}项关键技能（${ms}）。这些是${job.company || '该公司'}日常工作的常用工具，建议通过MOOC课程+实战项目系统学习，预计2-3个月可获得明显提升。`;
  }

  if (/项目经验.*不足|经验.*欠缺|年限.*不够/.test(item)) {
    const expDim = match.radarData.find(r => r.dimension === '项目经验');
    const score = expDim?.score ?? 0;
    return `待提升：项目经验维度得分${score}分，与${job.title}岗位${job.experienceYears}年+的招聘要求存在差距。建议：1）参与${job.industry}行业的开源项目贡献；2）通过个人博客或GitHub展示完整项目案例；3）简历中突出项目成果与量化指标。`;
  }

  if (/学历|教育.*待|院校.*不足/.test(item)) {
    const eduDim = match.radarData.find(r => r.dimension === '教育背景');
    const score = eduDim?.score ?? 0;
    return `待提升：教育背景维度得分${score}分，低于${job.title}岗位的「${job.educationLevel}」期望。弥补建议：考取相关领域专业认证（如${job.requiredSkills[0] || '对应领域'}的官方认证）、或通过在职研究生深造、并在简历中突出实际工作成果与项目经验。`;
  }

  if (/软技能|沟通|协作|领导力.*加强|.*需.*提升.*能力/.test(item)) {
    const softDim = match.radarData.find(r => r.dimension === '软技能');
    const score = softDim?.score ?? 0;
    return `待提升：软技能维度得分${score}分，${job.title}岗位通常需要频繁与跨部门团队协作。建议：在工作中主动承担跨团队项目、定期进行技术分享与方案汇报、阅读《非暴力沟通》等书籍，预计1-2个月可见明显改善。`;
  }

  if (/行业|认知.*待|业务.*积累|行业知识/.test(item)) {
    const indDim = match.radarData.find(r => r.dimension === '行业知识');
    const score = indDim?.score ?? 0;
    return `待提升：行业知识维度得分${score}分，对${job.industry}行业的业务知识积累有限。建议：关注36氪、虎嗅等行业媒体，阅读行业深度报告；加入相关社群与从业者交流；在简历中补充行业相关项目经历，提升匹配度。`;
  }

  if (/无明显短板|无.*短板|暂无.*短板/.test(item)) {
    return `综合评估：您的五项维度表现均衡，暂无突出短板，整体匹配度${match.overallScore}%。建议打造1-2项差异化核心优势，例如深入钻研${job.requiredSkills[0] || '岗位核心技术'}，形成您的个人技术标签，大幅提高面试通过率。`;
  }

  if (missingCount > 0) {
    return `该项具体说明：${item}。您当前在${job.title}岗位的${requiredTotal}项必备技能中尚有${missingCount}项未体现（${missingList}），建议优先补齐这些核心缺口，预计匹配度可提升至${Math.min(100, match.overallScore + missingCount * 5)}%以上。`;
  }

  return `${item}是您当前需要重点突破的方向。针对${job.title}岗位的特性，建议制定3个月专项提升计划，每周投入8-10小时系统学习+实战练习，结合${job.industry}行业特点做针对性准备。`;
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
                <div className="item-tooltip">{buildStrengthTooltip(s, matchResult, job)}</div>
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
                <div className="item-tooltip">{buildWeaknessTooltip(w, matchResult, job)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MatchDetail;
