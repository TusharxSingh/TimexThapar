import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import StudentDashboard from "../pages/StudentDashboard";
import TeacherDashboard from "../pages/TeacherDashboard";
import TeacherTimetable from "../pages/TeacherTimetable";
import AdminDashboard from "../pages/AdminDashboard";
import Teachers from "../pages/Teachers";
import Courses from "../pages/Courses";
import Rooms from "../pages/Rooms";
import GenerateTimeTable from "../pages/GenerateTimeTable";
import FacultyTimetable from '../pages/FacultyTimetable';
const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher-timetable" element={<TeacherTimetable />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/teachers" element={<Teachers />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/generatetimetable" element={<GenerateTimeTable />} />
      <Route path="/faculty-timetable" element={<FacultyTimetable />} />


    </Routes>
  </Router>
);

export default AppRoutes;
