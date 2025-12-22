import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    prefix: '',
    first_name: '',
    last_name: '',
    designation: '',
    email: '',
  });
  const [editId, setEditId] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');

  const displayName = user?.first_name?.trim()
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'Admin';

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/teachers/', config);
      setTeachers(res.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleChange = (e) => {
    setNewTeacher({ ...newTeacher, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await axios.put(`http://localhost:8000/api/teachers/${editId}/`, newTeacher, config);
        setEditId(null);
      } else {
        await axios.post('http://localhost:8000/api/teachers/', newTeacher, config);
      }
      setNewTeacher({ prefix: '', first_name: '', last_name: '', designation: '', email: '' });
      setShowForm(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error submitting teacher:', error);
    }
  };

  const handleEdit = (teacher) => {
    setNewTeacher(teacher);
    setEditId(teacher.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/teachers/${id}/`, config);
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    if (logout) logout();
    navigate('/');
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-danger text-white d-flex flex-column align-items-center p-4" style={{ width: '260px', minHeight: '100vh' }}>
        <h5 className="fw-bold mb-4 text-capitalize">{displayName}</h5>
        <ul className="nav flex-column text-center w-100 gap-3">
          <li className="nav-item">
            <button className="nav-link text-white btn btn-link p-0 w-100" onClick={() => navigate('/admin-dashboard')}>
              Dashboard
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link text-white btn btn-link p-0 w-100" onClick={() => navigate('/admin-dashboard#profile-settings')}>
              Profile Settings
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link text-white btn btn-link p-0 w-100" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f9f8e3' }}>
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
        <p className="text-muted">Stay Organised, Stay Ahead</p>

        <h2 className="fw-bold mt-4">Teachers</h2>
        <p className="text-muted">Existing Teachers</p>

        <div className="table-responsive">
          <table className="table align-middle table-striped">
            <thead className="fw-bold">
              <tr>
                <th>Prefix</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Designation</th>
                <th style={{ minWidth: '200px' }}>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td>{t.prefix}</td>
                  <td>{t.first_name}</td>
                  <td>{t.last_name}</td>
                  <td>{t.designation}</td>
                  <td className="text-truncate" style={{ maxWidth: '200px' }}>{t.email}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(t)}>
                      <FaEdit />
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDelete(t.id)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-end">
          <button
            className="btn btn-sm btn-light text-danger border border-danger"
            onClick={() => {
              setShowForm(!showForm);
              setNewTeacher({ prefix: '', first_name: '', last_name: '', designation: '', email: '' });
              setEditId(null);
            }}
          >
            {editId ? 'Cancel Editing' : 'Add New Entry'}
          </button>
        </div>

        {showForm && (
          <div className="row g-2 mt-3">
            <div className="col-md-2">
              <input
                type="text"
                name="prefix"
                className="form-control"
                placeholder="Prefix (e.g., Dr., Mr.)"
                value={newTeacher.prefix}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="text"
                name="first_name"
                className="form-control"
                placeholder="First Name"
                value={newTeacher.first_name}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="text"
                name="last_name"
                className="form-control"
                placeholder="Last Name"
                value={newTeacher.last_name}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="text"
                name="designation"
                className="form-control"
                placeholder="Designation"
                value={newTeacher.designation}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Email"
                value={newTeacher.email}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-danger w-100" onClick={handleSubmit}>
                {editId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teachers;
