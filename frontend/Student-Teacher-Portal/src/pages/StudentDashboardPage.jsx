import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../api';
import CourseCard from '../components/CourseCard';

const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    totalCredits: 0,
    avgGrade: 0,
    gpa: 0
  });
  const [courses, setCourses] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Function to calculate letter grade points
  const getGradePoints = (percentage) => {
    if (percentage >= 85) return 4.0; // A
    if (percentage >= 75) return 3.0; // B
    if (percentage >= 65) return 2.0; // C
    if (percentage >= 50) return 1.0; // D
    return 0.0; // F
  };

  // Function to calculate letter grade
  const calculateGrade = (total) => {
    if (total >= 85) return { grade: 'A', color: 'text-green-600' };
    if (total >= 75) return { grade: 'B', color: 'text-blue-600' };
    if (total >= 65) return { grade: 'C', color: 'text-yellow-600' };
    if (total >= 50) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const fetchData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const [coursesData, marksData] = await Promise.all([
          apiGet('/students/enrolled-courses', {
            'Authorization': `Bearer ${token}`
          }),
          apiGet('/students/marks', {
            'Authorization': `Bearer ${token}`
          })
        ]);

        const totalCredits = coursesData.reduce((sum, enrollment) => 
          sum + (enrollment.course?.credit_hours || 0), 0
        );

        const avgGrade = marksData.length > 0
          ? marksData.reduce((sum, m) => sum + m.total, 0) / marksData.length
          : 0;

        // Calculate GPA
        let totalGradePoints = 0;
        let totalAttemptedCredits = 0;
        
        // Match courses with marks to calculate weighted GPA
        for (const enrollment of coursesData) {
          const course = enrollment.course;
          if (!course) continue;
          
          const courseMarks = marksData.find(m => m.course_id === course.id);
          if (courseMarks && courseMarks.total > 0) {
            const gradePoints = getGradePoints(courseMarks.total);
            totalGradePoints += gradePoints * course.credit_hours;
            totalAttemptedCredits += course.credit_hours;
          }
        }
        
        const gpa = totalAttemptedCredits > 0 
          ? (totalGradePoints / totalAttemptedCredits).toFixed(2) 
          : '0.00';

        setStats({
          enrolledCourses: coursesData.length,
          totalCredits,
          avgGrade: avgGrade.toFixed(2),
          gpa: gpa
        });

        setCourses(coursesData.slice(0, 3)); // Only show recent courses
      } else if (activeTab === 'courses') {
        const data = await apiGet('/students/enrolled-courses', {
          'Authorization': `Bearer ${token}`
        });
        setCourses(data);
      } else if (activeTab === 'grades') {
        const data = await apiGet('/students/marks', {
          'Authorization': `Bearer ${token}`
        });
        setMarks(data);
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
            {activeTab === 'dashboard' && 'Welcome back, ' + user?.full_name + '!'}
            {activeTab === 'courses' && 'My Enrolled Courses'}
            {activeTab === 'grades' && 'My Grades'}
          </h1>
          <p className="text-gray-600 mt-2">
            {activeTab === 'dashboard' && 'Here\'s your academic overview'}
            {activeTab === 'courses' && 'View all your enrolled courses'}
            {activeTab === 'grades' && 'View your academic performance'}
          </p>
          {user?.student_id && activeTab === 'dashboard' && (
            <p className="text-gray-500 mt-1">Student ID: {user.student_id}</p>
          )}
          {user?.program && activeTab === 'dashboard' && (
            <p className="text-gray-500">Program: {user.program}</p>
          )}
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
              <button
                onClick={() => {setActiveTab('grades'); setLoading(true);}}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'grades'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Grades
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Enrolled Courses</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.enrolledCourses}</p>
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
                    <p className="text-gray-500 text-sm">Total Credits</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalCredits}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Average Grade</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.avgGrade}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Current GPA</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.gpa}</p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => navigate('/student/courses')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-left"
              >
                <h3 className="text-xl font-bold mb-2">Browse Courses</h3>
                <p className="text-blue-100">Explore and enroll in available courses</p>
              </button>

              <button
                onClick={() => navigate('/student/grades')}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-lg shadow-md hover:shadow-xl transition text-left"
              >
                <h3 className="text-xl font-bold mb-2">View Grades</h3>
                <p className="text-green-100">Check your academic performance</p>
              </button>
            </div>

            {/* Recent Courses */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Courses</h2>
              {courses.length > 0 ? (
                <div className="space-y-4">
                  {courses.map((enrollment) => (
                    <div key={enrollment.id} className="border-l-4 border-blue-600 pl-4 py-2">
                      <h3 className="font-semibold text-gray-800">{enrollment.course?.title}</h3>
                      <p className="text-sm text-gray-600">
                        {enrollment.course?.code} • {enrollment.course?.teacher_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No courses enrolled yet. Start exploring!</p>
              )}
            </div>
          </>
        )}

        {/* Courses Tab Content */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {courses.length > 0 ? (
              <div className="space-y-6">
                {courses.map((enrollment) => (
                  <div key={enrollment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-xl transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{enrollment.course?.title}</h3>
                        <p className="text-sm text-gray-500">{enrollment.course?.code}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                        Enrolled
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Instructor:</span> {enrollment.course?.teacher_name || 'TBA'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Credits:</span> {enrollment.course?.credit_hours}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Semester:</span> {enrollment.course?.semester}
                      </p>
                      {enrollment.course?.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {enrollment.course?.description}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => navigate(`/student/courses/${enrollment.course_id}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
                    >
                      View Course Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Enrolled Courses</h3>
                <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet</p>
                <button
                  onClick={() => navigate('/student/courses')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                >
                  Browse Courses
                </button>
              </div>
            )}
          </div>
        )}

        {/* Grades Tab Content */}
        {activeTab === 'grades' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* GPA Display */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Current GPA</h2>
                  <p className="text-gray-600">Based on all graded courses</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-indigo-600">{stats.gpa}</p>
                  <p className="text-gray-500">4.0 Scale</p>
                </div>
              </div>
            </div>

            {marks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Class Quiz
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Class Assign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Class Mid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Class Final
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Lab Quiz
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Lab Assign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Lab Mid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Lab Final
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        GPA Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {marks.map((mark) => {
                      const { grade, color } = calculateGrade(mark.total);
                      const gpaPoints = getGradePoints(mark.total);
                      return (
                        <tr key={mark.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{mark.course_title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mark.class_quiz.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mark.class_assignment.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mark.class_mid.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mark.class_final.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mark.lab_quiz.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mark.lab_assignment.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mark.lab_mid.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mark.lab_final.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {mark.total.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-lg font-bold ${color}`}>
                              {grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {gpaPoints.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Grades Yet</h3>
                <p className="text-gray-600">Your grades will appear here once your teachers post them</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboardPage;