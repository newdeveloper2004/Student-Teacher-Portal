import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('=== AUTH CONTEXT INIT ===');
    // Load user from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('Stored token:', storedToken);
    console.log('Stored user:', storedUser);
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Setting user from localStorage:', parsedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
    console.log('Auth context initialized');
  }, []);

  const login = (accessToken, userData) => {
    console.log('=== LOGIN FUNCTION CALLED ===');
    console.log('Access token:', accessToken);
    console.log('User data:', userData);
    
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    console.log('User and token saved to state and localStorage');
  };

  const logout = () => {
    console.log('=== LOGOUT FUNCTION CALLED ===');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('User logged out');
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!token
  };

  console.log('Auth context value:', value);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};