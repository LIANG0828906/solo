import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { Share2, Loader2 } from 'lucide-react';
import ProfileEditor from './ProfileEditor';
import SkillGraph from './SkillGraph';
import Timeline from './Timeline';
import PublicProfile from './PublicProfile';
import type { Profile, Skill, Project, AppData } from './types';
import { getProfile, updateProfile, updateSkills } from './api';

function ProfilePreview({ profile }: { profile: Profile }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex flex-col items-center text-center">
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-32 h-32 rounded-full object-cover border-4 border-amber shadow-lg mb-4"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="16">No Image</text></svg>';
          }}
        />
        <h1 className="text-3xl font-bold text-dark-green mb-2">{profile.name}</h1>
        <p className="text-gray-600 mb-4 leading-relaxed max-w-md">{profile.bio}</p>
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:text-amber/80 font-medium transition-colors"
          >
            {profile.website}
          </a>
        )}
      </div>
    </div>
  );
}

function EditPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getProfile();
        setProfile(data.profile);
        setSkills(data.skills);
        setProjects(data.projects);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleProfileChange = useCallback((updatedProfile: Profile) => {
    setProfile(updatedProfile);
  }, []);

  const handleProfileSave = useCallback(async (updatedProfile: Profile): Promise<boolean> => {
    try {
      const result = await updateProfile({
        avatar: updatedProfile.avatar,
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        website: updatedProfile.website,
      });
      setProfile(result.profile);
      return result.success;
    } catch (error) {
      console.error('保存失败:', error);
      return false;
    }
  }, []);

  const handleSkillsChange = useCallback(async (updatedSkills: Skill[]) => {
    setSkills(updatedSkills);
    try {
      await updateSkills(updatedSkills);
    } catch (error) {
      console.error('保存技能失败:', error);
    }
  }, []);

  const handleGenerateShare = useCallback(() => {
    if (profile) {
      navigate(`/profile/${profile.id}`);
    }
  }, [profile, navigate]);

  const timelineProjects = projects;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-dark-green animate-spin" />
          <p className="text-dark-green text-lg font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-dark-green text-lg">加载失败，请刷新页面</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-dark-green text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">个人主页编辑器</h1>
          <button
            onClick={handleGenerateShare}
            className="flex items-center gap-2 px-5 py-2 bg-amber text-white rounded-lg font-medium hover:bg-amber/90 transition-colors active:scale-98"
          >
            <Share2 size={20} />
            生成分享页
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-[35%] space-y-6">
            <ProfileEditor
              profile={profile}
              onChange={handleProfileChange}
              onSave={handleProfileSave}
            />
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-dark-green mb-4">技能图谱</h3>
              <SkillGraph
                skills={skills}
                editable={true}
                onSkillChange={handleSkillsChange}
              />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-dark-green mb-4">项目时间线</h3>
              <Timeline
                projects={timelineProjects}
                editable={true}
              />
            </div>
          </div>

          <div className="w-full md:w-[65%] space-y-6">
            <div className="sticky top-4">
              <h2 className="text-xl font-bold text-dark-green mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-amber rounded-full"></span>
                实时预览
              </h2>
              <div className="space-y-6">
                <ProfilePreview profile={profile} />
                
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-dark-green mb-4">技能图谱</h3>
                  <SkillGraph skills={skills} editable={false} />
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-dark-green mb-4">项目时间线</h3>
                  <Timeline projects={timelineProjects} editable={false} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EditPage />} />
      <Route path="/profile/:id" element={<PublicProfile />} />
    </Routes>
  );
}
