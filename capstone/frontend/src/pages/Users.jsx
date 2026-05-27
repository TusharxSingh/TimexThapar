import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import API_URL from '../config';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import useDisplayName from '../hooks/useDisplayName';

const ROLES = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' },
];

const emptyForm = {
  username: '',
  password: '',
  role: 'teacher',
  first_name: '',
  last_name: '',
  roll_number: '',
  branch: '',
  year_of_study: '',
};

const Users = () => {
  const navigate = useNavigate();
  const displayName = useDisplayName('Admin');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const token = localStorage.getItem('accessToken');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/users/`, config);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setStatus({ type: 'error', message: 'Could not load users.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!formData.username.trim() || !formData.password.trim() || !formData.first_name.trim()) {
      setStatus({ type: 'error', message: 'Username, password, and first name are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.year_of_study === '') payload.year_of_study = null;
      if (payload.roll_number === '') payload.roll_number = null;
      if (payload.branch === '') payload.branch = null;

      await axios.post(`${API_URL}/api/users/`, payload, config);
      setStatus({
        type: 'success',
        message: `${formData.role} "${formData.username}" created successfully.`,
      });
      setFormData(emptyForm);
      fetchUsers();
    } catch (err) {
      const data = err.response?.data || {};
      const firstError =
        data.detail ||
        data.username?.[0] ||
        data.password?.[0] ||
        data.role?.[0] ||
        Object.values(data)[0] ||
        'Failed to create user.';
      setStatus({
        type: 'error',
        message: typeof firstError === 'string' ? firstError : 'Failed to create user.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/api/users/${id}/`, config);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete user.';
      setStatus({ type: 'error', message: msg });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = !roleFilter || u.role === roleFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      u.username?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.roll_number?.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const isStudent = formData.role === 'student';

  return (
    <div className="d-flex">
      <AdminSidebar />

      <div className="flex-grow-1 p-4" style={{ backgroundColor: '#fdfae4', minHeight: '100vh' }}>
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
        <p className="text-muted mb-4">Stay Organised, Stay Ahead</p>

        <h3 className="fw-bold mb-3">User Accounts</h3>

        {status.message && (
          <div className={`alert ${status.type === 'error' ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`}>
            {status.message}
            <button type="button" className="btn-close" onClick={() => setStatus({ type: '', message: '' })} />
          </div>
        )}

        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold mb-3">Create New User</h5>
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Role</label>
                <select className="form-select" name="role" value={formData.role} onChange={handleChange}>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Username</label>
                <input type="text" className="form-control" name="username" value={formData.username} onChange={handleChange} placeholder="login id" />
              </div>
              <div className="col-md-3">
                <label className="form-label">Password / PIN</label>
                <input type="text" className="form-control" name="password" value={formData.password} onChange={handleChange} placeholder="initial password" />
              </div>
              <div className="col-md-3">
                <label className="form-label">First Name</label>
                <input type="text" className="form-control" name="first_name" value={formData.first_name} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-control" name="last_name" value={formData.last_name} onChange={handleChange} />
              </div>

              {isStudent && (
                <>
                  <div className="col-md-3">
                    <label className="form-label">Roll Number</label>
                    <input type="text" className="form-control" name="roll_number" value={formData.roll_number} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Branch</label>
                    <input type="text" className="form-control" name="branch" value={formData.branch} onChange={handleChange} placeholder="e.g., CSE" />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Year</label>
                    <select className="form-select" name="year_of_study" value={formData.year_of_study} onChange={handleChange}>
                      <option value="">--</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                </>
              )}

              <div className="col-12">
                <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold mb-0">Existing Users</h5>
          <div className="d-flex gap-2 flex-wrap">
            <select
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ maxWidth: '160px' }}
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search username or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '260px' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover bg-white shadow-sm rounded">
            <thead className="table-light">
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Roll No.</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="spinner-border text-danger" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    {searchTerm || roleFilter ? 'No users match your filters.' : 'No users yet. Create one above.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'bg-danger' : u.role === 'teacher' ? 'bg-primary' : 'bg-success'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.first_name || '—'}</td>
                    <td>{u.last_name || '—'}</td>
                    <td>{u.roll_number || '—'}</td>
                    <td>{u.branch || '—'}</td>
                    <td>{u.year_of_study || '—'}</td>
                    <td>
                      <FaTrash
                        onClick={() => handleDelete(u.id, u.username)}
                        className="text-danger"
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="alert alert-info mt-3 mb-0 small">
          <strong>Tip:</strong> For teachers to see their timetable, the user's First Name + Last Name must match
          the Teacher record on the <button className="btn btn-link p-0 align-baseline" onClick={() => navigate('/teachers')}>Teachers page</button>.
        </div>
      </div>
    </div>
  );
};

export default Users;
