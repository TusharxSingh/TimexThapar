import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FacultyTimetable = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teacherList, setTeacherList] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [timetable, setTimetable] = useState({});
  const token = localStorage.getItem("accessToken");
  
  const getBackRoute = () => {
    const role = user?.role || localStorage.getItem('userRole');
    if (role === 'teacher') return '/teacher-dashboard';
    return '/student-dashboard';
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [
    "08:00 - 08:50", "08:50 - 09:40", "09:40 - 10:30", "10:30 - 11:20",
    "11:20 - 12:10", "12:10 - 13:00", "13:00 - 13:50", "13:50 - 14:40",
    "14:40 - 15:30", "15:30 - 16:20", "16:20 - 17:10"
  ];

  const periodLabels = [
    "1 (8:00–8:50)", "2 (8:50–9:40)", "3 (9:40–10:30)", "4 (10:30–11:20)",
    "5 (11:20–12:10)", "6 (12:10–1:00)", "7 (1:00–1:50)", "8 (1:50–2:40)",
    "9 (2:40–3:30)", "10 (3:30–4:20)", "11 (4:20–5:10)"
  ];

  useEffect(() => {
    axios.get("http://localhost:8000/api/teachers/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(res => setTeacherList(res.data))
    .catch(err => console.error("Error fetching teacher list:", err));
  }, [token]);

  const handleSubmit = () => {
    axios.get(`http://localhost:8000/api/timetable/?teacher_id=${selectedTeacher}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(res => {
      const data = res.data;
      const formattedTimetable = {};

      days.forEach(day => {
        formattedTimetable[day] = Array(periods.length).fill(null);
      });

      data.forEach(entry => {
        const { day, time, subject, type, room } = entry;
        if (!day || !time) return;

        const [start, end] = time.split(" - ");
        const startIndex = periods.findIndex(p => p.startsWith(start.trim()));
        const endIndex = periods.findIndex(p => p.endsWith(end.trim()));
        let span = 1;

        if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
          span = endIndex - startIndex + 1;

          formattedTimetable[day][startIndex] = {
            text: `${subject} (${type}) [Room ${room}]`,
            span: span
          };

          for (let i = 1; i < span; i++) {
            formattedTimetable[day][startIndex + i] = "SKIP";
          }
        } else {
          console.warn(`⚠️ Invalid period mapping for: ${time}`);
        }
      });

      setTimetable(formattedTimetable);
    })
    .catch(err => console.error("Error fetching timetable:", err));
  };

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

      <div className="overflow-x-auto">
        <table className="table table-bordered table-striped text-center">
          <thead className="table-danger">
            <tr>
              <th>Periods / Days</th>
              {periodLabels.map((label, idx) => (
                <th key={idx}>{label}</th>
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
    </div>
  );
};

export default FacultyTimetable;
