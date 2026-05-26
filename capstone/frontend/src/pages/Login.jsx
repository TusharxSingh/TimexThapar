import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import '../styles/Login.css';

const Login = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (user) {
    const dashboards = {
      admin: '/admin-dashboard',
      teacher: '/teacher-dashboard',
      student: '/student-dashboard',
    };
    return <Navigate to={dashboards[user.role] || '/student-dashboard'} replace />;
  }

  return (
    <div className="container-fluid vh-100 d-flex p-0">
      <div className="col-md-6 p-0 d-none d-md-block">
        <img
          src="/thapar.png"
          alt="campus"
          className="img-fluid h-100 w-100 object-fit-cover"
        />
      </div>
      <div className="col-md-6 d-flex align-items-center justify-content-center bg-light">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
