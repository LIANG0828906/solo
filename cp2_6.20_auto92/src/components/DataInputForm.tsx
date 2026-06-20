import React, { useState, useRef, useCallback } from 'react';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { ReportData, submitReport } from '../api/reportApi';

const step1Schema = z.object({
  employee_id: z.string().min(1, '请输入员工编号'),
  employee_name: z.string().min(1, '请输入姓名'),
  department: z.string().min(1, '请输入部门'),
  age: z.coerce.number().min(16, '年龄至少16岁').max(100, '年龄最大100岁'),
  gender: z.enum(['男', '女'], { required_error: '请选择性别' }),
  height: z.coerce.number().min(100, '身高至少100cm').max(230, '身高最大230cm'),
  weight: z.coerce.number().min(30, '体重至少30kg').max(200, '体重最大200kg'),
});

const step2Schema = z.object({
  fasting_glucose: z.coerce.number().min(2, '数值过低').max(20, '数值过高'),
  total_cholesterol: z.coerce.number().min(2, '数值过低').max(15, '数值过高'),
  triglycerides: z.coerce.number().min(0.3, '数值过低').max(10, '数值过高'),
  hdl: z.coerce.number().min(0.3, '数值过低').max(3, '数值过高'),
  ldl: z.coerce.number().min(0.5, '数值过低').max(8, '数值过高'),
  systolic_bp: z.coerce.number().min(60, '数值过低').max(220, '数值过高'),
  diastolic_bp: z.coerce.number().min(30, '数值过低').max(140, '数值过高'),
});

