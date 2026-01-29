import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  
  console.log('=== PROTECTED ROUTE CHECK ===');
  console.log('User:', user);
  console.log('Loading:', loading);
  console.log('Required role:', role);

  if (loading) {
    console.log('Still loading auth state...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role.toUpperCase()) {
    console.log(`Role mismatch. User role: ${user.role}, Required role: ${role.toUpperCase()}`);
    return <Navigate to="/login" />;
  }

  console.log('Access granted to protected route');
  return children;
};

export default ProtectedRoute;