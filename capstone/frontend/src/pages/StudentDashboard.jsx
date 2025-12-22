import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentDashboard = () => {
  const { user, logout, setUser } = useAuth(); // get user + logout from context
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    rollNumber: user?.roll_number || '',
    branch: user?.branch || '',
    yearOfStudy: user?.year_of_study ? String(user.year_of_study) : '',
  });
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinStatus, setPinStatus] = useState({ type: '', message: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  useEffect(() => {
    setProfileForm({
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      rollNumber: user?.roll_number || '',
      branch: user?.branch || '',
      yearOfStudy: user?.year_of_study ? String(user.year_of_study) : '',
    });
  }, [user?.first_name, user?.last_name, user?.roll_number, user?.branch, user?.year_of_study]);

  const displayName = user?.first_name?.trim() ? user.first_name : (user?.username || 'User');

  useEffect(() => {
    if (location.hash === '#profile-settings') {
      setActiveSection('profile');
    } else if (location.hash === '#dashboard') {
      setActiveSection('dashboard');
    }
  }, [location.hash]);

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');

    // Clear auth context if using it
    if (logout) logout(); // optional, based on your context

    // Navigate to login page
    navigate('/');
  };

  const handleProfileInput = (event) => {
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
        'http://localhost:8000/api/profile/',
        {
          first_name: profileForm.firstName,
          last_name: profileForm.lastName,
          roll_number: profileForm.rollNumber,
          branch: profileForm.branch,
          year_of_study: profileForm.yearOfStudy,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { first_name, last_name, roll_number, branch, year_of_study } = response.data;

      setUser((prev) => ({
        ...prev,
        first_name,
        last_name,
        roll_number,
        branch,
        year_of_study,
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

    setIsSubmittingPin(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        'http://localhost:8000/api/change-pin/',
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
      setIsSubmittingPin(false);
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-danger text-white d-flex flex-column align-items-center p-4" style={{ width: '260px', minHeight: '100vh' }}>
        
        <h5 className="fw-bold mb-4">{displayName}</h5>
        

        <ul className="nav flex-column w-100 text-center gap-3">
          <li className="nav-item">
            <button
              className={`nav-link text-white btn btn-link p-0 w-100 ${activeSection === 'dashboard' ? 'fw-bold text-decoration-underline' : ''}`}
              onClick={() => setActiveSection('dashboard')}
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
            <button
              onClick={handleLogout}
              className="nav-link text-white btn btn-link p-0 w-100"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 bg-light p-5">
        <h4 className="fw-bold">Welcome <span className="text-danger">{displayName}</span>!</h4>
        <p className="text-muted mb-4">Stay Organised, Stay Ahead</p>

        {activeSection === 'dashboard' && (
          <div className="row g-4 justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card bg-danger text-white shadow h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-bold">Teachers Timetable</h5>
                  <p className="card-text small flex-grow-1">Need to meet a teacher? Check free slots and cabin location.</p>
                  <button
                    onClick={() => navigate('/faculty-timetable')}
                    className="btn btn-light btn-sm fw-bold mt-3"
                  >
                    Check Availability
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card shadow h-100">
                <div className="card-body">
                  <h5 className="card-title fw-bold">Profile Details</h5>
                  <p className="card-text small">Update the personal information that appears across the portal.</p>
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
                        onChange={handleProfileInput}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        className="form-control"
                        value={profileForm.lastName}
                        onChange={handleProfileInput}
                        placeholder="Enter last name"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="rollNumber" className="form-label">Roll Number</label>
                      <input
                        type="text"
                        id="rollNumber"
                        name="rollNumber"
                        className="form-control"
                        value={profileForm.rollNumber}
                        onChange={handleProfileInput}
                        placeholder="Enter roll number"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="branch" className="form-label">Branch</label>
                      <input
                        type="text"
                        id="branch"
                        name="branch"
                        className="form-control"
                        value={profileForm.branch}
                        onChange={handleProfileInput}
                        placeholder="Enter branch (e.g., CSE)"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="yearOfStudy" className="form-label">Year</label>
                      <select
                        id="yearOfStudy"
                        name="yearOfStudy"
                        className="form-select"
                        value={profileForm.yearOfStudy}
                        onChange={handleProfileInput}
                      >
                        <option value="">-- Select Year --</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
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
                  <p className="card-text small">Securely update your login PIN whenever you need.</p>
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
                    <button type="submit" className="btn btn-danger" disabled={isSubmittingPin}>
                      {isSubmittingPin ? 'Updating...' : 'Update PIN'}
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

export default StudentDashboard;
