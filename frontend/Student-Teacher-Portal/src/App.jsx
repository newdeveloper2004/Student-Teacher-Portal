import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import LoginRegister from './pages/LoginRegister';
import StudentDashboardPage from './pages/StudentDashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import CoursePage from './pages/CoursePage';

function App() {
  console.log('=== APP COMPONENT RENDERING ===');
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/register" element={<Navigate to="/login" />} />
          
          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute role="student">
                <StudentDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/courses" 
            element={
              <ProtectedRoute role="student">
                <CoursePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/courses/:id" 
            element={
              <ProtectedRoute role="student">
                <CoursePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/enrolled" 
            element={<Navigate to="/student/dashboard" />} 
          />
          <Route 
            path="/student/grades" 
            element={<Navigate to="/student/dashboard" />} 
          />
          
          {/* Teacher Routes */}
          <Route 
            path="/teacher/dashboard" 
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/courses" 
            element={
              <ProtectedRoute role="teacher">
                <CoursePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/course/:id" 
            element={
              <ProtectedRoute role="teacher">
                <CoursePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;