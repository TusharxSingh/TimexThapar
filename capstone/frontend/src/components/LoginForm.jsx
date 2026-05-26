import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const LoginForm = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { username, password } = formData;

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/login/`, {
        username,
        password,
      });

      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);

      const userInfoRes = await axios.get(`${API_URL}/api/user-info/`, {
        headers: {
          Authorization: `Bearer ${response.data.access}`,
        },
      });

      const serverRole = userInfoRes.data.role;
      localStorage.setItem('userRole', serverRole);
      setUser(userInfoRes.data);

      if (serverRole === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (serverRole === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/student-dashboard');
      }

    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials or server error.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 shadow rounded bg-white w-100" style={{ maxWidth: '400px' }}>
      <h2 className="fw-bold mb-1">TimexThapar</h2>
      <p className="mb-4 text-muted">Campus Timetable Management</p>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
            required
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />
        </Form.Group>

        <Button variant="danger" type="submit" className="w-100 fw-bold" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </Form>
    </div>
  );
};

export default LoginForm;
