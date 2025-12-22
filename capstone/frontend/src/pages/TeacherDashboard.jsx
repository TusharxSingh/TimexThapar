import React, { useCallback, useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periods = [
  '08:00 - 08:50', '08:50 - 09:40', '09:40 - 10:30', '10:30 - 11:20',
  '11:20 - 12:10', '12:10 - 13:00', '13:00 - 13:50', '13:50 - 14:40',
  '14:40 - 15:30', '15:30 - 16:20', '16:20 - 17:10'
];
const periodLabels = [
  '1 (8:00–8:50)', '2 (8:50–9:40)', '3 (9:40–10:30)', '4 (10:30–11:20)',
  '5 (11:20–12:10)', '6 (12:10–1:00)', '7 (1:00–1:50)', '8 (1:50–2:40)',
  '9 (2:40–3:30)', '10 (3:30–4:20)', '11 (4:20–5:10)'
];

const createEmptyTimetable = () => {
  const structure = {};
  days.forEach((day) => {
    structure[day] = Array(periods.length).fill(null);
  });
  return structure;
};

const TeacherDashboard = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState('dashboard');
  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    department: user?.branch || '',
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

  const [timetable, setTimetable] = useState(createEmptyTimetable());
  const [timetableStatus, setTimetableStatus] = useState({ type: '', message: '' });
  const [isFetchingTimetable, setIsFetchingTimetable] = useState(false);

  const displayName = user?.first_name?.trim()
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : (user?.username || 'User');

  useEffect(() => {
    setProfileForm({
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      department: user?.branch || '',
    });
  }, [user?.first_name, user?.last_name, user?.branch]);

  useEffect(() => {
    if (location.hash === '#profile-settings') {
      setActiveSection('profile');
    } else if (location.hash === '#dashboard') {
      setActiveSection('dashboard');
    }
  }, [location.hash]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');

    if (logout) logout();
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
          branch: profileForm.department,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { first_name, last_name, branch } = response.data;
      setUser((prev) => ({
        ...prev,
        first_name,
        last_name,
        branch,
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

  const fetchTeacherTimetable = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user?.first_name) {
      setTimetable(createEmptyTimetable());
      setTimetableStatus({ type: 'warning', message: 'Complete your profile to see the timetable.' });
      return;
    }

    const normalize = (value) => (value || '').trim().toLowerCase();

    setIsFetchingTimetable(true);
    setTimetableStatus({ type: '', message: '' });

    try {
      const teachersRes = await axios.get('http://localhost:8000/api/teachers/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const teachers = teachersRes.data || [];
      let match = teachers.find(
        (t) =>
          normalize(t.first_name) === normalize(user.first_name) &&
          (!user.last_name?.trim() || normalize(t.last_name) === normalize(user.last_name))
      );

      if (!match) {
        match = teachers.find((t) => normalize(t.first_name) === normalize(user.first_name));
      }

      if (!match) {
        setTimetable(createEmptyTimetable());
        setTimetableStatus({ type: 'warning', message: 'No matching teacher found for your profile yet.' });
        return;
      }

      const timetableRes = await axios.get(
        `http://localhost:8000/api/timetable/?teacher_id=${match.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = timetableRes.data || [];
      const formatted = createEmptyTimetable();

      data.forEach((entry) => {
        const { day, time, subject, type, room } = entry;
        if (!day || !time) return;

        const [start, end] = time.split('-').map((part) => part.trim());
        const startIndex = periods.findIndex((slot) => slot.startsWith(start));
        const endIndex = periods.findIndex((slot) => slot.endsWith(end));
        let span = 1;

        if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
          span = endIndex - startIndex + 1;
          formatted[day][startIndex] = {
            text: `${subject} (${type}) [Room ${room}]`,
            span,
          };

          for (let i = 1; i < span; i += 1) {
            formatted[day][startIndex + i] = 'SKIP';
          }
        }
      });

      setTimetable(formatted);
      if (!data.length) {
        setTimetableStatus({ type: 'warning', message: 'No timetable entries saved for you yet.' });
      } else {
        setTimetableStatus({ type: 'success', message: 'Timetable loaded successfully.' });
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setTimetable(createEmptyTimetable());
      setTimetableStatus({ type: 'error', message: 'Unable to load timetable right now.' });
    } finally {
      setIsFetchingTimetable(false);
    }
  }, [user?.first_name, user?.last_name]);

  useEffect(() => {
    fetchTeacherTimetable();
  }, [fetchTeacherTimetable]);

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-danger text-white d-flex flex-column align-items-center p-4" style={{ width: '260px', minHeight: '100vh' }}>
        
        <h5 className="fw-bold mb-4 text-center">{displayName}</h5>
        

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
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card bg-danger text-white shadow h-100">
                <div className="card-body">
                  <h5 className="card-title fw-bold">Your Timetable</h5>
                  <p className="card-text small">View your personalised weekly schedule.</p>
                  <button
                    onClick={() => navigate('/teacher-timetable')}
                    className="btn btn-light btn-sm fw-bold"
                  >
                    View Timetable
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card bg-danger text-white shadow h-100">
                <div className="card-body">
                  <h5 className="card-title fw-bold">Faculty Availability</h5>
                  <p className="card-text small">Check available slots of other teachers.</p>
                  <button
                    onClick={() => navigate('/faculty-timetable')}
                    className="btn btn-light btn-sm fw-bold"
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
                  <p className="card-text small">Update the information shown across the portal.</p>
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
                    <div className="mb-3">
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
                    <div className="mb-4">
                      <label htmlFor="department" className="form-label">Department</label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        className="form-control"
                        value={profileForm.department}
                        onChange={handleProfileInput}
                        placeholder="Enter department"
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

export default TeacherDashboard;
