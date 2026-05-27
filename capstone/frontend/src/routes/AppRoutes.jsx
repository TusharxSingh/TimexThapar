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
import FacultyTimetable from "../pages/FacultyTimetable";
import Users from "../pages/Users";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/ProtectedRoute";

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/student-dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />

      <Route path="/teacher-dashboard" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherDashboard />
        </ProtectedRoute>
      } />

      <Route path="/teacher-timetable" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherTimetable />
        </ProtectedRoute>
      } />

      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/teachers" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Teachers />
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Users />
        </ProtectedRoute>
      } />

      <Route path="/courses" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Courses />
        </ProtectedRoute>
      } />

      <Route path="/rooms" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Rooms />
        </ProtectedRoute>
      } />

      <Route path="/generatetimetable" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <GenerateTimeTable />
        </ProtectedRoute>
      } />

      <Route path="/faculty-timetable" element={
        <ProtectedRoute allowedRoles={['student', 'teacher']}>
          <FacultyTimetable />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default AppRoutes;
