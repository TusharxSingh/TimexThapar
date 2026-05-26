import React, { useState, useEffect } from "react";
import axios from "axios";
import API_URL from "../config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { days, periods, periodLabels, formatTimetableData } from "../constants/timetable";

const FacultyTimetable = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teacherList, setTeacherList] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [timetable, setTimetable] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const token = localStorage.getItem("accessToken");

  const getBackRoute = () => {
    const role = user?.role || localStorage.getItem('userRole');
    if (role === 'teacher') return '/teacher-dashboard';
    return '/student-dashboard';
  };

  useEffect(() => {
    axios.get(`${API_URL}/api/teachers/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(res => setTeacherList(res.data))
    .catch(err => console.error("Error fetching teacher list:", err));
  }, [token]);

  const handleSubmit = () => {
    if (!selectedTeacher) return;
    setIsLoading(true);
    setHasSearched(true);
    axios.get(`${API_URL}/api/timetable/?teacher_id=${selectedTeacher}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(res => {
      setTimetable(formatTimetableData(res.data || []));
    })
    .catch(err => {
      console.error("Error fetching timetable:", err);
      setTimetable({});
    })
    .finally(() => setIsLoading(false));
  };

  const hasEntries = Object.values(timetable).some(
    (row) => Array.isArray(row) && row.some((cell) => cell && typeof cell === 'object')
  );

  return (
    <div className="container my-5">
      <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
        <button
          onClick={() => navigate(getBackRoute())}
          className="btn btn-link p-0"
          style={{ border: 'none', padding: '0', background: 'none', position: 'absolute', left: '20px' }}
        >
          <img src="/back-arrow.svg" alt="Back" style={{ width: '32px', height: '32px' }} />
        </button>
        <h2 className="text-center text-danger mb-0">Teacher Timetable Viewer</h2>
      </div>

      <div className="mb-4 d-flex justify-content-center">
        <select
          className="form-select w-auto me-3"
          value={selectedTeacher}
          onChange={e => setSelectedTeacher(e.target.value)}
        >
          <option value="">Select Teacher</option>
          {teacherList.map(teacher => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.first_name} {teacher.last_name}
            </option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          className="btn btn-danger"
        >
          View Timetable
        </button>
      </div>

      {isLoading && (
        <div className="text-center my-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {!isLoading && hasSearched && !hasEntries && (
        <div className="alert alert-warning text-center">
          No timetable entries found for this teacher.
        </div>
      )}

      {!isLoading && hasEntries && (
        <div className="table-responsive shadow-sm">
          <table className="table table-bordered table-striped text-center mb-0">
            <thead className="table-danger">
              <tr>
                <th style={{ minWidth: '120px' }}>Periods / Days</th>
                {periodLabels.map((label, idx) => (
                  <th key={idx} style={{ minWidth: '110px' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day}>
                  <th>{day}</th>
                  {(() => {
                    const cells = [];
                    for (let i = 0; i < periods.length; i++) {
                      const entry = timetable[day]?.[i];
                      if (entry === "SKIP") continue;

                      if (entry && typeof entry === "object") {
                        cells.push(
                          <td key={i} colSpan={entry.span}>
                            {entry.text}
                          </td>
                        );
                        i += entry.span - 1;
                      } else {
                        cells.push(<td key={i}></td>);
                      }
                    }
                    return cells;
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FacultyTimetable;
