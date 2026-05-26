import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaMapMarkerAlt } from 'react-icons/fa';

const AdminDashboard = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    if (location.hash === '#profile-settings') {
      setActiveSection('profile');
    } else if (location.hash === '#dashboard') {
      setActiveSection('dashboard');
    }
  }, [location.hash]);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
  });
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinStatus, setPinStatus] = useState({ type: '', message: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    if (logout) logout();
    navigate('/');
  };

  const handleTeachersRedirect = () => {
    navigate('/Teachers');
  };

  const handleCoursesClick = () => {
    navigate('/courses');
  };

  const handleRoomsRedirect = () => {
    navigate('/rooms'); // <--- Route to your Rooms page
  };

  const handleGenerateTimeTableRedirect = () => {
    navigate('/generatetimetable');
  };
  

  const handleFormInput = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePinInput = (event) => {
    const { name, value } = event.target;
    setPinForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileStatus({ type: '', message: '' });

    if (!profileForm.firstName.trim()) {
      setProfileStatus({ type: 'error', message: 'First name is required.' });
      return;
    }

    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/api/profile/`,
        {
          first_name: profileForm.firstName,
          last_name: profileForm.lastName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { first_name, last_name } = response.data;
      setUser((prev) => ({
        ...prev,
        first_name,
        last_name,
      }));
      setProfileStatus({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      const serverMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to update profile. Please try again.';
      setProfileStatus({ type: 'error', message: serverMessage });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePinSubmit = async (event) => {
    event.preventDefault();
    setPinStatus({ type: '', message: '' });

    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinStatus({ type: 'error', message: 'New PIN and confirm PIN must match.' });
      return;
    }

    if (!/^\d{4,6}$/.test(pinForm.newPin)) {
      setPinStatus({ type: 'error', message: 'PIN must be a 4 or 6 digit number.' });
      return;
    }

    setIsUpdatingPin(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_URL}/api/change-pin/`,
        {
          current_pin: pinForm.currentPin,
          new_pin: pinForm.newPin,
          confirm_pin: pinForm.confirmPin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPinStatus({ type: 'success', message: 'PIN updated successfully.' });
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
    } catch (error) {
      const serverMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to update PIN. Please try again.';
      setPinStatus({ type: 'error', message: serverMessage });
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const displayName = user?.first_name?.trim()
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'Admin';

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-danger text-white d-flex flex-column align-items-center p-4" style={{ width: '260px', minHeight: '100vh' }}>
        <h5 className="fw-bold text-capitalize mb-2">{displayName}</h5>

        <ul className="nav flex-column text-center w-100 mt-4 gap-3">
          <li className="nav-item">
            <button
              className={`nav-link text-white btn btn-link p-0 w-100 ${activeSection === 'dashboard' ? 'fw-bold text-decoration-underline' : ''}`}
              onClick={() => {
                setActiveSection('dashboard');
                navigate('/admin-dashboard');
              }}
            >
              Dashboard
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link text-white btn btn-link p-0 w-100 ${activeSection === 'profile' ? 'fw-bold text-decoration-underline' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              Profile Settings
            </button>
          </li>
          <li className="nav-item">
            <button onClick={handleLogout} className="btn btn-link nav-link text-white p-0 w-100">
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 bg-light p-5">
        <h4 className="fw-bold">Welcome, <span className="text-danger">{displayName}</span>!</h4>
        <p className="text-muted mb-4">Stay Organised , Stay Ahead</p>

        {activeSection === 'dashboard' && (
          <>
            <h5 className="mb-4">Start Generating Time Table</h5>

            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="card shadow h-100">
                  <div className="card-body d-flex flex-column align-items-center text-center">
                    <FaCalendarAlt size={30} className="mb-2 text-danger" />
                    <div className="fw-bold mb-3">Total Subjects</div>
                    <button onClick={handleCoursesClick} className="btn btn-danger btn-sm w-100">
                      Manage Subjects
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card shadow h-100">
                  <div className="card-body d-flex flex-column align-items-center text-center">
                    <FaUser size={30} className="mb-2 text-danger" />
                    <div className="fw-bold mb-3">Total Teachers</div>
                    <button onClick={handleTeachersRedirect} className="btn btn-danger btn-sm w-100">
                      View Teachers
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card shadow h-100">
                  <div className="card-body d-flex flex-column align-items-center text-center">
                    <FaMapMarkerAlt size={30} className="mb-2 text-danger" />
                    <div className="fw-bold mb-3">Total Rooms</div>
                    <button onClick={handleRoomsRedirect} className="btn btn-danger btn-sm w-100">
                      Manage Rooms
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleGenerateTimeTableRedirect} className="btn btn-light border-danger text-danger fw-bold shadow-sm">
              Start Generating
            </button>
          </>
        )}

        {activeSection === 'profile' && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card shadow h-100">
                <div className="card-body">
                  <h5 className="card-title fw-bold">Profile Settings</h5>
                  <p className="card-text small text-muted">Edit how your details appear across the portal.</p>
                  {profileStatus.message && (
                    <div className={`alert ${profileStatus.type === 'error' ? 'alert-danger' : 'alert-success'}`} role="alert">
                      {profileStatus.message}
                    </div>
                  )}
                  <form onSubmit={handleProfileSubmit}>
                    <div className="mb-3">
                      <label htmlFor="firstName" className="form-label">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        className="form-control"
                        value={profileForm.firstName}
                        onChange={handleFormInput}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        className="form-control"
                        value={profileForm.lastName}
                        onChange={handleFormInput}
                        placeholder="Enter last name"
                      />
                    </div>
                    <button type="submit" className="btn btn-danger" disabled={isSavingProfile}>
                      {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow h-100">
                <div className="card-body">
                  <h5 className="card-title fw-bold">Change PIN</h5>
                  <p className="card-text small text-muted">Manage your login PIN securely.</p>
                  {pinStatus.message && (
                    <div className={`alert ${pinStatus.type === 'error' ? 'alert-danger' : 'alert-success'}`} role="alert">
                      {pinStatus.message}
                    </div>
                  )}
                  <form onSubmit={handlePinSubmit}>
                    <div className="mb-3">
                      <label htmlFor="currentPin" className="form-label">Current PIN</label>
                      <input
                        type="password"
                        className="form-control"
                        id="currentPin"
                        name="currentPin"
                        value={pinForm.currentPin}
                        onChange={handlePinInput}
                        placeholder="Enter current PIN"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="newPin" className="form-label">New PIN</label>
                      <input
                        type="password"
                        className="form-control"
                        id="newPin"
                        name="newPin"
                        value={pinForm.newPin}
                        onChange={handlePinInput}
                        placeholder="Enter new PIN"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="confirmPin" className="form-label">Confirm PIN</label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPin"
                        name="confirmPin"
                        value={pinForm.confirmPin}
                        onChange={handlePinInput}
                        placeholder="Confirm new PIN"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-danger" disabled={isUpdatingPin}>
                      {isUpdatingPin ? 'Updating...' : 'Update PIN'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
