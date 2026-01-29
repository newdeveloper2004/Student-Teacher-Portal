import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../api';

const LoginRegister = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    program: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Login form submitted with data:', { email: formData.email, password: formData.password });
    setError('');
    setLoading(true);

    try {
      const data = await apiPost('/auth/login', {
        email: formData.email,
        password: formData.password
      });
      console.log('Login successful, received data:', data);
      
      login(data.access_token, data.user);
      
      if (data.user.role === 'STUDENT') {
        console.log('Redirecting to student dashboard');
        navigate('/student/dashboard');
      } else if (data.user.role === 'TEACHER') {
        console.log('Redirecting to teacher dashboard');
        navigate('/teacher/dashboard');
      } else if (data.user.role === 'ADMIN') {
        console.log('Redirecting to admin dashboard');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('Registration form submitted with data:', formData);
    setError('');
    setLoading(true);

    try {
      const data = await apiPost('/auth/register', formData);
      console.log('Registration successful, received data:', data);

      if (formData.role === 'TEACHER') {
        alert('Teacher account created! Please wait for admin approval.');
        setIsLogin(true); // Switch to login form
      } else {
        login(data.access_token, data.user);
        
        if (data.user.role === 'STUDENT') {
          console.log('Redirecting to student dashboard');
          navigate('/student/dashboard');
        } else if (data.user.role === 'ADMIN') {
          console.log('Redirecting to admin dashboard');
          navigate('/admin/dashboard');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="flex mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 text-center font-semibold ${
              isLogin 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 text-center font-semibold ${
              !isLogin 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Register
          </button>
        </div>

        {isLogin ? (
          <>
            <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Welcome Back</h2>
            <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center mt-6 text-gray-600">
              Don't have an account?{' '}
              <button 
                onClick={() => setIsLogin(false)}
                className="text-blue-600 hover:underline font-semibold"
              >
                Register here
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Student-Teacher-Portal</h2>
            <p className="text-center text-gray-600 mb-8">Create your account</p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </div>

              {formData.role === 'STUDENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program
                  </label>
                  <select
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    required={formData.role === 'STUDENT'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Program</option>
                    <option value="BCS">Computer Science (BCS)</option>
                    <option value="BSE">Software Engineering (BSE)</option>
                    <option value="BAI">Artificial Intelligence (BAI)</option>
                    <option value="BDS">Data Science (BDS)</option>
                    <option value="BEE">Electrical Engineering (BEE)</option>
                    <option value="BCY">Cyber Security (BCY)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center mt-6 text-gray-600">
              Already have an account?{' '}
              <button 
                onClick={() => setIsLogin(true)}
                className="text-blue-600 hover:underline font-semibold"
              >
                Sign in here
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginRegister;