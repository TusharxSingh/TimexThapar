import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const LoginForm = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    role: '',
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password, role } = formData;

    try {
      const response = await axios.post(`${API_URL}/api/login/`, {
        username,
        password,
      });

      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('userRole', role.toLowerCase());

      const userInfoRes = await axios.get(`${API_URL}/api/user-info/`, {
        headers: {
          Authorization: `Bearer ${response.data.access}`,
        },
      });

      setUser(userInfoRes.data);

      if (role.toLowerCase() === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (role.toLowerCase() === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/student-dashboard');
      }

    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      alert("Invalid credentials or server error.");
    }
  };

  return (
    <div className="p-5 shadow rounded bg-white w-100" style={{ maxWidth: '400px' }}>
      <h2 className="fw-bold mb-1">TimexThapar </h2>
      <p className="mb-4 text-muted"></p>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Select your role to proceed</Form.Label>
          <Form.Select name="role" value={formData.role} onChange={handleChange}>
            <option value="">-- Select Role --</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
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
          />
        </Form.Group>

        <Button variant="danger" type="submit" className="w-100 fw-bold">
          Login
        </Button>
      </Form>
    </div>
  );
};

export default LoginForm;
