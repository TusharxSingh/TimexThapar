import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDisplayName from '../hooks/useDisplayName';

const UserSidebar = ({ activeSection, onSectionChange }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const displayName = useDisplayName();

  const handleLogout = () => {
    logout();
    navigate('/');
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
      <h5 className="fw-bold mb-4 text-center">{displayName}</h5>
      <ul className="nav flex-column w-100 text-center gap-3">
        <li className="nav-item">
          <button className={linkClass('dashboard')} onClick={() => onSectionChange('dashboard')}>
            Dashboard
          </button>
        </li>
        <li className="nav-item">
          <button className={linkClass('profile')} onClick={() => onSectionChange('profile')}>
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

export default UserSidebar;
