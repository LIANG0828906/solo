import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  UserPlus,
  X,
  Users,
  Settings,
  Share2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import TripPlanner from '@/components/TripPlanner';
import { useToastStore } from '@/stores/toastStore';

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  day?: number;
}

const initialWaypoints: Waypoint[] = [
  { id: '1', name: '北京首都机场', lat: 40.0799, lng: 116.6031, description: '出发', day: 1 },
  { id: '2', name: '西安古城墙', lat: 34.3416, lng: 108.9398, description: 'Day2 游览古城', day: 2 },
  { id: '3', name: '成都大熊猫基地', lat: 30.7328, lng: 104.1368, description: '看大熊猫', day: 3 },
  { id: '4', name: '九寨沟风景区', lat: 33.1638, lng: 103.9135, description: 'Day4-5 景区游览', day: 4 },
];

export default function TripEditorPage() {
  const { tripId } = useParams<{ tripId: string }>();
  void tripId;
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [waypoints, setWaypoints] = useState<Waypoint[]>(initialWaypoints);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [tripName, setTripName] = useState('川陕五日深度游');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    addToast({
      message: '草稿已保存',
      type: 'success',
    });
  };

  const handlePublish = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    addToast({
      message: '路线发布成功！',
      type: 'success',
    });
  };

  const handleInvite = () => {
    if (!inviteUsername.trim()) return;
    addToast({
      message: `已向 ${inviteUsername} 发送邀请`,
      type: 'invite',
      onClick: () => {
        navigate('/profile');
      },
    });
    setInviteUsername('');
    setShowInvite(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />

      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              {showInvite && (
                <div className="flex items-center gap-2 mr-2 animate-fadeIn">
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    placeholder="输入用户名"
                    className="w-48 input-field py-1.5 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={handleInvite}
                    className="p-1.5 text-[#1a73e8] hover:bg-blue-50 rounded-lg"
                  >
                    <Send size={18} />
                  </button>
                  <button
                    onClick={() => setShowInvite(false)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowInvite(!showInvite)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <UserPlus size={18} />
                <span className="hidden sm:inline">邀请好友</span>
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Save size={18} />
                <span className="hidden sm:inline">保存草稿</span>
              </button>

              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#1a73e8] to-[#34a853] rounded-lg hover:opacity-90 transition-opacity"
              >
                <Send size={16} />
                <span className="hidden sm:inline">发布</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 h-full min-h-[500px]">
          <TripPlanner
            waypoints={waypoints}
            onChange={setWaypoints}
            readOnly={false}
          />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-gray-500" />
              <span className="text-sm text-gray-500">协作成员：</span>
              <div className="flex -space-x-2">
                <img
                  src="https://picsum.photos/seed/user1/40/40"
                  alt="user1"
                  className="w-7 h-7 rounded-full border-2 border-white"
                />
                <img
                  src="https://picsum.photos/seed/user2/40/40"
                  alt="user2"
                  className="w-7 h-7 rounded-full border-2 border-white"
                />
                <img
                  src="https://picsum.photos/seed/user3/40/40"
                  alt="user3"
                  className="w-7 h-7 rounded-full border-2 border-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 size={18} />
              </button>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
