import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_URL from "../config";
import AdminSidebar from "../components/AdminSidebar";
import useDisplayName from "../hooks/useDisplayName";

const GenerateTimeTable = () => {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [timeslot, setTimeslots] = useState([]);
  const [maxHours, setMaxHours] = useState(6);
  const [timetable, setTimetable] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const accessToken = localStorage.getItem("accessToken");
  const navigate = useNavigate();
  const displayName = useDisplayName('Admin');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersRes, coursesRes, timeslotRes] = await Promise.all([
          axios.get(`${API_URL}/api/teachers/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${API_URL}/api/courses/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${API_URL}/api/timeslots/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        setTeachers(teachersRes.data || []);
        setCourses(coursesRes.data || []);
        setTimeslots(timeslotRes.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("An error occurred while fetching data.");
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchData();
  }, [accessToken, navigate]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setError("");
    axios
      .post(
        `${API_URL}/api/generate-timetable/`,
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
      .finally(() => setIsGenerating(false));
  };

  return (
    <div className="d-flex">
      <AdminSidebar />

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
          disabled={isGenerating || isInitialLoading}
        >
          {isGenerating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Generating...
            </>
          ) : (
            'Generate Timetable'
          )}
        </button>

        {/* Show Teachers List */}
        <div className="mt-4">
          <h3 className="fw-semibold mb-3">Teachers</h3>
          {isInitialLoading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : teachers.length === 0 ? (
            <p className="text-muted">No teachers found. Add teachers first.</p>
          ) : (
            <ul className="list-group">
              {teachers.map((t, i) => (
                <li key={i} className="list-group-item bg-white border rounded shadow-sm">
                  <strong>{t.first_name} {t.last_name}</strong> -{" "}
                  {courses
                    .filter((c) => c.teacher === t.id)
                    .map((c) => c.name)
                    .join(", ") || <span className="text-muted">No subjects assigned</span>}
                </li>
              ))}
            </ul>
          )}
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