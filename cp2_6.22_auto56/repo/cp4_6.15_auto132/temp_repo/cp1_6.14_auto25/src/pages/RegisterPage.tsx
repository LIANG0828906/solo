import React from 'react';
import ProfileForm from '../components/ProfileForm';
import { useStore } from '../store/useStore';
import { Navigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const { currentUser } = useStore();

  if (currentUser) {
    return <Navigate to="/discover" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-white to-[#FFE5E5] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
        <ProfileForm />
      </div>
    </div>
  );
};

export default RegisterPage;
