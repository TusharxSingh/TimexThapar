import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDisplayName from '../hooks/useDisplayName';

const AdminSidebar = ({ activeSection, onSectionChange }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const displayName = useDisplayName('Admin');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDashboardClick = () => {
    if (onSectionChange) {
      onSectionChange('dashboard');
      navigate('/admin-dashboard');
    } else {
      navigate('/admin-dashboard');
    }
  };

  const handleProfileClick = () => {
    if (onSectionChange) {
      onSectionChange('profile');
    } else {
      navigate('/admin-dashboard#profile-settings');
    }
  };

  const linkClass = (section) =>
    `nav-link text-white btn btn-link p-0 w-100 ${
      activeSection === section ? 'fw-bold text-decoration-underline' : ''
    }`;

  return (
    <div
      className="bg-danger text-white d-flex flex-column align-items-center p-4"
      style={{ width: '260px', minHeight: '100vh' }}
    >
      <h5 className="fw-bold mb-4 text-capitalize text-center">{displayName}</h5>
      <ul className="nav flex-column text-center w-100 gap-3">
        <li className="nav-item">
          <button className={linkClass('dashboard')} onClick={handleDashboardClick}>
            Dashboard
          </button>
        </li>
        <li className="nav-item">
          <button className={linkClass('profile')} onClick={handleProfileClick}>
            Profile Settings
          </button>
        </li>
        <li className="nav-item">
          <button className="nav-link text-white btn btn-link p-0 w-100" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default AdminSidebar;
