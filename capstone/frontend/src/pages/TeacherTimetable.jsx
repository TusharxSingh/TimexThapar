import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import API_URL from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

const TeacherTimetable = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState(createEmptyTimetable());
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchTimetable = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user?.first_name) {
      setStatus({ type: 'warning', message: 'Update your profile first to see the timetable.' });
      setTimetable(createEmptyTimetable());
      return;
    }

    const normalize = (value) => (value || '').trim().toLowerCase();

    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const teachersRes = await axios.get(`${API_URL}/api/teachers/`, {
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
        setStatus({ type: 'warning', message: 'No teacher record matched your profile yet.' });
        return;
      }

      const timetableRes = await axios.get(
        `${API_URL}/api/timetable/?teacher_id=${match.id}`,
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
        setStatus({ type: 'warning', message: 'No timetable entries saved for you yet.' });
      } else {
        setStatus({ type: 'success', message: 'Timetable loaded successfully.' });
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setTimetable(createEmptyTimetable());
      setStatus({ type: 'error', message: 'Unable to load timetable right now.' });
    } finally {
      setIsLoading(false);
    }
  }, [user?.first_name, user?.last_name]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const displayName = user?.first_name?.trim()
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : (user?.username || 'Teacher');

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => navigate('/teacher-dashboard')}
            className="btn btn-link p-0"
            style={{ border: 'none', padding: '0', background: 'none' }}
          >
            <img src="/back-arrow.svg" alt="Back" style={{ width: '32px', height: '32px' }} />
          </button>
          <h2 className="mb-0 text-danger">Your Timetable</h2>
        </div>
        <div className="d-flex gap-2">
          {isLoading && <span className="text-muted align-self-center">Loading...</span>}
          <button className="btn btn-outline-danger" onClick={fetchTimetable}>
            Refresh
          </button>
        </div>
      </div>

      {status.message && (
        <div className={`alert ${status.type === 'error' ? 'alert-danger' : status.type === 'warning' ? 'alert-warning' : 'alert-success'}`}>
          {status.message}
        </div>
      )}

      <div className="table-responsive shadow-sm">
        <table className="table table-bordered table-striped text-center mb-0">
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
                  for (let i = 0; i < periods.length; i += 1) {
                    const entry = timetable[day]?.[i];
                    if (entry === 'SKIP') continue;

                    if (entry && typeof entry === 'object') {
                      cells.push(
                        <td key={`${day}-${i}`} colSpan={entry.span}>
                          {entry.text}
                        </td>
                      );
                      i += entry.span - 1;
                    } else {
                      cells.push(<td key={`${day}-${i}`}></td>);
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

export default TeacherTimetable;

