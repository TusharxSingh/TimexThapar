import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from 'react-bootstrap';

const WelcomeCards = () => {
  const { user } = useAuth();

  // Determine role from user object (assuming `user.role` is set)
  const userType = user?.role === 'teacher' ? 'teacher' : 'student';

  const teacherCards = [
    {
      title: 'Faculty Availability',
      text: 'Check available slots of other teachers for meetings.',
      link: '/faculty-availability',
      icon: 'bi-person-lines-fill'
    },
    {
      title: 'Classroom Availability',
      text: 'Check available rooms for extra classes and meetings.',
      link: '/classrooms',
      icon: 'bi-geo-alt-fill'
    }
  ];

  const studentCards = [
    {
      title: 'Find Your Teacher',
      text: 'Need to meet a teacher? Check their free slots and cabin location.',
      link: '/teacher-availability',
      icon: 'bi-person-lines-fill'
    },
    {
      title: 'Change PIN',
      text: 'Keep your account secure by updating your PIN regularly.',
      link: '/student-dashboard#profile-settings',
      icon: 'bi-key-fill'
    }
  ];

  const cardData = userType === 'teacher' ? teacherCards : studentCards;

  return (
    <div className="container mt-4">
      <h3 className="mb-1">Welcome {user?.first_name || user?.username}!</h3>
      <p className="mb-4">Stay Organised , Stay Ahead</p>
      <div className="row">
        {cardData.map((card, idx) => (
          <div className="col-md-4 mb-4" key={idx}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title>
                  <i className={`bi ${card.icon} me-2`}></i>
                  {card.title}
                </Card.Title>
                <Card.Text>{card.text}</Card.Text>
                <Button href={card.link} variant="primary">Go</Button>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeCards;
