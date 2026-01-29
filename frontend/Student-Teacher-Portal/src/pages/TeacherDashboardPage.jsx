import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../api';

const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'dashboard') {
        // Fetch courses with sections
        const coursesData = await apiGet('/teachers/my-courses', {
          'Authorization': `Bearer ${token}`
        });
        
        // Fetch student counts for each course
        const studentCounts = {};
        for (const course of coursesData) {
          try {
            const students = await apiGet(`/teachers/courses/${course.id}/students`, {
              'Authorization': `Bearer ${token}`
            });
            studentCounts[course.id] = students.length;
          } catch (error) {
            studentCounts[course.id] = 0;
          }
        }
        
        setCourses(coursesData);
        setStats({
          totalCourses: coursesData.length,
          totalStudents: Object.values(studentCounts).reduce((sum, count) => sum + count, 0)
        });
      } else if (activeTab === 'courses') {
        const data = await apiGet('/teachers/my-courses', {
          'Authorization': `Bearer ${token}`
        });
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {activeTab === 'dashboard' && 'Welcome, ' + user?.name + '!'}
            {activeTab === 'courses' && 'Assigned Courses'}
          </h1>
          <p className="text-gray-600 mt-2">
            {activeTab === 'dashboard' && 'View your assigned courses'}
            {activeTab === 'courses' && 'View all courses assigned to you by admin'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => {setActiveTab('dashboard'); setLoading(true);}}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'dashboard'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {setActiveTab('courses'); setLoading(true);}}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'courses'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Courses
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">My Courses</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalCourses}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Active Students</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalStudents}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => navigate('/teacher/courses')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-left"
              >
                <h3 className="text-xl font-bold mb-2">View Courses</h3>
                <p className="text-blue-100">See all your assigned courses</p>
              </button>

              <button
                onClick={() => navigate('/teacher/courses')}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-left"
              >
                <h3 className="text-xl font-bold mb-2">Grade Students</h3>
                <p className="text-green-100">Update marks and attendance</p>
              </button>
            </div>

            {/* My Courses */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Assigned Courses & Sections</h2>
              {courses.length > 0 ? (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">{course.title}</h3>
                          <p className="text-sm text-gray-600">{course.code}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/teacher/course/${course.id}`)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                        >
                          View Details
                        </button>
                      </div>
                      
                      {course.sections && course.sections.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium text-gray-700">Your Sections:</h4>
                          {course.sections.map((section) => (
                            <div key={section.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                              <div>
                                <p className="font-medium text-gray-800">{section.class_name}</p>
                                <p className="text-sm text-gray-600">
                                  Program: {section.program}{section.section ? ` - Section ${section.section}` : ''}
                                </p>
                              </div>
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {/* Student count would go here */}
                                Students: 0
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 italic">No sections assigned yet</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No courses assigned to you yet. Please contact admin.</p>
              )}
            </div>
          </>
        )}

        {/* Courses Tab Content */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {courses.length > 0 ? (
              <div className="space-y-6">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{course.title}</h3>
                        <p className="text-sm text-gray-500">{course.code}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/teacher/course/${course.id}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      >
                        View Details
                      </button>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Credits:</span> {course.credit_hours} {course.has_lab ? '(Lab)' : ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Semester:</span> {course.semester}
                      </p>
                      {course.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                      )}
                    </div>
                    
                    {course.sections && course.sections.length > 0 ? (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Your Sections:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {course.sections.map((section) => (
                            <div key={section.id} className="bg-gray-50 p-3 rounded">
                              <p className="font-medium text-gray-800">{section.class_name}</p>
                              <p className="text-sm text-gray-600">
                                {section.program}{section.section ? ` - ${section.section}` : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 italic">No sections assigned to you yet</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Courses Assigned</h3>
                <p className="text-gray-600">Please contact admin to assign courses to you</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboardPage;