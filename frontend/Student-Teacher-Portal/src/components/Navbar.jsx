import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (user?.role === 'student') {
      return [
        { name: 'Dashboard', path: '/student/dashboard' },
        { name: 'All Courses', path: '/student/courses' },
        { name: 'My Courses', path: '/student/enrolled' },
        { name: 'My Grades', path: '/student/grades' },
      ];
    } else if (user?.role === 'teacher') {
      return [
        { name: 'Dashboard', path: '/teacher/dashboard' },
        { name: 'My Courses', path: '/teacher/courses' },
      ];
    } else if (user?.role === 'admin') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard' },
      ];
    }
    return [];
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold">Student-Teacher-Portal</h1>
            <div className="flex space-x-4">
              {getNavLinks().map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded transition"
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;