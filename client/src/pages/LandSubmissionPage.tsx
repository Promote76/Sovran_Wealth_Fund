import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandSubmissionForm from '../components/LandSubmissionForm';

const LandSubmissionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <LandSubmissionForm onClose={() => navigate('/admin')} />
    </div>
  );
};

export default LandSubmissionPage;
