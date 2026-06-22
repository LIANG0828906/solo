import { useState, useEffect } from 'react';
import { Plus, Ticket, Calendar, MapPin, Users, Clock, QrCode } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Activity, Participant, CreateActivityRequest, RegisterRequest } from '@/types';
import { useActivities } from '@/hooks/useActivities';
import { ActivityCard } from '@/components/ActivityCard';
import { ActivityForm } from '@/components/ActivityForm';
import { RegistrationForm } from '@/components/RegistrationForm';
import { ParticipantList } from '@/components/ParticipantList';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { formatDate, isRegistrationOpen, getActivityStatus } from '@/utils/dateFormat';
import type { ToastContextType } from '@/hooks/useToast';
interface ActivityModuleProps {
 toast: ToastContextType;
 mode: 'list' | 'detail';
}
export const ActivityModule: React.FC<ActivityModuleProps> = ({ toast, mode }) => {
 const navigate = useNavigate();
 const { id } = useParams<{
 id: string;
 }>();
 const { activities, loading, error, fetchActivities, fetchActivity, createActivity, registerActivity, checkIn, fetchParticipants } = useActivities();
 const [showCreateForm, setShowCreateForm] = useState(false);
 const [showRegisterForm, setShowRegisterForm] = useState(false);
 const [activity, setActivity] = useState<Activity | null>(null);
 const [participants, setParticipants] = useState<Participant[]>([]);
 const [registeredParticipant, setRegisteredParticipant] = useState<Participant | null>(null);
 const [currentUser, setCurrentUser] = useState<string>(localStorage.getItem('readingClub_userName') || '');
 const [initialInviteCode, setInitialInviteCode] = useState('');
 useEffect(() => {
 if (mode === 'list') {
 fetchActivities();
 }
 else if (mode === 'detail' && id) {
 loadActivityDetail(id);
 }
 }, [mode, id, fetchActivities, fetchActivity]);
 const loadActivityDetail = async (activityId: string) => {
 const data = await fetchActivity(activityId);
 if (data) {
 setActivity(data);
 const participantData = await fetchParticipants(activityId);
 setParticipants(participantData);
 }
 };
 const handleCreateActivity = async (data: CreateActivityRequest) => {
 const result = await createActivity(data);
 if (result) {
 toast.showSuccess(`活动创建成功！邀请码：${result.inviteCode}`);
 setShowCreateForm(false);
 }
 else if (error) {
 toast.showError(error);
 }
 };
 const handleRegister = async (data: RegisterRequest) => {
 const result = await registerActivity(data);
 if (result) {
 setRegisteredParticipant(result);
 setCurrentUser(data.name);
 localStorage.setItem('readingClub_userName', data.name);
 toast.showSuccess('报名成功！请保存好您的签到二维码');
 setShowRegisterForm(false);
 }
 else if (error) {
 toast.showError(error);
 }
 };
 const handleCheckIn = async (participantId: string) => {
 if (!id)
 return;
 toast.showNotification('正在核验签到...');
 checkIn(id, participantId).then(result => {
 if (result) {
 toast.showSuccess(`${result.name} 签到成功！`);
 loadActivityDetail(id);
 }
 else if (error) {
 toast.showError(error);
 }
 });
 };
 const openRegisterWithCode = (inviteCode: string) => {
 setInitialInviteCode(inviteCode);
 setShowRegisterForm(true);
 };
 const simulateScan = () => {
 if (!activity && participants.length > 0) {
 const unregistered = participants.find(p => p.checkInStatus === 'registered');
 if (unregistered) {
 handleCheckIn(unregistered.id);
 }
 else {
 toast.showWarning('所有参与者已完成签到');
 }
 }
 };
 const openCommunity = () => {
 if (activity) {
 navigate(`/community/${activity.id}`);
 }
 };
 if (loading && mode === 'list') {
 return (<div className="loading-container">
 <div className="loading-spinner"/>
 </div>);
 }
 if (mode === 'list') {
 return (<div>
 <div className="action-bar">
 <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
 <Plus size={18}/>
 创建活动
 </button>
 <button className="btn btn-secondary" onClick={() => setShowRegisterForm(true)}>
 <Ticket size={18}/>
 输入邀请码报名
 </button>
 <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
 数据统计
 </button>
 </div>

 {error && (<div style={{
 padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#DC2626, borderRadius: 8, marginBottom: 24 }}>
 {error}
 </div>)}

 {activities.length === 0 ? (<div className="empty-state">
 <div className="empty-state-icon">📚</div>
 <h3 className="empty-state-title">暂无活动</h3>
 <p className="empty-state-text">点击上方按钮创建您的第一个阅读活动</p>
 </div>) : (<div className="cards-grid">
 {activities.map(act => (<ActivityCard key={act.id} activity={act}/>))}
 </div>)}

 {showCreateForm && (<ActivityForm onSubmit={handleCreateActivity} onClose={() => setShowCreateForm(false)} loading={loading}/>)}

 {showRegisterForm && (<RegistrationForm onSubmit={handleRegister} onClose={() => setShowRegisterForm(false)} loading={loading} initialInviteCode={initialInviteCode}/>)}

 {registeredParticipant && (<div className="modal-overlay" onClick={() => setRegisteredParticipant(null)}>
 <div className="modal" onClick={e => e.stopPropagation()}>
 <div className="modal-header">
 <h2 className="modal-title">报名成功</h2>
 <QRCodeDisplay data={registeredParticipant.qrCode} label={`${registeredParticipant.name}，请在活动当天出示此二维码签到`}/>
 <div style={{ textAlign: 'center', marginTop: 16 }}>
 <button className="btn btn-primary" onClick={() => setRegisteredParticipant(null)}>
 完成
 </button>
 </div>
 </div>
 </div>)}
 </div>);
 }
 if (mode === 'detail') {
 if (loading && !activity) {
 return (<div className="loading-container">
 <div className="loading-spinner"/>
 </div>);
 }
 if (!activity) {
 return (<div className="empty-state">
 <div className="empty-state-icon">❓</div>
 <h3 className="empty-state-title">活动不存在</h3>
 <p className="empty-state-text">请返回首页查看其他活动</p>
 <button className="btn btn-primary" onClick={() => navigate('/')}>
 返回首页
 </button>
 </div>);
 }
 const status = getActivityStatus(activity.date);
 const statusText = {
 upcoming: '即将开始',
 ongoing: '进行中',
 ended: '已结束',
 }[status];
 const statusClass = `status-${status}`;
 return (<div>
 <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
 ← 返回活动列表
 </button>

 <div className="activity-detail">
 <div className="activity-info">
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
 <div className={`activity-card-status-bar ${statusClass}`} style={{ width: 6, height: 40, borderRadius: 3 }}/>
 <div>
 <span className={`tag tag-${status === 'upcoming' ? 'registered' : status === 'ongoing' ? 'checked' : ''}`} style={{ marginBottom: 8 }}>
 {statusText}
 </span>
 <h1 className="activity-detail-title">{activity.name}</h1>
 </div>
 </div>

 <div className="activity-detail-meta">
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <Calendar size={18} />
 <span>{formatDate(activity.date)}</span>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <MapPin size={18} />
 <span>{activity.location}</span>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <Users size={18} />
 <span>{participants.length} / {activity.quota} 人已报名</span>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <Clock size={18} />
 <span>
 报名截止：{formatDate(activity.registrationDeadline)}
 {isRegistrationOpen(activity.registrationDeadline) ? ' (报名中)' : ' (已截止)'}
 </span>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <Ticket size={18} />
 <span>邀请码：<code style={{
 fontFamily: 'monospace', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#7C3AED', padding: '2px 8px', borderRadius: 4 }}>{activity.inviteCode}</code>
 </span>
 </div>
 </div>

 <p className="activity-detail-description">{activity.description}</p>
 </div>

 <div className="activity-side">
 {status !== 'ended' && (<div className="qrcode-container" style={{ backgroundColor: 'var(--color-card-bg)' }}>
 <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: 16 }}>签到管理</h3>
 <button className="btn btn-primary" onClick={simulateScan}>
 <QrCode size={18} />
 模拟扫码签到
 </button>
 {status === 'upcoming' && isRegistrationOpen(activity.registrationDeadline) && (<button className="btn btn-secondary" onClick={() => openRegisterWithCode(activity.inviteCode)}>
 <Ticket size={18} />
 我要报名
 </button>)}
 </div>)}

 {status === 'ended' && (<div style={{ padding: 24, backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: 16, textAlign: 'center' }}>
 <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
 <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: 8 }}>活动讨论区</h3>
 <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16, fontSize: 14 }}>
 活动已结束，前往讨论区分享您的感悟
 </p>
 <button className="btn btn-primary" onClick={openCommunity}>
 进入讨论区
 </button>
 </div>)}
 </div>
 </div>

 <div style={{
 marginTop: 32 }}>
 <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 24, marginBottom: 16 }}>
 参与者列表
 </h2>
 <ParticipantList participants={participants} onCheckIn={handleCheckIn} showActions={status === 'ongoing'}/>
 </div>

 {showRegisterForm && (<RegistrationForm onSubmit={handleRegister} onClose={() => setShowRegisterForm(false)} loading={loading} initialInviteCode={initialInviteCode}/>)}

 {registeredParticipant && (<div className="modal-overlay" onClick={() => setRegisteredParticipant(null)}>
 <div className="modal" onClick={e => e.stopPropagation()}>
 <div className="modal-header">
 <h2 className="modal-title">报名成功</h2>
 <QRCodeDisplay data={registeredParticipant.qrCode} label={`${registeredParticipant.name}，请在活动当天出示此二维码签到`}/>
 <div style={{ textAlign: 'center', marginTop: 16 }}>
 <button className="btn btn-primary" onClick={() => setRegisteredParticipant(null)}>
 完成
 </button>
 </div>
 </div>
 </div>)}
 </div>);
 }
 return null;
};
