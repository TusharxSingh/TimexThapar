import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import API_URL from '../config';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({ name: '', capacity: '', type: '', available: true });

  const navigate = useNavigate(); // 👈 React Router hook for navigation

  const token = localStorage.getItem('accessToken');
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = () => {
    axios
      .get(`${API_URL}/api/rooms/`, authHeaders)
      .then(res => setRooms(res.data))
      .catch(err => console.error(err));
  };

  const handleShowModal = (room = null) => {
    if (room) {
      setEditMode(true);
      setCurrentRoom(room);
    } else {
      setEditMode(false);
      setCurrentRoom({ name: '', capacity: '', type: '', available: true });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentRoom({
      ...currentRoom,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const request = editMode
      ? axios.put(`${API_URL}/api/rooms/${currentRoom.id}/`, currentRoom, authHeaders)
      : axios.post(`${API_URL}/api/rooms/`, currentRoom, authHeaders);

    request
      .then(() => {
        fetchRooms();
        handleCloseModal();
      })
      .catch(console.error);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      axios
        .delete(`${API_URL}/api/rooms/${id}/`, authHeaders)
        .then(fetchRooms)
        .catch(console.error);
    }
  };
  const { user, logout } = useAuth();
  
  const displayName = user?.first_name?.trim()
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    if (logout) logout();
    navigate('/');
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="bg-danger text-white d-flex flex-column align-items-center p-4" style={{ width: '260px' }}>
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
      <div className="flex-grow-1 p-5" style={{ backgroundColor: '#fdfbe6' }}>
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
          <p className="mb-4">Stay Organised , Stay Ahead</p>

          <h2 className="fw-bold mb-3">Rooms</h2>
          <p className="text-muted">Existing Rooms</p>
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>Room Name</th>
                <th>Capacity</th>
                <th>Type</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.name}</td>
                  <td>{room.capacity}</td>
                  <td>{room.type}</td>
                  <td>{room.available ? 'Yes' : 'No'}</td>
                  <td>
                    <FaEdit
                      className="text-primary me-2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleShowModal(room)}
                    />
                    <FaTrash
                      className="text-danger"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleDelete(room.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Button variant="danger" onClick={() => handleShowModal()} className="mt-3">
            Add Rooms
          </Button>
      </div>

      {/* Modal for Add/Edit Room */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Room' : 'Add Room'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Room Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentRoom.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Capacity</Form.Label>
              <Form.Control
                type="number"
                name="capacity"
                value={currentRoom.capacity}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select name="type" value={currentRoom.type} onChange={handleChange} required>
                <option value="">Select Type</option>
                <option value="Lab">Lab</option>
                <option value="Theatre">Theatre</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Available"
                name="available"
                checked={currentRoom.available}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              {editMode ? 'Update' : 'Add'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Rooms;