const step3Schema = z.object({
  exercise_freq: z.coerce.number().min(0, '不能小于0').max(14, '最大14次'),
  sleep_hours: z.coerce.number().min(0, '不能小于0').max(24, '不能超过24小时'),
  smoking: z.boolean(),
  drinking: z.boolean(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type FormErrors = Record<string, string>;

const STEP_TITLES = ['基本信息', '血液指标', '生活习惯'];

const DataInputForm: React.FC = function DataInputForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [step1, setStep1] = useState<Step1Data>({
    employee_id: 'EMP' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
    employee_name: '',
    department: '',
    age: 30,
    gender: '男',
    height: 170,
    weight: 65,
  });

  const [step2, setStep2] = useState<Step2Data>({
    fasting_glucose: 5.2,
    total_cholesterol: 4.8,
    triglycerides: 1.2,
    hdl: 1.4,
    ldl: 2.8,
    systolic_bp: 120,
    diastolic_bp: 80,
  });

  const [step3, setStep3] = useState<Step3Data>({
    exercise_freq: 3,
    sleep_hours: 7.5,
    smoking: false,
    drinking: false,
  });

  const validateStep = useCallback((stepNum: number): FormErrors => {
    const schemaMap: Record<number, z.ZodSchema> = {
      1: step1Schema,
      2: step2Schema,
      3: step3Schema,
    };
    const dataMap: Record<number, unknown> = { 1: step1, 2: step2, 3: step3 };
    const result = schemaMap[stepNum].safeParse(dataMap[stepNum]);
    if (result.success) return {};
    const newErrors: FormErrors = {};
    result.error.issues.forEach((issue) => {
      const key = issue.path.join('.');
      newErrors[key] = issue.message;
    });
    return newErrors;
  }, [step1, step2, step3]);

  const handleNext = () => {
    const newErrors = validateStep(step);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    const newErrors = validateStep(3);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload: ReportData = {
        employee_id: step1.employee_id || uuidv4(),
        employee_name: step1.employee_name,
        department: step1.department,
        basic_info: {
          age: Number(step1.age),
          gender: step1.gender,
          height: Number(step1.height),
          weight: Number(step1.weight),
        },
        blood_metrics: {
          fasting_glucose: Number(step2.fasting_glucose),
          total_cholesterol: Number(step2.total_cholesterol),
          triglycerides: Number(step2.triglycerides),
          hdl: Number(step2.hdl),
          ldl: Number(step2.ldl),
          systolic_bp: Number(step2.systolic_bp),
          diastolic_bp: Number(step2.diastolic_bp),
        },
        lifestyle: {
          exercise_freq: Number(step3.exercise_freq),
          sleep_hours: Number(step3.sleep_hours),
          smoking: step3.smoking,
          drinking: step3.drinking,
        },
      };
      const result = await submitReport(payload);
      navigate(`/result/${result.report_id}`);
    } catch (e) {
      console.error(e);
      alert('提交失败，请检查后端服务是否运行');
    } finally {
      setSubmitting(false);
    }
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.employee_id) setStep1((s) => ({ ...s, employee_id: data.employee_id }));
        if (data.employee_name) setStep1((s) => ({ ...s, employee_name: data.employee_name }));
        if (data.department) setStep1((s) => ({ ...s, department: data.department }));
        if (data.basic_info) setStep1((s) => ({ ...s, ...data.basic_info }));
        if (data.blood_metrics) setStep2((s) => ({ ...s, ...data.blood_metrics }));
        if (data.lifestyle) setStep3((s) => ({ ...s, ...data.lifestyle }));
        alert('文件导入成功');
      } catch {
        alert('JSON格式错误');
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const renderInput = (name: string, label: string, value: string | number, onChange: (v: string) => void, type = 'text') => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={errors[name] ? 'error' : ''}
      />
      {errors[name] && <span className="error-text">{errors[name]}</span>}
    </div>
  );

  const renderSelect = (name: string, label: string, value: string, options: string[], onChange: (v: string) => void) => (
    <div className="form-group">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={errors[name] ? 'error' : ''}>
        <option value="">请选择</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors[name] && <span className="error-text">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="fade-in card">
      <div
        className={`upload-area ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-text">📄 点击或拖拽 JSON 文件上传体检数据</div>
        <div className="upload-hint">支持按模板格式的 JSON 文件，上传后自动填充表单</div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </div>

      <div className="step-indicator">
        {STEP_TITLES.map((title, i) => (
          <div key={i} className={`step-item ${step === i + 1 ? 'active' : step > i + 1 ? 'completed' : ''}`}>
            <span className="step-num">{i + 1}</span>
            <span>{title}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="fade-data">
          <h3 className="section-title">步骤 1：基本信息</h3>
          <div className="form-row">
            {renderInput('employee_id', '员工编号', step1.employee_id, (v) => setStep1({ ...step1, employee_id: v }))}
            {renderInput('employee_name', '姓名', step1.employee_name, (v) => setStep1({ ...step1, employee_name: v }))}
          </div>
          <div className="form-row">
            {renderInput('department', '部门', step1.department, (v) => setStep1({ ...step1, department: v }))}
            {renderSelect('gender', '性别', step1.gender, ['男', '女'], (v) => setStep1({ ...step1, gender: v as '男' | '女' }))}
          </div>
          <div className="form-row-3">
            {renderInput('age', '年龄', step1.age, (v) => setStep1({ ...step1, age: v as unknown as number }), 'number')}
            {renderInput('height', '身高 (cm)', step1.height, (v) => setStep1({ ...step1, height: v as unknown as number }), 'number')}
            {renderInput('weight', '体重 (kg)', step1.weight, (v) => setStep1({ ...step1, weight: v as unknown as number }), 'number')}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-data">
          <h3 className="section-title">步骤 2：血液与血压指标</h3>
          <div className="form-row">
            {renderInput('fasting_glucose', '空腹血糖 (mmol/L)', step2.fasting_glucose, (v) => setStep2({ ...step2, fasting_glucose: v as unknown as number }), 'number')}
            {renderInput('total_cholesterol', '总胆固醇 (mmol/L)', step2.total_cholesterol, (v) => setStep2({ ...step2, total_cholesterol: v as unknown as number }), 'number')}
          </div>
          <div className="form-row">
            {renderInput('triglycerides', '甘油三酯 (mmol/L)', step2.triglycerides, (v) => setStep2({ ...step2, triglycerides: v as unknown as number }), 'number')}
            {renderInput('hdl', '高密度脂蛋白 (mmol/L)', step2.hdl, (v) => setStep2({ ...step2, hdl: v as unknown as number }), 'number')}
          </div>
          <div className="form-row-3">
            {renderInput('ldl', '低密度脂蛋白 (mmol/L)', step2.ldl, (v) => setStep2({ ...step2, ldl: v as unknown as number }), 'number')}
            {renderInput('systolic_bp', '收缩压 (mmHg)', step2.systolic_bp, (v) => setStep2({ ...step2, systolic_bp: v as unknown as number }), 'number')}
            {renderInput('diastolic_bp', '舒张压 (mmHg)', step2.diastolic_bp, (v) => setStep2({ ...step2, diastolic_bp: v as unknown as number }), 'number')}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fade-data">
          <h3 className="section-title">步骤 3：生活习惯</h3>
          <div className="form-row">
            {renderInput('exercise_freq', '每周运动次数', step3.exercise_freq, (v) => setStep3({ ...step3, exercise_freq: v as unknown as number }), 'number')}
            {renderInput('sleep_hours', '每日睡眠时长 (小时)', step3.sleep_hours, (v) => setStep3({ ...step3, sleep_hours: v as unknown as number }), 'number')}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>吸烟状态</label>
              <div className="checkbox-row" style={{ padding: '10px 0' }}>
                <label style={{ margin: 0, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={step3.smoking}
                    onChange={(e) => setStep3({ ...step3, smoking: e.target.checked })}
                  />
                  &nbsp;是（吸烟者）
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>饮酒状态</label>
              <div className="checkbox-row" style={{ padding: '10px 0' }}>
                <label style={{ margin: 0, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={step3.drinking}
                    onChange={(e) => setStep3({ ...step3, drinking: e.target.checked })}
                  />
                  &nbsp;是（经常饮酒）
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="btn-group">
        {step > 1 && (
          <button className="secondary" onClick={handlePrev}>上一步</button>
        )}
        {step < 3 && (
          <button className="primary" onClick={handleNext}>下一步</button>
        )}
        {step === 3 && (
          <button className="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : '提交分析'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DataInputForm;
