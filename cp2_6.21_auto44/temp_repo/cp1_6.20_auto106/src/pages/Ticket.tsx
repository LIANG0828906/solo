import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Ticket as TicketComponent } from '../components/Ticket';
import { RegisterResponse } from '../types';

interface LocationState {
  ticketData: RegisterResponse;
  eventDate: string;
  eventLocation: string;
}

export function Ticket() {
  const { eventId, registrationId } = useParams<{ eventId: string; registrationId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  const [ticketData, setTicketData] = useState<RegisterResponse | null>(state?.ticketData || null);
  const [eventDate, setEventDate] = useState<string>(state?.eventDate || '');
  const [eventLocation, setEventLocation] = useState<string>(state?.eventLocation || '');
  const [eventName, setEventName] = useState<string>('');
  const [loading, setLoading] = useState(!state?.ticketData);

  useEffect(() => {
    if (state?.ticketData) return;

    const fetchTicketData = async () => {
      try {
        const [regResponse, eventResponse] = await Promise.all([
          fetch(`/api/events/${eventId}/registrations/${registrationId}`),
          fetch(`/api/events/${eventId}`)
        ]);

        const regData = await regResponse.json();
        const eventData = await eventResponse.json();

        if (regResponse.ok && eventResponse.ok) {
          const qrResponse = await fetch(`/api/events/${eventId}/qrcode/${registrationId}`);
          const qrData = await qrResponse.json();

          setTicketData({
            registrationId: registrationId!,
            eventId: eventId!,
            qrcodeUrl: qrData.qrcodeUrl,
            name: regData.name,
            createdAt: regData.createdAt
          });
          setEventDate(eventData.date);
          setEventLocation(eventData.location);
          setEventName(eventData.name);
        }
      } catch (error) {
        console.error('Failed to fetch ticket data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId && registrationId) {
      fetchTicketData();
    }
  }, [eventId, registrationId, state]);

  useEffect(() => {
    if (state?.ticketData && !eventName) {
      const fetchEventName = async () => {
        try {
          const response = await fetch(`/api/events/${eventId}`);
          const data = await response.json();
          setEventName(data.name);
        } catch (error) {
          console.error('Failed to fetch event name:', error);
        }
      };
      fetchEventName();
    }
  }, [eventId, state, eventName]);

  const handleDownload = () => {
    if (!ticketData) return;
    
    const ticketContent = `
活动名称: ${eventName}
持票人: ${ticketData.name}
活动时间: ${new Date(eventDate).toLocaleString('zh-CN')}
活动地点: ${eventLocation}
报名时间: ${new Date(ticketData.createdAt).toLocaleString('zh-CN')}
票券编号: ${ticketData.registrationId}
    `;
    
    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `电子票券_${ticketData.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-xl text-gray-500 mb-4">票券不存在</p>
        <Link
          to="/"
          className="text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in py-8 px-4">
      <div className="container mx-auto">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回活动列表
            </Link>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-all hover:scale-[1.05] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              下载票券
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">报名成功！</h1>
            <p className="text-gray-500">请保存以下电子票券，入场时出示扫码签到</p>
          </div>

          <TicketComponent
            eventName={eventName || ticketData.eventId}
            userName={ticketData.name}
            qrcodeUrl={ticketData.qrcodeUrl}
            registrationId={ticketData.registrationId}
            createdAt={ticketData.createdAt}
            eventDate={eventDate}
            eventLocation={eventLocation}
          />

          <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
            <h3 className="font-semibold text-primary mb-3">温馨提示</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-success">•</span>
                请在活动开始前15分钟到达现场，出示此电子票券扫码入场
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">•</span>
                每张票券仅限一人使用，不可转让
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">•</span>
                如需退票，请提前24小时联系活动组织者
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success">•</span>
                活动现场请遵守秩序，配合工作人员指引
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
