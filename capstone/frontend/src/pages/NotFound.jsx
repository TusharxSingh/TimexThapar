import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <h1 className="display-1 fw-bold text-danger">404</h1>
      <h4 className="mb-3">Page Not Found</h4>
      <p className="text-muted mb-4">The page you're looking for doesn't exist or has been moved.</p>
      <button className="btn btn-danger" onClick={() => navigate('/')}>
        Go to Login
      </button>
    </div>
  );
};

export default NotFound;
