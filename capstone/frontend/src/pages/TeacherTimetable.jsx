import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { days, periods, periodLabels, createEmptyTimetable, formatTimetableData } from '../constants/timetable';

const TeacherTimetable = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState(createEmptyTimetable());
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchTimetable = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    if (!user?.teacher_id) {
      setTimetable(createEmptyTimetable());
      setStatus({
        type: 'warning',
        message: 'Your account is not linked to a teacher profile yet. Ask an admin to link it.',
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const { data } = await axios.get(
        `${API_URL}/api/timetable/?teacher_id=${user.teacher_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const entries = data || [];
      setTimetable(formatTimetableData(entries));
      if (!entries.length) {
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
  }, [user?.teacher_id]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

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

