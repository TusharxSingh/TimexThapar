import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GenerateTimeTable = () => {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [timeslot, setTimeslots] = useState([]);
  const [maxHours, setMaxHours] = useState(6);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const accessToken = localStorage.getItem("accessToken");
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.first_name?.trim()
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    if (logout) logout();
    navigate('/');
  };

  useEffect(() => {
    if (!accessToken) {
      setError("No access token found!");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [teachersRes, coursesRes, timeslotRes] = await Promise.all([
          axios.get("http://localhost:8000/api/teachers/", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get("http://localhost:8000/api/courses/", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get("http://localhost:8000/api/timeslots/", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        setTeachers(teachersRes.data || []);
        setCourses(coursesRes.data || []);
        setTimeslots(timeslotRes.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        if (err.response?.status === 401) {
          setError("Unauthorized: Please log in again.");
          navigate("/login");
        } else {
          setError("An error occurred while fetching data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken, navigate]);

  const handleGenerate = () => {
    setLoading(true);
    axios
      .post(
        "http://localhost:8000/api/generate-timetable/",
        { max_hours_per_day: maxHours },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      .then((res) => {
        setTimetable(res.data);
      })
      .catch((err) => {
        console.error("Failed to generate timetable", err);
        setError("Failed to generate timetable. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="text-center my-5">Loading...</div>;

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-danger text-white d-flex flex-column align-items-center p-4" style={{ width: '260px', minHeight: '100vh' }}>
        <h5 className="fw-bold text-capitalize mb-2">{displayName}</h5>

        <ul className="nav flex-column text-center w-100 mt-4 gap-3">
          <li className="nav-item">
            <button
              className="nav-link text-white btn btn-link p-0 w-100"
              onClick={() => navigate('/admin-dashboard')}
            >
              Dashboard
            </button>
          </li>
          <li className="nav-item">
            <button
              className="nav-link text-white btn btn-link p-0 w-100"
              onClick={() => navigate('/admin-dashboard#profile-settings')}
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
      <div className="flex-grow-1 p-5" style={{ backgroundColor: '#fdfde0' }}>
        <div className="d-flex align-items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="btn btn-link p-0"
            style={{ border: 'none', padding: '0', background: 'none' }}
          >
            <img src="/back-arrow.svg" alt="Back" style={{ width: '32px', height: '32px' }} />
          </button>
          <h4 className="fw-bold mb-0">Welcome, <span className="text-danger">{displayName}</span>!</h4>
        </div>
        <p className="text-muted">Stay Organised , Stay Ahead</p>

        <h2 className="fw-bold mt-4">Generate Timetable</h2>
        <p className="text-muted">Auto-generate based on max hours per day</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label htmlFor="maxHours" className="form-label fw-semibold">Max Hours Per Day:</label>
          <input
            id="maxHours"
            type="number"
            value={maxHours}
            onChange={(e) => setMaxHours(parseInt(e.target.value))}
            className="form-control"
            min="1"
            max="12"
          />
        </div>

        <button
          onClick={handleGenerate}
          className="btn btn-danger mb-4"
        >
          Generate Timetable
        </button>

        {/* Show Teachers List */}
        <div className="mt-4">
          <h3 className="fw-semibold mb-3">Teachers</h3>
          <ul className="list-group">
            {(teachers || []).map((t, i) => (
              <li key={i} className="list-group-item bg-white border rounded shadow-sm">
                <strong>{t.first_name} {t.last_name}</strong> -{" "}
                {courses
                  .filter((c) => c.teacher === t.id)
                  .map((c) => c.name)
                  .join(", ")}
              </li>
            ))}
          </ul>
        </div>

        {/* Generated Timetable */}
        {timetable && (
          <div className="mt-5">
            <h3 className="fw-semibold mb-3">Generated Timetable</h3>
            {timetable.length === 0 ? (
              <p className="text-muted">No timetable generated. Please try again.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead className="table-light">
                    <tr>
                      {Object.keys(timetable[0] || {}).map((col, i) => (
                        <th key={i}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(timetable || []).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row || {}).map((val, j) => (
                          <td key={j}>
                            {typeof val === "object" && val !== null
                              ? JSON.stringify(val)
                              : val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateTimeTable;