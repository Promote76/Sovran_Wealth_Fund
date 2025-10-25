import React from 'react';
import { useNavigate } from 'react-router-dom';
import KeyGrowRegistrationForm from '../components/KeyGrowRegistrationForm';

export default function KeyGrowRegistrationPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/keygrow-dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <KeyGrowRegistrationForm 
            onClose={handleClose}
          />
        </div>
      </div>
    </div>
  );
}
