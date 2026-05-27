import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import API_URL from '../config';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import useDisplayName from '../hooks/useDisplayName';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTeacher, setNewTeacher] = useState({
    prefix: '',
    first_name: '',
    last_name: '',
    designation: '',
    email: '',
  });
  const [editId, setEditId] = useState(null);

  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');
  const displayName = useDisplayName('Admin');

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/teachers/`, config);
      setTeachers(res.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.first_name?.toLowerCase().includes(q) ||
      t.last_name?.toLowerCase().includes(q) ||
      t.designation?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleChange = (e) => {
    setNewTeacher({ ...newTeacher, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await axios.put(`${API_URL}/api/teachers/${editId}/`, newTeacher, config);
        setEditId(null);
      } else {
        await axios.post(`${API_URL}/api/teachers/`, newTeacher, config);
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
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await axios.delete(`${API_URL}/api/teachers/${id}/`, config);
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  return (
    <div className="d-flex">
      <AdminSidebar />

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
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <p className="text-muted mb-0">Existing Teachers</p>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search by name, designation or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '320px' }}
          />
        </div>

        <div className="table-responsive">
          <table className="table align-middle table-striped">
            <thead className="fw-bold">
              <tr>
                <th>Prefix</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Designation</th>
                <th style={{ minWidth: '200px' }}>Email</th>
                <th>Linked Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="spinner-border text-danger" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    {searchTerm ? 'No teachers match your search.' : 'No teachers yet. Add one below.'}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => (
                  <tr key={t.id}>
                    <td>{t.prefix}</td>
                    <td>{t.first_name}</td>
                    <td>{t.last_name}</td>
                    <td>{t.designation}</td>
                    <td className="text-truncate" style={{ maxWidth: '200px' }}>{t.email}</td>
                    <td>
                      {t.linked_username
                        ? <span className="badge bg-info text-dark">{t.linked_username}</span>
                        : <span className="text-muted small">—</span>}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(t)}>
                        <FaEdit />
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDelete(t.id)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
